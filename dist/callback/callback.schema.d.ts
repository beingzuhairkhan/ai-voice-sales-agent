import { Document, Types } from 'mongoose';
export type CallbackStatus = 'requested' | 'confirmed' | 'scheduled' | 'completed' | 'cancelled' | 'failed' | 'queued';
export type CallbackDocument = Callback & Document;
export declare class Callback {
    _id: Types.ObjectId;
    leadId: Types.ObjectId;
    callId?: Types.ObjectId;
    callbackCallId?: Types.ObjectId;
    requestedTimePhrase?: string;
    parsedDateTime?: Date;
    timezone: string;
    confidence: number;
    status: CallbackStatus;
    reason?: string;
    notes?: string;
    googleCalendarEventId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const CallbackSchema: import("mongoose").Schema<Callback, import("mongoose").Model<Callback, any, any, any, Document<unknown, any, Callback, any, {}> & Callback & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Callback, Document<unknown, {}, import("mongoose").FlatRecord<Callback>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Callback> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
