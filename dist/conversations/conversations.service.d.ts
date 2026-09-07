import { Model, Types } from 'mongoose';
import { ConversationMessage, MessageRole } from './conversation-message.schema';
export declare class ConversationsService {
    private messageModel;
    private readonly logger;
    constructor(messageModel: Model<ConversationMessage>);
    addMessage(params: {
        callId: Types.ObjectId | string;
        role: MessageRole;
        message: string;
        language?: string;
        providerEventId?: string;
        metadata?: Record<string, any>;
    }): Promise<ConversationMessage>;
    getConversation(callId: Types.ObjectId | string): Promise<ConversationMessage[]>;
    getTranscriptText(callId: Types.ObjectId | string): Promise<string>;
}
