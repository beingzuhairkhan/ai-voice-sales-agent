import { Document, Types } from 'mongoose';
export type ActionType = 'CALL_STARTED' | 'CALL_ENDED' | 'HOT_DETECTED' | 'LEAD_CLASSIFIED' | 'WHATSAPP_TRIGGERED' | 'WHATSAPP_SENT' | 'WHATSAPP_FAILED' | 'CALLBACK_REQUESTED' | 'CALLBACK_BOOKED' | 'FOLLOWUP_GENERATED' | 'FOLLOWUP_SENT' | 'LEAD_EXTRACTED' | 'ERROR';
export type ActionEventDocument = ActionEvent & Document;
export declare class ActionEvent {
    _id: Types.ObjectId;
    type: ActionType;
    callId?: Types.ObjectId;
    leadId?: Types.ObjectId;
    data: Record<string, any>;
    message?: string;
    success: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ActionEventSchema: import("mongoose").Schema<ActionEvent, import("mongoose").Model<ActionEvent, any, any, any, Document<unknown, any, ActionEvent, any, {}> & ActionEvent & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ActionEvent, Document<unknown, {}, import("mongoose").FlatRecord<ActionEvent>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<ActionEvent> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
