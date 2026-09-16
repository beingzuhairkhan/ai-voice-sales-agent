// Shared API types matching the NestJS backend contracts.
// The backend is the source of truth; these types reflect its responses.

export type LeadTemperature = 'HOT' | 'WARM' | 'COLD' | 'UNKNOWN';

export type CallStatus =
  | 'initiated'
  | 'ringing'
  | 'in-progress'
  | 'completed'
  | 'failed'
  | 'no-answer'
  | 'busy'
  | 'cancelled'
  | string;

export type Language = 'telugu' | 'hindi' | 'english' | 'unknown' | string;

export type ActionType =
  | 'CALL_STARTED'
  | 'CALL_ENDED'
  | 'HOT_DETECTED'
  | 'LEAD_CLASSIFIED'
  | 'WHATSAPP_TRIGGERED'
  | 'WHATSAPP_SENT'
  | 'CALLBACK_REQUESTED'
  | 'CALLBACK_BOOKED'
  | 'FOLLOWUP_GENERATED'
  | string;

export type WhatsAppStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | string;

export type WhatsAppType = 'mid_call' | 'followup' | 'welcome' | string;

export type CallbackStatus =
  | 'pending'
  | 'confirmed'
  | 'booked'
  | 'completed'
  | 'cancelled'
  | 'failed'
  | string;

export type WebhookStatus =
  | 'processed'
  | 'duplicate'
  | 'failed'
  | 'unknown'
  | 'ignored'
  | string;

// ---- Auth ----
export interface AuthUser {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  token?: string;
  user?: AuthUser;
}

// ---- Pagination ----
export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
  items?: T[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  temperature?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ---- Call ----
export interface Call {
  _id?: string;
  id?: string;
  callId?: string;
  vapiCallId?: string | null;
  phoneNumber: string;
  status: CallStatus;
  language?: Language;
  leadTemperature?: LeadTemperature;
  duration?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  recordingUrl?: string | null;
  transcript?: TranscriptMessage[];
  error?: string | null;
  providerError?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TranscriptMessage {
  _id?: string;
  id?: string;
  role: 'assistant' | 'user' | 'system' | string;
  message?: string;
  content?: string;
  text?: string;
  language?: Language;
  timestamp?: string;
  createdAt?: string;
  timeMs?: number;
}

export interface StartCallRequest {
  phoneNumber: string;
}

export interface StartCallResponse {
  callId?: string;
  _id?: string;
  id?: string;
  vapiCallId?: string;
  status?: CallStatus;
  call?: Call;
}

// ---- Lead ----
export interface Lead {
  _id?: string;
  id?: string;
  callId?: string;
  phoneNumber?: string;
  customerName?: string | null;
  name?: string | null;
  temperature: LeadTemperature;
  intentScore?: number | null;
  confidence?: number | null;
  budget?: number | null;
  currency?: string | null;
  productDescription?: string | null;
  productCount?: number | null;
  timeline?: string | null;
  requiredFeatures?: string[] | null;
  painPoints?: string[] | null;
  decisionMaker?: boolean | null;
  barriers?: string[] | null;
  objections?: string[] | null;
  buyingSignals?: string[] | null;
  reason?: string | null;
  classificationReason?: string | null;
  rawExtraction?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
}

// ---- Callback ----
export interface Callback {
  _id?: string;
  id?: string;
  callId?: string;
  leadId?: string;
  phoneNumber?: string;
  customerName?: string | null;
  requestedText?: string | null;
  requestedTime?: string | null;
  scheduledTime?: string | null;
  parsedTime?: string | null;
  timezone?: string | null;
  confidence?: number | null;
  status: CallbackStatus;
  reason?: string | null;
  notes?: string | null;
  googleEventId?: string | null;
  calendarEventId?: string | null;
  error?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// ---- WhatsApp ----
export interface WhatsAppMessage {
  _id?: string;
  id?: string;
  callId?: string;
  leadId?: string;
  phoneNumber: string;
  type: WhatsAppType;
  messageType?: string;
  content?: string | null;
  body?: string | null;
  status: WhatsAppStatus;
  providerMessageId?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  deliveryInfo?: Record<string, unknown> | null;
  error?: string | null;
  mediaUrl?: string | null;
  attachments?: Array<{ url?: string; type?: string; name?: string }> | null;
  providerResponse?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
}

// ---- Action Event ----
export interface ActionEvent {
  _id?: string;
  id?: string;
  callId?: string | null;
  leadId?: string | null;
  actionType: ActionType;
  status?: string;
  metadata?: Record<string, unknown> | null;
  message?: string | null;
  phoneNumber?: string | null;
  createdAt?: string;
  timestamp?: string;
}

// ---- Webhook Event ----
export interface WebhookEvent {
  _id?: string;
  id?: string;
  providerEventId?: string | null;
  eventType?: string | null;
  callId?: string | null;
  status: WebhookStatus;
  receivedAt?: string | null;
  processedAt?: string | null;
  retryCount?: number | null;
  error?: string | null;
  payload?: Record<string, unknown> | null;
  sanitizedPayload?: Record<string, unknown> | null;
  createdAt?: string;
}

// ---- Dashboard ----
export interface DashboardOverview {
  totalCalls?: number;
  completedCalls?: number;
  failedCalls?: number;
  inProgressCalls?: number;
  hotLeads?: number;
  warmLeads?: number;
  coldLeads?: number;
  callbacks?: number;
  whatsappMessages?: number;
  pendingCallbacks?: number;
  callsOverTime?: Array<{ date: string; count: number; completed?: number; failed?: number }>;
  leadDistribution?: Array<{ temperature: LeadTemperature; count: number }>;
  callStatusBreakdown?: Array<{ status: string; count: number }>;
  whatsappActivity?: Array<{ date: string; count: number }>;
  callbackActivity?: Array<{ date: string; count: number }>;
  recentActivity?: ActionEvent[];
}

// ---- Health ----
export interface HealthStatus {
  status?: string;
  mongodb?: string | boolean;
  redis?: string | boolean;
  vapi?: string | boolean;
  whatsapp?: string | boolean;
  openai?: string | boolean;
  sarvam?: string | boolean;
  googleCalendar?: string | boolean;
  [key: string]: unknown;
}

// ---- Agent Configuration ----
export interface AgentConfiguration {
  assistantName?: string;
  assistantId?: string;
  phoneNumber?: string;
  languages?: Language[];
  voiceProvider?: string;
  transcriberProvider?: string;
  llmProvider?: string;
  fallbackLlmProvider?: string | null;
  languageBehavior?: string;
  tools?: string[];
  firstMessage?: string;
  systemPrompt?: string;
  model?: string;
  voice?: string;
}

// ---- Files / Assets ----
export interface FileAsset {
  _id?: string;
  id?: string;
  name: string;
  type: string;
  url?: string | null;
  status?: string;
  available?: boolean;
  size?: number | null;
  mimeType?: string | null;
  description?: string | null;
}

// ---- Settings ----
export interface AppSettings {
  hotScoreThreshold?: number;
  warmScoreThreshold?: number;
  callbackDefaultMorningTime?: string;
  callbackDefaultAfternoonTime?: string;
  callbackDefaultEveningTime?: string;
  defaultTimezone?: string;
  developerContact?: {
    mobile?: string;
    email?: string;
    name?: string;
  };
  apiEnvironment?: {
    vapi?: boolean;
    sarvam?: boolean;
    openai?: boolean;
    whatsapp?: boolean;
    googleCalendar?: boolean;
    mongodb?: boolean;
    redis?: boolean;
  };
}
