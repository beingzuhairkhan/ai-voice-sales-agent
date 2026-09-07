export interface SarvamSttParams {
    audioBase64?: string;
    audioUrl?: string;
    language?: string;
}
export interface SarvamSttResult {
    transcript: string;
    language: string;
    confidence?: number;
}
export interface SarvamTtsParams {
    text: string;
    language: string;
    voice?: string;
    speed?: number;
}
export interface SarvamTtsResult {
    audioBase64: string;
    format: string;
}
