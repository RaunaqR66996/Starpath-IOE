import pino, { Logger as PinoLogger } from 'pino'

export type LogContext = Record<string, unknown>

const level = process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

const pinoInstance = pino({
  level,
  base: {
    service: process.env.SERVICE_NAME || 'rebuild3pl'
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: ['req.headers.authorization', 'res.headers["set-cookie"]'],
    censor: '[REDACTED]'
  }
})

class AppLogger {
  constructor(private readonly base: PinoLogger) {}

  child(context: LogContext) {
    return new AppLogger(this.base.child(context))
  }

  debug(message: string, context?: LogContext) {
    this.base.debug(context ?? {}, message)
  }

  info(message: string, context?: LogContext) {
    this.base.info(context ?? {}, message)
  }

  warn(message: string, context?: LogContext) {
    this.base.warn(context ?? {}, message)
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const details =
      error instanceof Error
        ? { message: error.message, stack: error.stack }
        : error

    this.base.error({ ...(context ?? {}), error: details }, message)

    if (typeof window === 'undefined' && process.env.SENTRY_DSN) {
      import('@sentry/nextjs')
        .then(Sentry => {
          Sentry.captureException(error || new Error(message), {
            extra: context
          })
        })
        .catch(() => undefined)
    }
  }

  raw() {
    return this.base
  }
}

export const logger = new AppLogger(pinoInstance)
export const pinoBaseLogger = pinoInstance