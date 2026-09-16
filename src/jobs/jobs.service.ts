import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { Cron } from '@nestjs/schedule';

import { Call } from '../calls/call.schema';
import { Callback } from '@/callback/callback.schema';
import { Lead } from '../leads/lead.schema';

import { FollowupOrchestratorService } from '../followup/followup-orchestrator.service';
import { ConversationsService } from '../conversations/conversations.service';
import { CallsService } from '@/calls/calls.service';

export const FOLLOWUP_QUEUE = 'followup-queue';
export const WHATSAPP_RETRY_QUEUE = 'whatsapp-retry-queue';
export const CALLBACK_QUEUE = 'callback-queue';

export type FollowUpStatus =
  | 'pending'
  | 'scheduled'
  | 'in-progress'
  | 'completed'
  | 'cancelled';

export type CallbackStatus =
  | 'pending'
  | 'scheduled'
  | 'queued'
  | 'in-progress'
  | 'completed'
  | 'cancelled';

@Injectable()
export class JobsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobsService.name);

  private redis!: Redis;

  private followupQueue!: Queue;
  private callbackQueue!: Queue;
  private whatsappRetryQueue!: Queue;

  private followupWorker?: Worker;
  private callbackWorker?: Worker;

  private readonly redisUrl: string;

  constructor(
    private readonly config: ConfigService,

    @InjectModel(Call.name)
    private readonly callModel: Model<Call>,

    @InjectModel(Callback.name)
    private readonly callbackModel: Model<Callback>,

    @InjectModel(Lead.name)
    private readonly leadModel: Model<Lead>,

    private readonly followupOrchestrator: FollowupOrchestratorService,

    private readonly conversationsService: ConversationsService,

    private readonly callsService: CallsService,
  ) {
    const redisUrl =
      this.config.get<string>('REDIS_URL');

    if (!redisUrl) {
      throw new Error(
        'REDIS_URL is not configured',
      );
    }

    this.redisUrl = redisUrl;

    this.logger.log(
      `Redis URL configured: ${this.maskRedisUrl(redisUrl)}`,
    );
    this.redis = new Redis(this.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,

      retryStrategy: (times) => {
        const delay = Math.min(
          times * 500,
          5000,
        );

        this.logger.warn(
          `Redis retry #${times} in ${delay}ms`,
        );

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
      this.logger.error(
        `Redis ERROR: ${error.message}`,
      );
    });

    this.followupQueue = new Queue(
      FOLLOWUP_QUEUE,
      {
        connection: {
          url: this.redisUrl,
          maxRetriesPerRequest: null,
        },
      },
    );

    this.callbackQueue = new Queue(
      CALLBACK_QUEUE,
      {
        connection: {
          url: this.redisUrl,
          maxRetriesPerRequest: null,
        },
      },
    );

    this.whatsappRetryQueue = new Queue(
      WHATSAPP_RETRY_QUEUE,
      {
        connection: {
          url: this.redisUrl,
          maxRetriesPerRequest: null,
        },
      },
    );
  }


  // INIT

  async onModuleInit(): Promise<void> {
    this.logger.log(
      ' JobsService onModuleInit',
    );

    await this.testRedis();

    await this.startFollowupWorker();

    await this.startCallbackWorker();

    await this.waitForWorkers();

    await this.logFollowupQueueState(
      'AFTER WORKERS STARTED',
    );

    this.logger.log(
      ' All BullMQ workers started',
    );
  }


  // REDIS TEST


  private async testRedis(): Promise<void> {
    try {
      this.logger.log(
        ' Testing Redis...',
      );

      const ping =
        await this.redis.ping();

      this.logger.log(
        ` Redis PING: ${ping}`,
      );

      const info =
        await this.redis.info(
          'server',
        );

      const version =
        info
          .split('\n')
          .find((line) =>
            line.startsWith(
              'redis_version:',
            ),
          );

      this.logger.log(
        ` Redis version: ${version ?? 'unknown'}`,
      );

      this.logger.log(
        ` Redis status: ${this.redis.status}`,
      );

      const dbSize =
        await this.redis.dbsize();

      this.logger.log(
        ` Redis DB size: ${dbSize}`,
      );
    } catch (error) {
      this.logger.error(
        ' Redis test failed',
        error instanceof Error
          ? error.stack
          : String(error),
      );

      throw error;
    }
  }


  // FOLLOWUP WORKER

  private async startFollowupWorker(): Promise<void> {
    this.logger.log(
      ' Creating FOLLOWUP worker',
    );

    this.followupWorker =
      new Worker(
        FOLLOWUP_QUEUE,

        async (
          job: Job,
        ) => {
          this.logger.log(
            ` FOLLOWUP JOB RECEIVED: ${job.id}`,
          );

          this.logger.log(
            {
              jobId: job.id,
              jobName: job.name,
              jobData: job.data,
            },
            ' FOLLOWUP JOB DATA',
          );

          const {
            callId,
          } = job.data as {
            callId?: string;
          };

          if (!callId) {
            throw new Error(
              'FOLLOWUP job is missing callId',
            );
          }

          this.logger.log(
            ` Processing call: ${callId}`,
          );

          const result =
            await this.followupOrchestrator
              .processCompletedCall(
                callId,
              );

          this.logger.log(
            {
              jobId: job.id,
              callId,
              result,
            },
            ' FOLLOWUP PROCESSING FINISHED',
          );

          return result;
        },

        {
          connection: {
            url: this.redisUrl,
            maxRetriesPerRequest: null,
          },
          concurrency: 5,
          autorun: true,
          drainDelay: 5,
          lockDuration: 60000,
        },
      );


    // WORKER EVENTS


    this.followupWorker.on(
      'ready',
      async () => {
        this.logger.log(
          ' FOLLOWUP WORKER READY',
        );

        await this.logFollowupQueueState(
          'WORKER READY',
        );

        const waiting =
          await this.followupQueue.getWaiting(
            0,
            20,
          );

        this.logger.log(
          {
            count: waiting.length,
            jobs: waiting.map(
              (job) => ({
                id: job.id,
                name: job.name,
                data: job.data,
              }),
            ),
          },
          ' WAITING FOLLOWUP JOBS',
        );
      },
    );

    this.followupWorker.on(
      'active',
      (job) => {
        this.logger.log(
          {
            jobId: job.id,
            name: job.name,
            data: job.data,
          },
          ' FOLLOWUP JOB ACTIVE',
        );
      },
    );

    this.followupWorker.on(
      'completed',
      (job, result) => {
        this.logger.log(
          {
            jobId: job.id,
            result,
          },
          ' FOLLOWUP JOB COMPLETED',
        );
      },
    );

    this.followupWorker.on(
      'failed',
      (job, error) => {
        this.logger.error(
          {
            jobId: job?.id,
            jobName: job?.name,
            jobData: job?.data,
            error: error.message,
            stack: error.stack,
          },
          ' FOLLOWUP JOB FAILED',
        );
      },
    );

    this.followupWorker.on(
      'stalled',
      (jobId) => {
        this.logger.error(
          ` FOLLOWUP JOB STALLED: ${jobId}`,
        );
      },
    );

    this.followupWorker.on(
      'error',
      (error) => {
        this.logger.error(
          ` FOLLOWUP WORKER ERROR: ${error.message}`,
          error.stack,
        );
      },
    );


    await this.followupWorker.waitUntilReady();

    this.logger.log(
      ' FOLLOWUP WORKER CREATED + READY',
    );
  }


  // CALLBACK WORKER

  private async startCallbackWorker(): Promise<void> {
    this.logger.log(
      ' Creating CALLBACK worker',
    );

    this.callbackWorker =
      new Worker(
        CALLBACK_QUEUE,

        async (
          job: Job,
        ) => {
          this.logger.log(
            {
              jobId: job.id,
              name: job.name,
              data: job.data,
            },
            ' CALLBACK JOB RECEIVED',
          );

          const {
            callbackId,
          } = job.data as {
            callbackId?: string;
          };

          if (!callbackId) {
            throw new Error(
              'Callback job is missing callbackId',
            );
          }

          await this.processCallback(
            callbackId,
          );
        },

        {
          connection: {
            url: this.redisUrl,
            maxRetriesPerRequest: null,
          },

          concurrency: 3,

          autorun: true,

          drainDelay: 5,

          lockDuration: 60000,
        },
      );

    this.callbackWorker.on(
      'ready',
      () => {
        this.logger.log(
          ' CALLBACK WORKER READY',
        );
      },
    );

    this.callbackWorker.on(
      'active',
      (job) => {
        this.logger.log(
          {
            jobId: job.id,
            name: job.name,
            data: job.data,
          },
          ' CALLBACK JOB ACTIVE',
        );
      },
    );

    this.callbackWorker.on(
      'completed',
      (job) => {
        this.logger.log(
          {
            jobId: job.id,
          },
          ' CALLBACK JOB COMPLETED',
        );
      },
    );

    this.callbackWorker.on(
      'failed',
      (job, error) => {
        this.logger.error(
          {
            jobId: job?.id,
            error: error.message,
            stack: error.stack,
          },
          ' CALLBACK JOB FAILED',
        );
      },
    );

    this.callbackWorker.on(
      'stalled',
      (jobId) => {
        this.logger.error(
          ` CALLBACK JOB STALLED: ${jobId}`,
        );
      },
    );

    this.callbackWorker.on(
      'error',
      (error) => {
        this.logger.error(
          ` CALLBACK WORKER ERROR: ${error.message}`,
          error.stack,
        );
      },
    );

    await this.callbackWorker.waitUntilReady();

    this.logger.log(
      ' CALLBACK WORKER CREATED + READY',
    );
  }


  // WAIT FOR WORKERS


  private async waitForWorkers(): Promise<void> {
    if (this.followupWorker) {
      await this.followupWorker.waitUntilReady();
    }

    if (this.callbackWorker) {
      await this.callbackWorker.waitUntilReady();
    }

    this.logger.log(
      ' All BullMQ workers are ready',
    );
  }


  // QUEUE STATE


  private async logFollowupQueueState(
    source: string,
  ): Promise<void> {
    try {
      const counts =
        await this.followupQueue.getJobCounts(
          'waiting',
          'active',
          'completed',
          'failed',
          'delayed',
          'paused',
        );

      this.logger.log(
        {
          source,
          ...counts,
        },
        ` FOLLOWUP QUEUE [${source}]`,
      );
    } catch (error) {
      this.logger.error(
        `Failed reading followup queue: ${error instanceof Error
          ? error.message
          : String(error)
        }`,
      );
    }
  }


  // ENQUEUE POST-CALL FOLLOWUP


  async enqueuePostCallFollowup(
    callId: string | Types.ObjectId,
  ): Promise<void> {
    const callIdString =
      callId.toString();

    this.logger.log(
      {
        queue: FOLLOWUP_QUEUE,
        callId: callIdString,
      },
      ' ABOUT TO ADD FOLLOWUP JOB',
    );

    const job =
      await this.followupQueue.add(
        'POST_CALL_FOLLOWUP',
        {
          callId: callIdString,
        },
        {
          attempts: 3,

          backoff: {
            type: 'exponential',
            delay: 5000,
          },

          removeOnComplete: false,

          removeOnFail: false,
        },
      );

    this.logger.log(
      {
        jobId: job.id,
        name: job.name,
        data: job.data,
      },
      ' FOLLOWUP JOB CREATED',
    );

    const state =
      await job.getState();

    this.logger.log(
      {
        jobId: job.id,
        state,
      },
      ' FOLLOWUP JOB STATE',
    );

    await this.logFollowupQueueState(
      'AFTER ADD',
    );

    setTimeout(
      async () => {
        try {
          const latest =
            await this.followupQueue.getJob(
              job.id!,
            );

          if (!latest) {
            this.logger.warn(
              `Job ${job.id} no longer exists`,
            );

            return;
          }

          const latestState =
            await latest.getState();

          this.logger.log(
            {
              jobId: latest.id,
              state: latestState,
            },
            ' FOLLOWUP JOB STATE AFTER 5 SECONDS',
          );

          await this.logFollowupQueueState(
            '5 SECONDS AFTER ADD',
          );
        } catch (error) {
          this.logger.error(
            'Delayed followup inspection failed',
            error instanceof Error
              ? error.stack
              : String(error),
          );
        }
      },
      5000,
    );
  }


  // WHATSAPP RETRY


  async enqueueWhatsappRetry(
    messageId: string,
    phoneNumber: string,
    message: string,
  ): Promise<void> {
    const job =
      await this.whatsappRetryQueue.add(
        'whatsapp-retry',
        {
          messageId,
          phoneNumber,
          message,
        },
        {
          attempts: 3,

          backoff: {
            type: 'exponential',
            delay: 10000,
          },

          removeOnComplete: true,

          removeOnFail: false,
        },
      );

    this.logger.log(
      {
        jobId: job.id,
        messageId,
        phoneNumber,
      },
      'WhatsApp retry job enqueued',
    );
  }


  // CALLBACK CRON


  @Cron('*/59 * * * *')
  async processScheduledCallbacks(): Promise<void> {
    const now =
      new Date();

    const oneHourFromNow =
      new Date(
        now.getTime() +
        60 * 60 * 1000,
      );

    this.logger.log(
      {
        now,
        oneHourFromNow,
      },
      'Checking callbacks scheduled within next hour',
    );

    const callbacks =
      await this.callbackModel
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
      this.logger.log(
        'No callbacks scheduled within next hour',
      );

      return;
    }

    for (
      const callback of callbacks
    ) {
      try {
        const updated =
          await this.callbackModel.findOneAndUpdate(
            {
              _id: callback._id,
              status: 'scheduled',
            },
            {
              $set: {
                status: 'queued',
                updatedAt: new Date(),
              },
            },
            {
              new: true,
            },
          );

        if (!updated) {
          continue;
        }

        if (!callback.parsedDateTime) {
          this.logger.warn(
            {
              callbackId:
                callback._id.toString(),
            },
            'Callback has no parsedDateTime',
          );

          continue;
        }

        const delay =
          Math.max(
            callback.parsedDateTime.getTime() -
            Date.now(),
            0,
          );

        const job =
          await this.callbackQueue.add(
            'execute-callback',
            {
              callbackId:
                callback._id.toString(),
            },
            {
              delay,

              attempts: 3,

              backoff: {
                type: 'exponential',
                delay: 5000,
              },

              removeOnComplete: true,

              removeOnFail: false,
            },
          );

        this.logger.log(
          {
            callbackId:
              callback._id.toString(),
            jobId: job.id,
            scheduledTime:
              callback.parsedDateTime,
            delayMs: delay,
          },
          'Callback queued successfully',
        );
      } catch (error) {
        this.logger.error(
          {
            callbackId:
              callback._id.toString(),
            error:
              error instanceof Error
                ? error.message
                : String(error),
          },
          'Failed to queue callback',
        );
      }
    }
  }


  // PROCESS CALLBACK


  private async processCallback(
    callbackId: string,
  ): Promise<void> {
    const callback =
      await this.callbackModel
        .findById(callbackId)
        .exec();

    if (!callback) {
      throw new Error(
        `Callback not found: ${callbackId}`,
      );
    }

    if (
      callback.status !== 'queued'
    ) {
      this.logger.warn(
        {
          callbackId,
          status: callback.status,
        },
        'Callback is not queued',
      );

      return;
    }

    try {
      const originalCall =
        await this.callModel
          .findById(
            callback.callId,
          )
          .exec();

      if (!originalCall) {
        throw new Error(
          'Original call not found',
        );
      }

      let transcript =
        originalCall.transcript ||
        '';

      if (!transcript) {
        transcript =
          await this.conversationsService
            .getTranscriptText(
              originalCall._id,
            );
      }

      const lead =
        await this.leadModel
          .findOne({
            callId:
              originalCall._id,
          })
          .exec();

      if (!lead) {
        throw new Error(
          'Lead not found for callback',
        );
      }

      const updated =
        await this.callbackModel
          .findOneAndUpdate(
            {
              _id: callback._id,
              status: 'queued',
            },
            {
              $set: {
                status: 'in-progress',
                updatedAt: new Date(),
              },
            },
            {
              new: true,
            },
          );

      if (!updated) {
        throw new Error(
          'Callback was already processed by another worker',
        );
      }

      const callbackContext = {
        callbackId:
          callback._id.toString(),

        originalCallId:
          originalCall._id.toString(),

        transcript,

        lead: {
          name: lead.name,

          productDescription:
            lead.productDescription,

          productCount:
            lead.productCount,

          budget:
            lead.budget,

          currency:
            lead.currency,

          timeline:
            lead.timeline,

          requiredFeatures:
            lead.requiredFeatures,

          painPoints:
            lead.painPoints,

          barriers:
            lead.barriers,

          objections:
            lead.objections,

          buyingSignals:
            lead.buyingSignals,

          temperature:
            lead.temperature,

          language:
            lead.language,
        },
      };

      this.logger.log(
        {
          callbackId,
          phoneNumber:
            originalCall.phoneNumber,
        },
        'Starting scheduled callback',
      );

      const result =
        await this.callsService.startCall(
          originalCall.phoneNumber,
          originalCall.metadata.assistantId,
          callbackContext,
        );

      await this.callbackModel
        .findByIdAndUpdate(
          callback._id,
          {
            $set: {
              callbackCallId:
                new Types.ObjectId(
                  result.callId,
                ),

              status: 'in-progress',

              updatedAt: new Date(),
            },
          },
        );

      this.logger.log(
        {
          callbackId,
          callId: result.callId,
          vapiCallId: result.vapiCallId,
        },
        'Scheduled callback started',
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : String(error);

      await this.callbackModel
        .findByIdAndUpdate(
          callback._id,
          {
            $set: {
              status: 'scheduled',
              updatedAt: new Date(),
              error: errorMessage,
            },
          },
        );

      this.logger.error(
        {
          callbackId,
          error: errorMessage,
        },
        'Failed to start scheduled callback',
      );

      throw error;
    }
  }


  // SHUTDOWN


  async onModuleDestroy(): Promise<void> {
    this.logger.log(
      ' Shutting down JobsService...',
    );

    try {
      await this.followupWorker?.close();

      await this.callbackWorker?.close();

      await this.followupQueue.close();

      await this.callbackQueue.close();

      await this.whatsappRetryQueue.close();

      await this.redis.quit();

      this.logger.log(
        ' JobsService closed',
      );
    } catch (error) {
      this.logger.error(
        ' JobsService shutdown error',
        error instanceof Error
          ? error.stack
          : String(error),
      );
    }
  }


  // HELPERS


  private maskRedisUrl(
    url: string,
  ): string {
    try {
      const parsed =
        new URL(url);

      if (parsed.password) {
        parsed.password = '***';
      }

      return parsed.toString();
    } catch {
      return 'configured';
    }
  }
}
