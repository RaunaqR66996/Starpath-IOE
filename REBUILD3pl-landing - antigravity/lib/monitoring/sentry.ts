// Sentry error tracking setup
// Only initialize if SENTRY_DSN is configured

let sentryInitialized = false

export function initSentry() {
  if (sentryInitialized) return
  
  const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  
  if (!sentryDsn) {
    console.warn('Sentry DSN not configured - error tracking disabled')
    return
  }

  try {
    // Dynamic import to avoid bundling Sentry in development
    if (process.env.NODE_ENV === 'production') {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.init({
          dsn: sentryDsn,
          environment: process.env.NODE_ENV || 'development',
          tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
          debug: false,
          beforeSend(event, hint) {
            // Filter out sensitive data
            if (event.request) {
              delete event.request.headers
            }
            return event
          }
        })
        sentryInitialized = true
      }).catch((err) => {
        console.error('Failed to initialize Sentry:', err)
      })
    }
  } catch (error) {
    console.error('Sentry initialization error:', error)
  }
}

// Initialize Sentry on module load
if (typeof window === 'undefined') {
  // Server-side
  initSentry()
}




