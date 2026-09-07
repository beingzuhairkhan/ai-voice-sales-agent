import { Document, Types } from 'mongoose';
export type MessageRole = 'assistant' | 'user' | 'system' | 'tool';
export type ConversationMessageDocument = ConversationMessage & Document;
export declare class ConversationMessage {
    _id: Types.ObjectId;
    callId: Types.ObjectId;
    role: MessageRole;
    message: string;
    language: string;
    timestamp: Date;
    providerEventId?: string;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ConversationMessageSchema: import("mongoose").Schema<ConversationMessage, import("mongoose").Model<ConversationMessage, any, any, any, Document<unknown, any, ConversationMessage, any, {}> & ConversationMessage & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ConversationMessage, Document<unknown, {}, import("mongoose").FlatRecord<ConversationMessage>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<ConversationMessage> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
