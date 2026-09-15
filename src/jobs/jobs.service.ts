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

import { Call } from '../calls/call.schema';
import { Callback } from '@/callback/callback.schema';
import { Lead } from '../leads/lead.schema'

import { FollowupOrchestratorService } from '../followup/followup-orchestrator.service';
// import { ExtractionService } from '../lead/extraction.service';
import { ConversationsService } from '../conversations/conversations.service';
import { CallsService } from '@/calls/calls.service';
// import { FollowupGenService } from '../followup/followup-gen.service';
// import { WhatsappService } from '../whatsapp/whatsapp.service';
// import { ActionEvent } from '../action-events/action-event.schema';
import { Cron, CronExpression } from '@nestjs/schedule';

export const FOLLOWUP_QUEUE = 'followup-queue';
export const WHATSAPP_RETRY_QUEUE = 'whatsapp-retry-queue';
export const CLEANUP_QUEUE = 'cleanup-queue';
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

  private connection: Redis;

  private followupQueue: Queue;
  private callbackQueue: Queue;
  private whatsappRetryQueue: Queue;

  private followupWorker?: Worker;
  private callbackWorker?: Worker;

  constructor(
    private readonly config: ConfigService,

    @InjectModel(Call.name)
    private readonly callModel: Model<Call>,

    @InjectModel(Callback.name)
    private readonly callbackModel: Model<Callback>,

    @InjectModel(Lead.name)
    private readonly leadModel: Model<Lead>,

    // @InjectModel(ActionEvent.name)
    // private readonly actionEventModel: Model<ActionEvent>,

    private readonly followupOrchestrator: FollowupOrchestratorService,
    // private readonly extractionService: ExtractionService,
    private readonly conversationsService: ConversationsService,
    // private readonly followupGen: FollowupGenService,
    // private readonly whatsappService: WhatsappService,
    private readonly callsService: CallsService,
  ) {
    // const redisUrl = this.config.get<string>(
    //   'REDIS_URL',
    //   'redis://localhost:6379',
    // );
    const redisUrl = 'rediss://default:gQAAAAAAAutcAAIgcDFhMWFhMjU1NDA0ZGE0YzE1OGJlYTA0ZjE5MzdjZjgyZg@cheerful-kitten-191324.upstash.io:6379'

    this.connection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    });

    this.followupQueue = new Queue(FOLLOWUP_QUEUE, {
      connection: this.connection,
    });

    this.callbackQueue = new Queue(CALLBACK_QUEUE, {
      connection: this.connection,
    });

    this.whatsappRetryQueue = new Queue(WHATSAPP_RETRY_QUEUE, {
      connection: this.connection,
    });
  }

  // ============================================================
  // MODULE INIT
  // ============================================================

 async onModuleInit(): Promise<void> {
  console.log('🔥 JobsService onModuleInit');

  try {
    await this.connection.ping();
    console.log('🔥 Redis connected:', await this.connection.ping());
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
  }

  this.startFollowupWorker();
  this.startCallbackWorker();

  console.log('🔥 JobsService workers started');
}


  // ============================================================
  // FOLLOW-UP WORKER
  // ============================================================

  private startFollowupWorker(): void {
  console.log('🔥 Creating FOLLOWUP worker');

  this.followupWorker = new Worker(
    FOLLOWUP_QUEUE,
    async (job: Job) => {
      console.log('🔥🔥🔥 FOLLOWUP JOB RECEIVED 🔥🔥🔥');
      console.log('JOB ID:', job.id);
      console.log('JOB NAME:', job.name);
      console.log('JOB DATA:', job.data);

      const { callId } = job.data as {
        callId: string;
      };

      console.log(
        '🔥 Calling processCompletedCall:',
        callId,
      );

      const result =
        await this.followupOrchestrator.processCompletedCall(
          callId,
        );

      console.log(
        '🔥 processCompletedCall result:',
        result,
      );

      return result;
    },
    {
      connection: this.connection.duplicate(),
      concurrency: 5,
    },
  );

  this.followupWorker.on('ready', () => {
    console.log('✅ FOLLOWUP WORKER READY');
  });

  this.followupWorker.on('active', (job) => {
    console.log('🚀 FOLLOWUP JOB ACTIVE:', job.id);
  });

  this.followupWorker.on('completed', (job, result) => {
    console.log('✅ FOLLOWUP JOB COMPLETED:', {
      jobId: job.id,
      result,
    });
  });

  this.followupWorker.on('failed', (job, error) => {
    console.error('❌ FOLLOWUP JOB FAILED:', {
      jobId: job?.id,
      error: error.message,
      stack: error.stack,
    });
  });

  this.followupWorker.on('error', (error) => {
    console.error('❌ FOLLOWUP WORKER ERROR:', error);
  });

  console.log('🔥 FOLLOWUP WORKER CREATED');
}


  // ============================================================
  // CALLBACK WORKER
  // ============================================================

  private startCallbackWorker(): void {
    this.callbackWorker = new Worker(
      CALLBACK_QUEUE,
      async (job: Job) => {
        const { callbackId } = job.data as {
          callbackId: string;
        };

        this.logger.log(
          {
            callbackId,
            jobId: job.id,
          },
          'Processing callback job',
        );

        await this.processCallback(callbackId);
      },
      {
        connection: this.connection.duplicate(),
        concurrency: 3,
      },
    );

    this.callbackWorker.on('completed', (job) => {
      this.logger.log(
        {
          jobId: job.id,
        },
        'Callback job completed',
      );
    });

    this.callbackWorker.on('failed', (job, error) => {
      this.logger.error(
        {
          jobId: job?.id,
          error: error.message,
        },
        'Callback job failed',
      );
    });

    this.callbackWorker.on('error', (error) => {
      this.logger.error(
        {
          error: error.message,
        },
        'Callback worker error',
      );
    });
  }

  // ============================================================
  // ENQUEUE POST-CALL FOLLOW-UP
  // ============================================================

