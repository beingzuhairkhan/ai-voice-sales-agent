import { Document, Types } from 'mongoose';
export type AgentConfigurationDocument = AgentConfiguration & Document;
export declare class AgentConfiguration {
    _id: Types.ObjectId;
    name: string;
    vapiAssistantId?: string;
    modelConfig: Record<string, any>;
    voiceConfig: Record<string, any>;
    supportedLanguages: string[];
    toolConfig: Record<string, any>;
    isActive: boolean;
    version: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const AgentConfigurationSchema: import("mongoose").Schema<AgentConfiguration, import("mongoose").Model<AgentConfiguration, any, any, any, Document<unknown, any, AgentConfiguration, any, {}> & AgentConfiguration & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AgentConfiguration, Document<unknown, {}, import("mongoose").FlatRecord<AgentConfiguration>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<AgentConfiguration> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
