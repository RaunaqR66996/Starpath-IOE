/**
 * Environment Variable Validation
 * Validates required environment variables on startup
 */

const requiredEnvVars = {
  // Database - required for production
  DATABASE_URL: process.env.DATABASE_URL,
  
  // OpenAI - optional (will use fallback if not set)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  
  // Optional but recommended
  MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN,
}

const optionalEnvVars = {
  REDIS_URL: process.env.REDIS_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
}

export function validateEnvironment() {
  const missing: string[] = []
  const warnings: string[] = []

  // Check required vars
  if (!requiredEnvVars.DATABASE_URL) {
    missing.push('DATABASE_URL')
  }

  // Check recommended vars
  if (!requiredEnvVars.OPENAI_API_KEY) {
    warnings.push('OPENAI_API_KEY - AI features will use fallback responses')
  }

  if (!requiredEnvVars.MAPBOX_ACCESS_TOKEN) {
    warnings.push('MAPBOX_ACCESS_TOKEN - Map features may be limited')
  }

  // Log results
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:')
    missing.forEach(v => console.error(`   - ${v}`))
    console.error('   Please set these in .env.local or your environment')
  }

  if (warnings.length > 0 && process.env.NODE_ENV !== 'production') {
    console.warn('⚠️  Missing recommended environment variables:')
    warnings.forEach(v => console.warn(`   - ${v}`))
  }

  if (missing.length === 0 && warnings.length === 0) {
    console.log('✅ All environment variables validated')
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings
  }
}

// Auto-validate on module import (only in development)
if (process.env.NODE_ENV === 'development') {
  validateEnvironment()
}


