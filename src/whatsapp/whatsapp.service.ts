import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Inject } from '@nestjs/common';
import { WhatsAppMessage } from './whatsapp-message.schema';
import { WhatsAppProvider, WHATSAPP_PROVIDER } from './whatsapp-provider.interface';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly resumeUrl: string;
  private readonly architectureImageUrl: string;

  constructor(
    @InjectModel(WhatsAppMessage.name) private messageModel: Model<WhatsAppMessage>,
    @Inject(WHATSAPP_PROVIDER) private provider: WhatsAppProvider,
    private config: ConfigService,
  ) {
    this.resumeUrl = this.config.get<string>('RESUME_URL', '');
    this.architectureImageUrl = this.config.get<string>('ARCHITECTURE_IMAGE_URL', '');
  }

  async sendTextMessage(
    phoneNumber: string,
    message: string,
    options?: {
      leadId?: Types.ObjectId | string;
      triggerAction?: string;
    },
  ): Promise<WhatsAppMessage> {
    const record = await this.messageModel.create({
      phoneNumber,
      message,
      type: 'template',
      status: 'queued',
      leadId: options?.leadId
        ? typeof options.leadId === 'string'
          ? new Types.ObjectId(options.leadId)
          : options.leadId
        : undefined,
      triggerAction: options?.triggerAction,
    });

    try {
      const result = await this.provider.sendTextMessage(
        phoneNumber,
        message,
      );

      record.providerMessageId =
        result.providerMessageId;

      record.status = 'pending';

      record.deliveryInfo =
        result.rawResponse || {};

      return record.save();
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : String(err);

      record.status = 'failed';

      record.errorInfo = {
        message: errorMsg,
        timestamp: new Date().toISOString(),
      };

      await record.save();

      this.logger.error(
        {
          err: errorMsg,
          phoneNumber,
        },
        'WhatsApp template send failed',
      );

      throw err;
    }
  }

  async sendDocument(
    phoneNumber: string,
    documentUrl: string,
    caption?: string,
    options?: { leadId?: Types.ObjectId | string; triggerAction?: string },
  ): Promise<WhatsAppMessage> {
    const record = await this.messageModel.create({
      phoneNumber,
      message: caption || documentUrl,
      type: 'document',
      status: 'queued',
      mediaUrl: documentUrl,
      leadId: options?.leadId
        ? typeof options.leadId === 'string'
          ? new Types.ObjectId(options.leadId)
          : options.leadId
        : undefined,
      triggerAction: options?.triggerAction,
    });

    try {
      const result = await this.provider.sendDocument(phoneNumber, documentUrl, caption);
      record.providerMessageId = result.providerMessageId;
      record.status = 'sent';
      record.sentAt = new Date();
      return record.save();
    } catch (err) {
      record.status = 'failed';
      record.errorInfo = { message: (err as Error).message, timestamp: new Date().toISOString() };
      await record.save();
      throw err;
    }
  }

  async sendImage(
    phoneNumber: string,
    imageUrl: string,
    caption?: string,
    options?: { leadId?: Types.ObjectId | string; triggerAction?: string },
  ): Promise<WhatsAppMessage> {
    const record = await this.messageModel.create({
      phoneNumber,
      message: caption || imageUrl,
      type: 'image',
      status: 'queued',
      mediaUrl: imageUrl,
      leadId: options?.leadId
        ? typeof options.leadId === 'string'
          ? new Types.ObjectId(options.leadId)
          : options.leadId
        : undefined,
      triggerAction: options?.triggerAction,
    });

    try {
      const result = await this.provider.sendImage(phoneNumber, imageUrl, caption);
      record.providerMessageId = result.providerMessageId;
      record.status = 'sent';
      record.sentAt = new Date();
      return record.save();
    } catch (err) {
      record.status = 'failed';
      record.errorInfo = { message: (err as Error).message, timestamp: new Date().toISOString() };
      await record.save();
      throw err;
    }
  }

  async sendFollowupWithAttachments(
    phoneNumber: string,
    message: string,
    options?: { leadId?: Types.ObjectId | string; triggerAction?: string },
  ): Promise<{ textMessage: WhatsAppMessage; attachments: WhatsAppMessage[] }> {
    const textMessage = await this.sendTextMessage(phoneNumber, message, options);
    const attachments: WhatsAppMessage[] = [];

    // Send resume if configured
    if (this.resumeUrl) {
      try {
        const doc = await this.sendDocument(phoneNumber, this.resumeUrl, 'Resume', options);
        attachments.push(doc);
      } catch (err) {
        this.logger.error({ err: (err as Error).message }, 'Resume send failed');
      }
    }

    // Send architecture image if configured
    if (this.architectureImageUrl) {
      try {
        const img = await this.sendImage(phoneNumber, this.architectureImageUrl, 'Architecture', options);
        attachments.push(img);
      } catch (err) {
        this.logger.error({ err: (err as Error).message }, 'Architecture image send failed');
      }
    }

    return { textMessage, attachments };
  }

  async getMessages(query: {
    page?: number;
    limit?: number;
    status?: string;
    phoneNumber?: string;
  }): Promise<{ messages: WhatsAppMessage[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;
    const filter: Record<string, any> = {};

    if (query.status) filter.status = query.status;
    if (query.phoneNumber) filter.phoneNumber = query.phoneNumber;

    const [messages, total] = await Promise.all([
      this.messageModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.messageModel.countDocuments(filter).exec(),
    ]);

    return { messages, total, page, limit };
  }

  async handleStatusWebhook(status: any) {
    const providerMessageId = status?.id;
    const providerStatus = status?.status;

    if (!providerMessageId || !providerStatus) {
      return;
    }

    const update: any = {
      status: providerStatus,
      updatedAt: new Date(),
    };

    // Save Meta failure details
    if (providerStatus === 'failed') {
      const error = status.errors?.[0];

      update.deliveryInfo = {
        statusTimestamp: status.timestamp
          ? new Date(Number(status.timestamp) * 1000)
          : undefined,

        failure: {
          code: error?.code,
          title: error?.title,
          message: error?.message,
          details: error?.error_data?.details,
          href: error?.href,
        },
      };
    }

    // Save status timestamps
    if (providerStatus === 'sent') {
      update['deliveryInfo.sentAt'] = new Date();
    }

    if (providerStatus === 'delivered') {
      update['deliveryInfo.deliveredAt'] = new Date();
    }

    if (providerStatus === 'read') {
      update['deliveryInfo.readAt'] = new Date();
    }

    const result =
      await this.messageModel.findOneAndUpdate(
        {
          $or: [
            {
              'deliveryInfo.messages.providerMessageId':
                providerMessageId,
            },
            {
              'deliveryInfo.messages.id':
                providerMessageId,
            },
          ],
        },
        {
          $set: update,
        },
        {
          new: true,
        },
      );

    if (!result) {
      this.logger.warn(
        `WhatsApp message not found for WAMID: ${providerMessageId}`,
      );
    }

    return result;
  }

}
