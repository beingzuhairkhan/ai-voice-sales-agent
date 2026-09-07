import { plainToInstance } from 'class-transformer';
import { IsNumber, IsString, Min, validateSync } from 'class-validator';
import { config } from 'dotenv';

config();

class EnvVariables {
  @IsString() NODE_ENV!: string;
  @IsNumber() PORT!: number;

  @IsString() MONGODB_URI!: string;
  @IsString() REDIS_URL!: string;
  @IsString() JWT_SECRET!: string;
  @IsString() VAPI_API_KEY!: string;
  @IsString() VAPI_ASSISTANT_ID!: string;
  @IsString() VAPI_PHONE_NUMBER!: string;
  @IsString() SARVAM_API_KEY!: string;
  @IsString() OPENAI_API_KEY!: string;
  @IsString() OPENAI_MODEL!: string;
  @IsString() WHATSAPP_ACCESS_TOKEN!: string;
  @IsString() WHATSAPP_PHONE_NUMBER_ID!: string;
  @IsString() WHATSAPP_API_URL!: string;
  @IsString() GOOGLE_CLIENT_ID!: string;
  @IsString() GOOGLE_CLIENT_SECRET!: string;
  @IsString() GOOGLE_REFRESH_TOKEN!: string;
  @IsString() GOOGLE_CALENDAR_ID!: string;
  @IsString() DEVELOPER_NAME!: string;
  @IsString() DEVELOPER_MOBILE_NUMBER!: string;
  @IsNumber() @Min(0) HOT_SCORE_THRESHOLD!: number;
  @IsNumber() @Min(0) WARM_SCORE_THRESHOLD!: number;
  @IsString() CALLBACK_DEFAULT_MORNING_TIME!: string;
  @IsString() CALLBACK_DEFAULT_AFTERNOON_TIME!: string;
  @IsString() CALLBACK_DEFAULT_EVENING_TIME!: string;
  @IsString() CALLBACK_TIMEZONE!: string;
}

const NUMERIC_KEYS = [
  'PORT', 'HOT_SCORE_THRESHOLD', 'WARM_SCORE_THRESHOLD',
  'JWT_EXPIRES_IN', 'MAX_RETRIES', 'RETRY_BASE_DELAY_MS', 'HTTP_TIMEOUT_MS',
];
const BOOLEAN_KEYS = ['VAPI_WEBHOOK_VERIFY_ENABLED'];

export function ConfigValidation(rawConfig: Record<string, string | undefined>) {
  const coerced: Record<string, string | number | boolean> = {};

  for (const key of Object.keys(process.env)) {
    let value: string | number | boolean | undefined = process.env[key];
    if (NUMERIC_KEYS.includes(key) && value !== undefined) value = Number(value);
    if (BOOLEAN_KEYS.includes(key) && value !== undefined) value = value === 'true';
    coerced[key] = value as string | number | boolean;
  }

  // Only validate in production; in development just warn
  const isProduction = coerced.NODE_ENV === 'production';
  const isTest = coerced.NODE_ENV === 'test';

  if (!isTest) {
    const validated = plainToInstance(EnvVariables, coerced, { enableImplicitConversion: true });
    const errors = validateSync(validated, { skipMissingProperties: true });

    if (errors.length > 0) {
      const messages = errors
        .map((e) => `Missing or invalid env var: ${e.property} - ${JSON.stringify(e.constraints)}`)
        .join('\n');
      if (isProduction) {
        throw new Error('Environment variable validation failed:\n' + messages);
      } else {
        console.warn('Environment variable validation warnings:\n' + messages);
      }
    }
  }

  return coerced;
}