async enqueuePostCallFollowup(
  callId: string | Types.ObjectId,
): Promise<void> {
  const callIdString = callId.toString();

  console.log('🔥 BEFORE ADD');

  const job = await this.followupQueue.add(
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

  console.log('🔥 FOLLOWUP JOB CREATED');
  console.log('ID:', job.id);
  console.log('NAME:', job.name);
  console.log('DATA:', job.data);

  const counts = await this.followupQueue.getJobCounts(
    'waiting',
    'active',
    'completed',
    'failed',
    'delayed',
    'paused',
  );

  console.log('🔥 QUEUE COUNTS:', counts);

  const storedJob = await this.followupQueue.getJob(job.id!);

  console.log('🔥 STORED JOB:', {
    id: storedJob?.id,
    name: storedJob?.name,
    data: storedJob?.data,
    state: await storedJob?.getState(),
  });
}


  // ============================================================
  // WHATSAPP RETRY
  // ============================================================

  async enqueueWhatsappRetry(
    messageId: string,
    phoneNumber: string,
    message: string,
  ): Promise<void> {
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
      },
    );

    this.logger.log(
      {
        messageId,
        phoneNumber,
      },
      'WhatsApp retry job enqueued',
    );
  }

  // ============================================================
  // CHECK SCHEDULED CALLBACKS
  // ============================================================

  @Cron('*/59 * * * *')
  async processScheduledCallbacks(): Promise<void> {
    const now = new Date();

    // Only pick callbacks scheduled within the next 1 hour.
    const oneHourFromNow = new Date(
      now.getTime() + 60 * 60 * 1000,
    );

    this.logger.log(
      {
        now,
        oneHourFromNow,
      },
      'Checking callbacks scheduled within the next hour',
    );

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

    this.logger.log(
      {
        count: callbacks.length,
      },
      'Found callbacks scheduled within the next hour',
    );

    for (const callback of callbacks) {
      try {
        // Prevent duplicate queueing.
        const updated = await this.callbackModel.findOneAndUpdate(
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
          this.logger.log(
            {
              callbackId: callback._id.toString(),
            },
            'Callback already queued or processed',
          );

          continue;
        }

        if (!callback.parsedDateTime) {
          this.logger.warn(
            {
              callbackId: callback._id.toString(),
            },
            'Callback has no parsedDateTime',
          );

          continue;
        }

        // Delay BullMQ job until the actual callback time.
        const delay = Math.max(
          callback.parsedDateTime.getTime() - Date.now(),
          0,
        );

        await this.callbackQueue.add(
          'execute-callback',
          {
            callbackId: callback._id.toString(),
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
            callbackId: callback._id.toString(),
            scheduledTime: callback.parsedDateTime,
            delayMs: delay,
          },
          'Callback queued successfully',
        );
      } catch (error) {
        this.logger.error(
          {
            callbackId: callback._id.toString(),
            error:
              error instanceof Error
                ? error.message
                : 'Unknown error',
          },
          'Failed to queue callback',
        );
      }
    }
  }

  // ============================================================
  // EXECUTE CALLBACK
  // ============================================================

  private async processCallback(callbackId: string): Promise<void> {
    const callback = await this.callbackModel
      .findById(callbackId)
      .exec();

    if (!callback) {
      this.logger.error({ callbackId }, 'Callback not found');
      return;
    }

    if (callback.status !== 'queued') {
      this.logger.warn(
        {
          callbackId,
          status: callback.status,
        },
        'Callback is not in queued state',
      );
      return;
    }

    try {
      // Get the original call
      const originalCall = await this.callModel
        .findById(callback.callId)
        .exec();

      if (!originalCall) {
        throw new Error('Original call not found');
      }

      // Get original transcript
      let transcript = originalCall.transcript || '';

      if (!transcript) {
        transcript =
          await this.conversationsService.getTranscriptText(
            originalCall._id,
          );
      }

      // Get lead/context from original conversation
      const lead = await this.leadModel
        .findOne({
          callId: originalCall._id,
        })
        .exec();

      if (!lead) {
        throw new Error('Lead not found for callback');
      }

      // queued -> in-progress
      await this.callbackModel.findOneAndUpdate(
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
      );

      // Context that the callback assistant needs
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

      this.logger.log(
        {
          callbackId,
          phoneNumber: originalCall.phoneNumber,
        },
        'Starting scheduled callback',
      );

      // Reuse your existing Vapi startCall()
      const result = await this.callsService.startCall(
        originalCall.phoneNumber,
        originalCall.metadata.assistantId,
        callbackContext,
      );

      // Store the newly created Call ID against callback
      await this.callbackModel.findByIdAndUpdate(
        callback._id,
        {
          $set: {
            callbackCallId: new Types.ObjectId(result.callId),
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
        'Scheduled callback started successfully',
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error';

      await this.callbackModel.findByIdAndUpdate(
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




  // ============================================================
  // MODULE DESTROY
  // ============================================================

  async onModuleDestroy(): Promise<void> {
    await this.followupWorker?.close();
    await this.callbackWorker?.close();

    await this.followupQueue.close();
    await this.callbackQueue.close();
    await this.whatsappRetryQueue.close();

    await this.connection.quit();

    this.logger.log('JobsService closed');
  }
}



