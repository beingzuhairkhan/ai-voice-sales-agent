export interface VapiStartCallParams {
  phoneNumber: string;
  assistantId?: string;
  phoneNumberId?: string;
  metadata?: Record<string, any>;
}

export interface VapiStartCallResult {
  vapiCallId: string;
  status: string;
  metadata?: Record<string, any>;
}

export interface VapiCallInfo {
  id: string;
  status: string;
  transcript?: string;
  recordingUrl?: string;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  metadata?: Record<string, any>;
}

export interface VapiAssistantConfig {
  name: string;
  model: {
    provider: string;
    model: string;
    messages: Array<{ role: string; content: string }>;
    tools?: Array<{ type: string; [key: string]: any }>;
    temperature?: number;
  };
  voice: {
    provider: string;
    voiceId?: string;
    language?: string;
  };
  transcriber?: {
    provider: string;
    model?: string;
    language?: string;
  };
}

export interface VapiWebhookEvent {
  type?: string;

  message?: {
    type?: string;

    call?: {
      id?: string;
      status?: string;
      transcript?: string;
      recordingUrl?: string;
      startedAt?: string;
      endedAt?: string;
      durationSeconds?: number;
      metadata?: Record<string, any>;
    };

    artifact?: {
      transcript?: string;
      messages?: any[];
      messagesOpenAIFormatted?: any[];
      recordingUrl?: string;
      stereoRecordingUrl?: string;
      durationSeconds?: number;
      durationMs?: number;
      summary?: string;
    };

    toolCall?: {
      name: string;
      parameters: Record<string, any>;
      toolCallId?: string;
    };

    toolCallResult?: Record<string, any>;

    transcript?: {
      transcript?: string;
      role?: string;
      language?: string;
    };
  };

  call?: Record<string, any>;

  createdAt?: number;
}

export const VapiProviderToken = 'VapiProviderToken';
