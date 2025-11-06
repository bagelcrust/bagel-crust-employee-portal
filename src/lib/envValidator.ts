/**
 * ENVIRONMENT VARIABLE VALIDATION
 *
 * Validates all required environment variables at app startup.
 * Fails fast with clear error messages if configuration is invalid.
 *
 * This prevents cryptic runtime errors from missing/invalid env vars.
 */

interface EnvConfig {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

/**
 * Validate and return typed environment variables
 * Throws descriptive error if any required variables are missing
 */
export function validateEnv(): EnvConfig {
  const errors: string[] = [];

  // Check Supabase URL
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    errors.push('VITE_SUPABASE_URL is not defined in .env file');
  } else if (!supabaseUrl.startsWith('https://')) {
    errors.push(`VITE_SUPABASE_URL must start with https:// (got: ${supabaseUrl})`);
  } else if (!supabaseUrl.includes('.supabase.co')) {
    errors.push(`VITE_SUPABASE_URL doesn't look like a valid Supabase URL (got: ${supabaseUrl})`);
  }

  // Check Supabase Anon Key
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseAnonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is not defined in .env file');
  } else if (supabaseAnonKey.length < 100) {
    errors.push(`VITE_SUPABASE_ANON_KEY looks too short to be valid (length: ${supabaseAnonKey.length})`);
  }

  // Throw error with all problems if any found
  if (errors.length > 0) {
    throw new Error(
      `❌ Environment Configuration Error\n\n` +
      `Missing or invalid environment variables:\n` +
      errors.map((err, i) => `  ${i + 1}. ${err}`).join('\n') +
      `\n\nPlease check your .env file in /bagelcrust/react-app/.env`
    );
  }

  return {
    VITE_SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey
  };
}

/**
 * Get environment name (development, production, etc.)
 */
export function getEnvironment(): 'development' | 'production' {
  return import.meta.env.DEV ? 'development' : 'production';
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV;
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return import.meta.env.PROD;
}
