/**
 * Structured Logger
 * PRD ISO-05: "Logs must include institute_id and user_id; never log passwords, tokens, or full personal data."
 */

export interface LogContext {
  instituteId?: string;
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'refreshtoken',
  'authorization',
  'secret',
  'twofactorsecret',
  'aadhaar',
  'bankaccount',
  'accountnumber',
  'cvv',
]);

export function scrubSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(scrubSensitiveData);
  }

  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      cleaned[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      cleaned[key] = scrubSensitiveData(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export class StructuredLogger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  withContext(context: LogContext): StructuredLogger {
    return new StructuredLogger({ ...this.context, ...context });
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.log('INFO', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.log('WARN', message, meta);
  }

  error(message: string, error?: Error | unknown, meta?: Record<string, unknown>) {
    const errorDetails =
      error instanceof Error
        ? { errorMessage: error.message, stack: error.stack }
        : { error };
    this.log('ERROR', message, { ...errorDetails, ...meta });
  }

  private log(level: string, message: string, meta?: Record<string, unknown>) {
    const logPayload = {
      timestamp: new Date().toISOString(),
      level,
      message,
      instituteId: this.context.instituteId || null,
      userId: this.context.userId || null,
      requestId: this.context.requestId || null,
      ...(meta ? (scrubSensitiveData(meta) as Record<string, unknown>) : {}),
    };

    console.log(JSON.stringify(logPayload));
  }
}

export const logger = new StructuredLogger();
