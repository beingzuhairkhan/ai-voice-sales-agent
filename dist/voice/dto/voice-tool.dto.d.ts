export declare class UpdateLeadDto {
    callId: string;
    name?: string;
    productDescription?: string;
    productCount?: number;
    budget?: number;
    currency?: string;
    timeline?: string;
    requiredFeatures?: string[];
    painPoints?: string[];
    isDecisionMaker?: boolean;
    barriers?: string[];
    objections?: string[];
    buyingSignals?: string[];
    language?: string;
}
export declare class SendWhatsappDto {
    callId: string;
    messageContent: string;
}
export declare class BookCallbackDto {
    callId: string;
    requestedTime: string;
    reason?: string;
}
export declare class GetLeadContextDto {
    callId: string;
}
export declare class EndCallDto {
    callId: string;
    summary?: string;
}
