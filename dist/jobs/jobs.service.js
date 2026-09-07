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
exports.JobsService = exports.CLEANUP_QUEUE = exports.WHATSAPP_RETRY_QUEUE = exports.FOLLOWUP_QUEUE = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const call_schema_1 = require("../calls/call.schema");
const followup_orchestrator_service_1 = require("../followup/followup-orchestrator.service");
exports.FOLLOWUP_QUEUE = 'followup-queue';
exports.WHATSAPP_RETRY_QUEUE = 'whatsapp-retry-queue';
exports.CLEANUP_QUEUE = 'cleanup-queue';
let JobsService = JobsService_1 = class JobsService {
    constructor(config, callModel, followupOrchestrator) {
        this.config = config;
        this.callModel = callModel;
        this.followupOrchestrator = followupOrchestrator;
        this.logger = new common_1.Logger(JobsService_1.name);
        const redisUrl = this.config.get('REDIS_URL', 'redis://localhost:6379');
        this.connection = new ioredis_1.default(redisUrl, { maxRetriesPerRequest: null });
        this.followupQueue = new bullmq_1.Queue(exports.FOLLOWUP_QUEUE, { connection: this.connection });
    }
    async onModuleInit() {
        this.startFollowupWorker();
    }
    startFollowupWorker() {
        this.worker = new bullmq_1.Worker(exports.FOLLOWUP_QUEUE, async (job) => {
            const { callId } = job.data;
            this.logger.log({ callId, jobId: job.id }, 'Processing post-call follow-up job');
            await this.followupOrchestrator.processCompletedCall(callId);
        }, { connection: this.connection.duplicate(), concurrency: 5 });
        this.worker.on('completed', (job) => {
            this.logger.log({ jobId: job.id }, 'Follow-up job completed');
        });
        this.worker.on('failed', (job, err) => {
            this.logger.error({ jobId: job?.id, err: err.message }, 'Follow-up job failed');
        });
    }
    async enqueuePostCallFollowup(callId) {
        await this.followupQueue.add('post-call-followup', { callId }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: true });
        this.logger.log({ callId }, 'Post-call follow-up job enqueued');
    }
    async enqueueWhatsappRetry(messageId, phoneNumber, message) {
        const retryQueue = new bullmq_1.Queue(exports.WHATSAPP_RETRY_QUEUE, { connection: this.connection });
        await retryQueue.add('whatsapp-retry', { messageId, phoneNumber, message }, { attempts: 3, backoff: { type: 'exponential', delay: 10000 }, removeOnComplete: true });
    }
    async processScheduledCallbacks() {
        this.logger.log('Checking for scheduled callbacks due for execution');
    }
};
exports.JobsService = JobsService;
exports.JobsService = JobsService = JobsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(call_schema_1.Call.name)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        mongoose_2.Model,
        followup_orchestrator_service_1.FollowupOrchestratorService])
], JobsService);
//# sourceMappingURL=jobs.service.js.map