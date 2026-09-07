import { CallsService } from './calls.service';
import { StartCallDto, CallQueryDto } from './dto/call.dto';
export declare class CallsController {
    private callsService;
    constructor(callsService: CallsService);
    startCall(dto: StartCallDto): Promise<{
        callId: string;
        vapiCallId: string;
        status: string;
    }>;
    getCalls(query: CallQueryDto): Promise<{
        calls: import("./call.schema").Call[];
        total: number;
        page: number;
        limit: number;
    }>;
    getCall(id: string): Promise<import("./call.schema").Call>;
    getTranscript(id: string): Promise<{
        callId: string;
        transcript: string;
        language: string | undefined;
    }>;
    getLead(id: string): Promise<{
        callId: string;
        leadId: import("mongoose").Types.ObjectId | undefined;
    }>;
    getActions(id: string): Promise<import("../common/types/action-event.schema").ActionEvent[]>;
}
