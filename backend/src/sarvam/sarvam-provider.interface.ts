export interface SarvamSttParams {
  audioBase64?: string;
  audioUrl?: string;
  language?: string; // 'te' | 'hi' | 'en' | 'auto'
}

export interface SarvamSttResult {
  transcript: string;
  language: string;
  confidence?: number;
}

export interface SarvamTtsParams {
  text: string;
  language?: string;
  voice?: string;
  speed?: number;
  sampleRate?: number;
}


export interface SarvamTtsResult {
  audioBase64: string;
  format: string;
}
