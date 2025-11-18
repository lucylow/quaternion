/**
 * Centralized Configuration and Secrets Management for Supabase Edge Functions
 * 
 * This module provides a unified way to access environment variables and secrets
 * that work seamlessly with Lovable Cloud, Supabase, and local development.
 * 
 * Usage:
 *   import { getConfig, getSecrets } from '../_shared/config.ts';
 *   
 *   const config = getConfig();
 *   const secrets = getSecrets();
 */

export interface EdgeFunctionConfig {
  supabase: {
    url: string;
    serviceRoleKey: string;
    anonKey?: string;
  };
  lovable?: {
    apiKey?: string;
    apiUrl?: string;
  };
  tts?: {
    provider?: string;
    elevenlabsApiKey?: string;
    googleTtsKey?: string;
    awsAccessKeyId?: string;
    awsSecretAccessKey?: string;
    awsRegion?: string;
  };
  features: {
    enableLLM: boolean;
    enableTTS: boolean;
    enableDatabase: boolean;
    mockMode: boolean;
  };
}

export interface EdgeFunctionSecrets {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  supabaseAnonKey?: string;
  lovableApiKey?: string;
  lovableApiUrl?: string;
  ttsProvider?: string;
  elevenlabsApiKey?: string;
  googleTtsKey?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsRegion?: string;
}

/**
 * Get configuration with validation and defaults
 * This function validates required secrets and provides helpful error messages
 */
export function getConfig(): EdgeFunctionConfig {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || 
                      Deno.env.get('VITE_SUPABASE_URL') ||
                      Deno.env.get('SUPABASE_PROJECT_URL');
  
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
                                 Deno.env.get('SUPABASE_SERVICE_KEY');
  
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ||
                          Deno.env.get('VITE_SUPABASE_PUBLISHABLE_KEY');

  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  const lovableApiUrl = Deno.env.get('LOVABLE_API_URL') || 
                       'https://ai.gateway.lovable.dev/v1/chat/completions';

  // TTS Configuration
  const ttsProvider = Deno.env.get('TTS_PROVIDER') || 'elevenlabs';
  const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
  const googleTtsKey = Deno.env.get('GOOGLE_TTS_KEY');
  const awsAccessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
  const awsSecretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');
  const awsRegion = Deno.env.get('AWS_REGION') || 'us-east-1';

  // Feature flags
  const mockMode = Deno.env.get('MOCK_MODE') === 'true' ||
                   Deno.env.get('TTS_MOCK') === 'true' ||
                   Deno.env.get('EDGE_MOCK') === 'true';

  const enableLLM = !mockMode && !!lovableApiKey;
  const enableTTS = !mockMode && (
    !!elevenlabsApiKey || 
    !!googleTtsKey || 
    (!!awsAccessKeyId && !!awsSecretAccessKey)
  );
  const enableDatabase = !mockMode && !!supabaseUrl && !!supabaseServiceRoleKey;

  return {
    supabase: {
      url: supabaseUrl || '',
      serviceRoleKey: supabaseServiceRoleKey || '',
      anonKey: supabaseAnonKey,
    },
    lovable: {
      apiKey: lovableApiKey,
      apiUrl: lovableApiUrl,
    },
    tts: {
      provider: ttsProvider,
      elevenlabsApiKey,
      googleTtsKey,
      awsAccessKeyId,
      awsSecretAccessKey,
      awsRegion,
    },
    features: {
      enableLLM,
      enableTTS,
      enableDatabase,
      mockMode,
    },
  };
}

/**
 * Get secrets with validation
 * Throws helpful errors if required secrets are missing
 */
export function getSecrets(): EdgeFunctionSecrets {
  const config = getConfig();

  // Validate required Supabase secrets
  if (!config.features.enableDatabase) {
    console.warn('⚠️ Supabase credentials not fully configured. Database features will be disabled.');
    console.warn('   Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }

  return {
    supabaseUrl: config.supabase.url,
    supabaseServiceRoleKey: config.supabase.serviceRoleKey,
    supabaseAnonKey: config.supabase.anonKey,
    lovableApiKey: config.lovable?.apiKey,
    lovableApiUrl: config.lovable?.apiUrl,
    ttsProvider: config.tts?.provider,
    elevenlabsApiKey: config.tts?.elevenlabsApiKey,
    googleTtsKey: config.tts?.googleTtsKey,
    awsAccessKeyId: config.tts?.awsAccessKeyId,
    awsSecretAccessKey: config.tts?.awsSecretAccessKey,
    awsRegion: config.tts?.awsRegion,
  };
}

/**
 * Validate that required secrets are present
 * Returns an array of missing required secrets
 */
export function validateSecrets(required: string[]): string[] {
  const secrets = getSecrets();
  const missing: string[] = [];

  for (const key of required) {
    const value = (secrets as any)[key];
    if (!value || value === '') {
      missing.push(key);
    }
  }

  return missing;
}

/**
 * Get a formatted error message for missing secrets
 */
export function getMissingSecretsError(missing: string[]): string {
  if (missing.length === 0) return '';

  const secretsList = missing.map(s => `  - ${s}`).join('\n');
  return `Missing required secrets:\n${secretsList}\n\n` +
         `Please set these in Lovable Cloud secrets or Supabase Edge Function environment variables.`;
}

