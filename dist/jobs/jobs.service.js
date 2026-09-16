"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var JobsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsService = exports.CALLBACK_QUEUE = exports.WHATSAPP_RETRY_QUEUE = exports.FOLLOWUP_QUEUE = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const schedule_1 = require("@nestjs/schedule");
const call_schema_1 = require("../calls/call.schema");
const callback_schema_1 = require("../callback/callback.schema");
const lead_schema_1 = require("../leads/lead.schema");
const followup_orchestrator_service_1 = require("../followup/followup-orchestrator.service");
const conversations_service_1 = require("../conversations/conversations.service");
const calls_service_1 = require("../calls/calls.service");
exports.FOLLOWUP_QUEUE = 'followup-queue';
exports.WHATSAPP_RETRY_QUEUE = 'whatsapp-retry-queue';
exports.CALLBACK_QUEUE = 'callback-queue';
let JobsService = JobsService_1 = class JobsService {
    constructor(config, callModel, callbackModel, leadModel, followupOrchestrator, conversationsService, callsService) {
        this.config = config;
        this.callModel = callModel;
        this.callbackModel = callbackModel;
        this.leadModel = leadModel;
        this.followupOrchestrator = followupOrchestrator;
        this.conversationsService = conversationsService;
        this.callsService = callsService;
        this.logger = new common_1.Logger(JobsService_1.name);
        const redisUrl = this.config.get('REDIS_URL');
        if (!redisUrl) {
            throw new Error('REDIS_URL is not configured');
        }
        this.redisUrl = redisUrl;
        this.logger.log(`Redis URL configured: ${this.maskRedisUrl(redisUrl)}`);
        this.redis = new ioredis_1.default(this.redisUrl, {
            maxRetriesPerRequest: null,
            enableReadyCheck: true,
            retryStrategy: (times) => {
                const delay = Math.min(times * 500, 5000);
                this.logger.warn(`Redis retry #${times} in ${delay}ms`);
                return delay;
            },
        });
        this.redis.on('connect', () => {
            this.logger.log('🔌 Redis connecting');
        });
        this.redis.on('ready', () => {
            this.logger.log(' Redis READY');
        });
        this.redis.on('error', (error) => {
            this.logger.error(`Redis ERROR: ${error.message}`);
        });
        this.followupQueue = new bullmq_1.Queue(exports.FOLLOWUP_QUEUE, {
            connection: {
                url: this.redisUrl,
                maxRetriesPerRequest: null,
            },
        });
        this.callbackQueue = new bullmq_1.Queue(exports.CALLBACK_QUEUE, {
            connection: {
                url: this.redisUrl,
                maxRetriesPerRequest: null,
            },
        });
        this.whatsappRetryQueue = new bullmq_1.Queue(exports.WHATSAPP_RETRY_QUEUE, {
            connection: {
                url: this.redisUrl,
                maxRetriesPerRequest: null,
            },
        });
    }
    async onModuleInit() {
        this.logger.log(' JobsService onModuleInit');
        await this.testRedis();
        await this.startFollowupWorker();
        await this.startCallbackWorker();
        await this.waitForWorkers();
        await this.logFollowupQueueState('AFTER WORKERS STARTED');
        this.logger.log(' All BullMQ workers started');
    }
    async testRedis() {
        try {
            this.logger.log(' Testing Redis...');
            const ping = await this.redis.ping();
            this.logger.log(` Redis PING: ${ping}`);
            const info = await this.redis.info('server');
            const version = info
                .split('\n')
                .find((line) => line.startsWith('redis_version:'));
            this.logger.log(` Redis version: ${version ?? 'unknown'}`);
            this.logger.log(` Redis status: ${this.redis.status}`);
            const dbSize = await this.redis.dbsize();
            this.logger.log(` Redis DB size: ${dbSize}`);
        }
        catch (error) {
            this.logger.error(' Redis test failed', error instanceof Error
                ? error.stack
                : String(error));
            throw error;
        }
    }
    async startFollowupWorker() {
        this.logger.log(' Creating FOLLOWUP worker');
        this.followupWorker =
            new bullmq_1.Worker(exports.FOLLOWUP_QUEUE, async (job) => {
                this.logger.log(` FOLLOWUP JOB RECEIVED: ${job.id}`);
                this.logger.log({
                    jobId: job.id,
                    jobName: job.name,
                    jobData: job.data,
                }, ' FOLLOWUP JOB DATA');
                const { callId, } = job.data;
                if (!callId) {
                    throw new Error('FOLLOWUP job is missing callId');
                }
                this.logger.log(` Processing call: ${callId}`);
                const result = await this.followupOrchestrator
                    .processCompletedCall(callId);
                this.logger.log({
                    jobId: job.id,
                    callId,
                    result,
                }, ' FOLLOWUP PROCESSING FINISHED');
                return result;
            }, {
                connection: {
                    url: this.redisUrl,
                    maxRetriesPerRequest: null,
                },
                concurrency: 5,
                autorun: true,
                drainDelay: 5,
                lockDuration: 60000,
            });
        this.followupWorker.on('ready', async () => {
            this.logger.log(' FOLLOWUP WORKER READY');
            await this.logFollowupQueueState('WORKER READY');
            const waiting = await this.followupQueue.getWaiting(0, 20);
            this.logger.log({
                count: waiting.length,
                jobs: waiting.map((job) => ({
                    id: job.id,
                    name: job.name,
                    data: job.data,
                })),
            }, ' WAITING FOLLOWUP JOBS');
        });
        this.followupWorker.on('active', (job) => {
            this.logger.log({
                jobId: job.id,
                name: job.name,
                data: job.data,
            }, ' FOLLOWUP JOB ACTIVE');
        });
        this.followupWorker.on('completed', (job, result) => {
            this.logger.log({
                jobId: job.id,
                result,
            }, ' FOLLOWUP JOB COMPLETED');
        });
        this.followupWorker.on('failed', (job, error) => {
            this.logger.error({
                jobId: job?.id,
                jobName: job?.name,
                jobData: job?.data,
                error: error.message,
                stack: error.stack,
            }, ' FOLLOWUP JOB FAILED');
        });
        this.followupWorker.on('stalled', (jobId) => {
            this.logger.error(` FOLLOWUP JOB STALLED: ${jobId}`);
        });
        this.followupWorker.on('error', (error) => {
            this.logger.error(` FOLLOWUP WORKER ERROR: ${error.message}`, error.stack);
        });
        await this.followupWorker.waitUntilReady();
        this.logger.log(' FOLLOWUP WORKER CREATED + READY');
    }
    async startCallbackWorker() {
        this.logger.log(' Creating CALLBACK worker');
        this.callbackWorker =
            new bullmq_1.Worker(exports.CALLBACK_QUEUE, async (job) => {
                this.logger.log({
                    jobId: job.id,
                    name: job.name,
                    data: job.data,
                }, ' CALLBACK JOB RECEIVED');
                const { callbackId, } = job.data;
                if (!callbackId) {
                    throw new Error('Callback job is missing callbackId');
                }
                await this.processCallback(callbackId);
            }, {
                connection: {
                    url: this.redisUrl,
                    maxRetriesPerRequest: null,
                },
                concurrency: 3,
                autorun: true,
                drainDelay: 5,
                lockDuration: 60000,
            });
        this.callbackWorker.on('ready', () => {
            this.logger.log(' CALLBACK WORKER READY');
        });
        this.callbackWorker.on('active', (job) => {
            this.logger.log({
                jobId: job.id,
                name: job.name,
                data: job.data,
            }, ' CALLBACK JOB ACTIVE');
        });
        this.callbackWorker.on('completed', (job) => {
            this.logger.log({
                jobId: job.id,
            }, ' CALLBACK JOB COMPLETED');
        });
        this.callbackWorker.on('failed', (job, error) => {
            this.logger.error({
                jobId: job?.id,
                error: error.message,
                stack: error.stack,
            }, ' CALLBACK JOB FAILED');
        });
        this.callbackWorker.on('stalled', (jobId) => {
            this.logger.error(` CALLBACK JOB STALLED: ${jobId}`);
        });
        this.callbackWorker.on('error', (error) => {
            this.logger.error(` CALLBACK WORKER ERROR: ${error.message}`, error.stack);
        });
        await this.callbackWorker.waitUntilReady();
        this.logger.log(' CALLBACK WORKER CREATED + READY');
    }
    async waitForWorkers() {
        if (this.followupWorker) {
            await this.followupWorker.waitUntilReady();
        }
        if (this.callbackWorker) {
            await this.callbackWorker.waitUntilReady();
        }
        this.logger.log(' All BullMQ workers are ready');
    }
    async logFollowupQueueState(source) {
        try {
            const counts = await this.followupQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed', 'paused');
            this.logger.log({
                source,
                ...counts,
            }, ` FOLLOWUP QUEUE [${source}]`);
        }
        catch (error) {
            this.logger.error(`Failed reading followup queue: ${error instanceof Error
                ? error.message
                : String(error)}`);
        }
    }
    async enqueuePostCallFollowup(callId) {
        const callIdString = callId.toString();
        this.logger.log({
            queue: exports.FOLLOWUP_QUEUE,
            callId: callIdString,
        }, ' ABOUT TO ADD FOLLOWUP JOB');
        const job = await this.followupQueue.add('POST_CALL_FOLLOWUP', {
            callId: callIdString,
        }, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000,
            },
            removeOnComplete: false,
            removeOnFail: false,
        });
        this.logger.log({
            jobId: job.id,
            name: job.name,
            data: job.data,
        }, ' FOLLOWUP JOB CREATED');
        const state = await job.getState();
        this.logger.log({
            jobId: job.id,
            state,
        }, ' FOLLOWUP JOB STATE');
        await this.logFollowupQueueState('AFTER ADD');
        setTimeout(async () => {
            try {
                const latest = await this.followupQueue.getJob(job.id);
                if (!latest) {
                    this.logger.warn(`Job ${job.id} no longer exists`);
                    return;
                }
                const latestState = await latest.getState();
                this.logger.log({
                    jobId: latest.id,
                    state: latestState,
                }, ' FOLLOWUP JOB STATE AFTER 5 SECONDS');
                await this.logFollowupQueueState('5 SECONDS AFTER ADD');
            }
            catch (error) {
                this.logger.error('Delayed followup inspection failed', error instanceof Error
                    ? error.stack
                    : String(error));
            }
        }, 5000);
    }
    async enqueueWhatsappRetry(messageId, phoneNumber, message) {
        const job = await this.whatsappRetryQueue.add('whatsapp-retry', {
            messageId,
            phoneNumber,
            message,
        }, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 10000,
            },
            removeOnComplete: true,
            removeOnFail: false,
        });
        this.logger.log({
            jobId: job.id,
            messageId,
            phoneNumber,
        }, 'WhatsApp retry job enqueued');
    }
    async processScheduledCallbacks() {
        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() +
            60 * 60 * 1000);
        this.logger.log({
            now,
            oneHourFromNow,
        }, 'Checking callbacks scheduled within next hour');
        const callbacks = await this.callbackModel
            .find({
            status: 'scheduled',
            parsedDateTime: {
                $gte: now,
                $lte: oneHourFromNow,
            },
        })
            .sort({
            parsedDateTime: 1,
        })
            .limit(50)
            .exec();
        if (!callbacks.length) {
            this.logger.log('No callbacks scheduled within next hour');
            return;
        }
        for (const callback of callbacks) {
            try {
                const updated = await this.callbackModel.findOneAndUpdate({
                    _id: callback._id,
                    status: 'scheduled',
                }, {
                    $set: {
                        status: 'queued',
                        updatedAt: new Date(),
                    },
                }, {
                    new: true,
                });
                if (!updated) {
                    continue;
                }
                if (!callback.parsedDateTime) {
                    this.logger.warn({
                        callbackId: callback._id.toString(),
                    }, 'Callback has no parsedDateTime');
                    continue;
                }
                const delay = Math.max(callback.parsedDateTime.getTime() -
                    Date.now(), 0);
                const job = await this.callbackQueue.add('execute-callback', {
                    callbackId: callback._id.toString(),
                }, {
                    delay,
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 5000,
                    },
                    removeOnComplete: true,
                    removeOnFail: false,
                });
                this.logger.log({
                    callbackId: callback._id.toString(),
                    jobId: job.id,
                    scheduledTime: callback.parsedDateTime,
                    delayMs: delay,
                }, 'Callback queued successfully');
            }
            catch (error) {
                this.logger.error({
                    callbackId: callback._id.toString(),
                    error: error instanceof Error
                        ? error.message
                        : String(error),
                }, 'Failed to queue callback');
            }
        }
    }
    async processCallback(callbackId) {
        const callback = await this.callbackModel
            .findById(callbackId)
            .exec();
        if (!callback) {
            throw new Error(`Callback not found: ${callbackId}`);
        }
        if (callback.status !== 'queued') {
            this.logger.warn({
                callbackId,
                status: callback.status,
            }, 'Callback is not queued');
            return;
        }
        try {
            const originalCall = await this.callModel
                .findById(callback.callId)
                .exec();
            if (!originalCall) {
                throw new Error('Original call not found');
            }
            let transcript = originalCall.transcript ||
                '';
            if (!transcript) {
                transcript =
                    await this.conversationsService
                        .getTranscriptText(originalCall._id);
            }
            const lead = await this.leadModel
                .findOne({
                callId: originalCall._id,
            })
                .exec();
            if (!lead) {
                throw new Error('Lead not found for callback');
            }
            const updated = await this.callbackModel
                .findOneAndUpdate({
                _id: callback._id,
                status: 'queued',
            }, {
                $set: {
                    status: 'in-progress',
                    updatedAt: new Date(),
                },
            }, {
                new: true,
            });
            if (!updated) {
                throw new Error('Callback was already processed by another worker');
            }
            const callbackContext = {
                callbackId: callback._id.toString(),
                originalCallId: originalCall._id.toString(),
                transcript,
                lead: {
                    name: lead.name,
                    productDescription: lead.productDescription,
                    productCount: lead.productCount,
                    budget: lead.budget,
                    currency: lead.currency,
                    timeline: lead.timeline,
                    requiredFeatures: lead.requiredFeatures,
                    painPoints: lead.painPoints,
                    barriers: lead.barriers,
                    objections: lead.objections,
                    buyingSignals: lead.buyingSignals,
                    temperature: lead.temperature,
                    language: lead.language,
                },
            };
            this.logger.log({
                callbackId,
                phoneNumber: originalCall.phoneNumber,
            }, 'Starting scheduled callback');
            const result = await this.callsService.startCall(originalCall.phoneNumber, originalCall.metadata.assistantId, callbackContext);
            await this.callbackModel
                .findByIdAndUpdate(callback._id, {
                $set: {
                    callbackCallId: new mongoose_2.Types.ObjectId(result.callId),
                    status: 'in-progress',
                    updatedAt: new Date(),
                },
            });
            this.logger.log({
                callbackId,
                callId: result.callId,
                vapiCallId: result.vapiCallId,
            }, 'Scheduled callback started');
        }
        catch (error) {
            const errorMessage = error instanceof Error
                ? error.message
                : String(error);
            await this.callbackModel
                .findByIdAndUpdate(callback._id, {
                $set: {
                    status: 'scheduled',
                    updatedAt: new Date(),
                    error: errorMessage,
                },
            });
            this.logger.error({
                callbackId,
                error: errorMessage,
            }, 'Failed to start scheduled callback');
            throw error;
        }
    }
    async onModuleDestroy() {
        this.logger.log(' Shutting down JobsService...');
        try {
            await this.followupWorker?.close();
            await this.callbackWorker?.close();
            await this.followupQueue.close();
            await this.callbackQueue.close();
            await this.whatsappRetryQueue.close();
            await this.redis.quit();
            this.logger.log(' JobsService closed');
        }
        catch (error) {
            this.logger.error(' JobsService shutdown error', error instanceof Error
                ? error.stack
                : String(error));
        }
    }
    maskRedisUrl(url) {
        try {
            const parsed = new URL(url);
            if (parsed.password) {
                parsed.password = '***';
            }
            return parsed.toString();
        }
        catch {
            return 'configured';
        }
    }
};
exports.JobsService = JobsService;
__decorate([
    (0, schedule_1.Cron)('*/59 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], JobsService.prototype, "processScheduledCallbacks", null);
exports.JobsService = JobsService = JobsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(call_schema_1.Call.name)),
    __param(2, (0, mongoose_1.InjectModel)(callback_schema_1.Callback.name)),
    __param(3, (0, mongoose_1.InjectModel)(lead_schema_1.Lead.name)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        followup_orchestrator_service_1.FollowupOrchestratorService,
        conversations_service_1.ConversationsService,
        calls_service_1.CallsService])
], JobsService);
//# sourceMappingURL=jobs.service.js.map