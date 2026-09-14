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
exports.JobsService = exports.CALLBACK_QUEUE = exports.CLEANUP_QUEUE = exports.WHATSAPP_RETRY_QUEUE = exports.FOLLOWUP_QUEUE = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const call_schema_1 = require("../calls/call.schema");
const callback_schema_1 = require("../callback/callback.schema");
const lead_schema_1 = require("../leads/lead.schema");
const followup_orchestrator_service_1 = require("../followup/followup-orchestrator.service");
const conversations_service_1 = require("../conversations/conversations.service");
const calls_service_1 = require("../calls/calls.service");
const schedule_1 = require("@nestjs/schedule");
exports.FOLLOWUP_QUEUE = 'followup-queue';
exports.WHATSAPP_RETRY_QUEUE = 'whatsapp-retry-queue';
exports.CLEANUP_QUEUE = 'cleanup-queue';
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
        const redisUrl = this.config.get('REDIS_URL', 'redis://localhost:6379');
        this.connection = new ioredis_1.default(redisUrl, {
            maxRetriesPerRequest: null,
        });
        this.followupQueue = new bullmq_1.Queue(exports.FOLLOWUP_QUEUE, {
            connection: this.connection,
        });
        this.callbackQueue = new bullmq_1.Queue(exports.CALLBACK_QUEUE, {
            connection: this.connection,
        });
        this.whatsappRetryQueue = new bullmq_1.Queue(exports.WHATSAPP_RETRY_QUEUE, {
            connection: this.connection,
        });
    }
    async onModuleInit() {
        this.startFollowupWorker();
        this.startCallbackWorker();
        this.logger.log('JobsService initialized');
    }
    startFollowupWorker() {
        this.followupWorker = new bullmq_1.Worker(exports.FOLLOWUP_QUEUE, async (job) => {
            const { callId } = job.data;
            this.logger.log({
                callId,
                jobId: job.id,
            }, 'Processing post-call follow-up job');
            await this.followupOrchestrator.processCompletedCall(callId);
        }, {
            connection: this.connection.duplicate(),
            concurrency: 5,
        });
        this.followupWorker.on('completed', (job) => {
            this.logger.log({
                jobId: job.id,
            }, 'Follow-up job completed');
        });
        this.followupWorker.on('failed', (job, error) => {
            this.logger.error({
                jobId: job?.id,
                error: error.message,
            }, 'Follow-up job failed');
        });
        this.followupWorker.on('error', (error) => {
            this.logger.error({
                error: error.message,
            }, 'Follow-up worker error');
        });
    }
    startCallbackWorker() {
        this.callbackWorker = new bullmq_1.Worker(exports.CALLBACK_QUEUE, async (job) => {
            const { callbackId } = job.data;
            this.logger.log({
                callbackId,
                jobId: job.id,
            }, 'Processing callback job');
            await this.processCallback(callbackId);
        }, {
            connection: this.connection.duplicate(),
            concurrency: 3,
        });
        this.callbackWorker.on('completed', (job) => {
            this.logger.log({
                jobId: job.id,
            }, 'Callback job completed');
        });
        this.callbackWorker.on('failed', (job, error) => {
            this.logger.error({
                jobId: job?.id,
                error: error.message,
            }, 'Callback job failed');
        });
        this.callbackWorker.on('error', (error) => {
            this.logger.error({
                error: error.message,
            }, 'Callback worker error');
        });
    }
    async enqueuePostCallFollowup(callId) {
        const callIdString = callId.toString();
        await this.followupQueue.add('post-call-followup', {
            callId: callIdString,
        }, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000,
            },
            removeOnComplete: true,
        });
        this.logger.log({
            callId: callIdString,
        }, 'Post-call follow-up job enqueued');
    }
    async enqueueWhatsappRetry(messageId, phoneNumber, message) {
        await this.whatsappRetryQueue.add('whatsapp-retry', {
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
        });
        this.logger.log({
            messageId,
            phoneNumber,
        }, 'WhatsApp retry job enqueued');
    }
    async processScheduledCallbacks() {
        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        this.logger.log({
            now,
            oneHourFromNow,
        }, 'Checking callbacks scheduled within the next hour');
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
        if (callbacks.length === 0) {
            this.logger.log('No callbacks scheduled within the next hour');
            return;
        }
        this.logger.log({
            count: callbacks.length,
        }, 'Found callbacks scheduled within the next hour');
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
                    this.logger.log({
                        callbackId: callback._id.toString(),
                    }, 'Callback already queued or processed');
                    continue;
                }
                if (!callback.parsedDateTime) {
                    this.logger.warn({
                        callbackId: callback._id.toString(),
                    }, 'Callback has no parsedDateTime');
                    continue;
                }
                const delay = Math.max(callback.parsedDateTime.getTime() - Date.now(), 0);
                await this.callbackQueue.add('execute-callback', {
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
                    scheduledTime: callback.parsedDateTime,
                    delayMs: delay,
                }, 'Callback queued successfully');
            }
            catch (error) {
                this.logger.error({
                    callbackId: callback._id.toString(),
                    error: error instanceof Error
                        ? error.message
                        : 'Unknown error',
                }, 'Failed to queue callback');
            }
        }
    }
    async processCallback(callbackId) {
        const callback = await this.callbackModel
            .findById(callbackId)
            .exec();
        if (!callback) {
            this.logger.error({ callbackId }, 'Callback not found');
            return;
        }
        if (callback.status !== 'queued') {
            this.logger.warn({
                callbackId,
                status: callback.status,
            }, 'Callback is not in queued state');
            return;
        }
        try {
            const originalCall = await this.callModel
                .findById(callback.callId)
                .exec();
            if (!originalCall) {
                throw new Error('Original call not found');
            }
            let transcript = originalCall.transcript || '';
            if (!transcript) {
                transcript =
                    await this.conversationsService.getTranscriptText(originalCall._id);
            }
            const lead = await this.leadModel
                .findOne({
                callId: originalCall._id,
            })
                .exec();
            if (!lead) {
                throw new Error('Lead not found for callback');
            }
            await this.callbackModel.findOneAndUpdate({
                _id: callback._id,
                status: 'queued',
            }, {
                $set: {
                    status: 'in-progress',
                    updatedAt: new Date(),
                },
            });
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
            await this.callbackModel.findByIdAndUpdate(callback._id, {
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
            }, 'Scheduled callback started successfully');
        }
        catch (error) {
            const errorMessage = error instanceof Error
                ? error.message
                : 'Unknown error';
            await this.callbackModel.findByIdAndUpdate(callback._id, {
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
        await this.followupWorker?.close();
        await this.callbackWorker?.close();
        await this.followupQueue.close();
        await this.callbackQueue.close();
        await this.whatsappRetryQueue.close();
        await this.connection.quit();
        this.logger.log('JobsService closed');
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