import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { Call } from '../calls/call.schema';
import { FollowupOrchestratorService } from '../followup/followup-orchestrator.service';

export const FOLLOWUP_QUEUE = 'followup-queue';
export const WHATSAPP_RETRY_QUEUE = 'whatsapp-retry-queue';
export const CLEANUP_QUEUE = 'cleanup-queue';

@Injectable()
export class JobsService implements OnModuleInit {
  private readonly logger = new Logger(JobsService.name);
  private connection: Redis;
  private followupQueue: Queue;
  private worker?: Worker;

  constructor(
    private config: ConfigService,
    @InjectModel(Call.name) private callModel: Model<Call>,
    private followupOrchestrator: FollowupOrchestratorService,
  ) {
    const redisUrl = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');
    this.connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
    this.followupQueue = new Queue(FOLLOWUP_QUEUE, { connection: this.connection });
  }

  async onModuleInit() {
    this.startFollowupWorker();
  }

  private startFollowupWorker() {
    this.worker = new Worker(
      FOLLOWUP_QUEUE,
      async (job) => {
        const { callId } = job.data as { callId: string };
        this.logger.log({ callId, jobId: job.id }, 'Processing post-call follow-up job');
        await this.followupOrchestrator.processCompletedCall(callId);
      },
      { connection: this.connection.duplicate(), concurrency: 5 },
    );

    this.worker.on('completed', (job) => {
      this.logger.log({ jobId: job.id }, 'Follow-up job completed');
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error({ jobId: job?.id, err: err.message }, 'Follow-up job failed');
    });
  }

  async enqueuePostCallFollowup(callId: string): Promise<void> {
    await this.followupQueue.add(
      'post-call-followup',
      { callId },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: true },
    );
    this.logger.log({ callId }, 'Post-call follow-up job enqueued');
  }

  async enqueueWhatsappRetry(messageId: string, phoneNumber: string, message: string): Promise<void> {
    const retryQueue = new Queue(WHATSAPP_RETRY_QUEUE, { connection: this.connection });
    await retryQueue.add(
      'whatsapp-retry',
      { messageId, phoneNumber, message },
      { attempts: 3, backoff: { type: 'exponential', delay: 10000 }, removeOnComplete: true },
    );
  }

  async processScheduledCallbacks(): Promise<void> {
    // This would be called by a cron job to check upcoming callbacks
    // and enqueue outbound calls at the scheduled time
    this.logger.log('Checking for scheduled callbacks due for execution');
  }
}
