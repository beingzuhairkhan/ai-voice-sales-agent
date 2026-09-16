import { Document, Types } from 'mongoose';
export type CallStatus = 'initiated' | 'ringing' | 'in-progress' | 'ended' | 'failed' | 'no-answer' | 'busy' | 'cancelled' | 'queued';
export type FollowUpStatus = 'pending' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
export type CallDocument = Call & Document;
export declare class Call {
    _id: Types.ObjectId;
    vapiCallId?: string;
    phoneNumber: string;
    status: CallStatus;
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    language?: string;
    transcript?: string;
    summary?: string;
    recordingUrl?: string;
    leadId?: Types.ObjectId;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const CallSchema: import("mongoose").Schema<Call, import("mongoose").Model<Call, any, any, any, Document<unknown, any, Call, any, {}> & Call & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Call, Document<unknown, {}, import("mongoose").FlatRecord<Call>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Call> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
