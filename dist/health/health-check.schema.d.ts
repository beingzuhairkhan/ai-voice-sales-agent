import { Document } from 'mongoose';
export declare class HealthCheck extends Document {
    service?: string;
    status?: string;
    checkedAt?: Date;
}
export declare const HealthCheckSchema: import("mongoose").Schema<HealthCheck, import("mongoose").Model<HealthCheck, any, any, any, Document<unknown, any, HealthCheck, any, {}> & HealthCheck & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, HealthCheck, Document<unknown, {}, import("mongoose").FlatRecord<HealthCheck>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<HealthCheck> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
