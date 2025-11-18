/**
 * Database Client Helper for Supabase Edge Functions
 * 
 * Provides a centralized, optimized Supabase client with connection pooling,
 * error handling, and retry logic for edge functions.
 * 
 * Usage:
 *   import { getSupabaseClient } from '../_shared/database.ts';
 *   
 *   const supabase = getSupabaseClient();
 *   if (!supabase) {
 *     // Handle missing database configuration
 *   }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';
import { getConfig } from './config.ts';

let cachedClient: ReturnType<typeof createClient> | null = null;

/**
 * Get or create a Supabase client instance
 * Uses caching to avoid creating multiple clients
 * 
 * @returns Supabase client or null if configuration is missing
 */
export function getSupabaseClient() {
  // Return cached client if available
  if (cachedClient) {
    return cachedClient;
  }

  const config = getConfig();

  // Validate required configuration
  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    console.warn('⚠️ Supabase credentials not configured. Database features will be disabled.');
    console.warn('   Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    return null;
  }

  try {
    // Create Supabase client with optimized settings for edge functions
    cachedClient = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          persistSession: false, // Edge functions are stateless
          autoRefreshToken: false,
        },
        db: {
          schema: 'public',
        },
        global: {
          headers: {
            'x-client-info': 'quaternion-edge-function',
          },
        },
      }
    );

    console.log('✅ Supabase client initialized');
    return cachedClient;
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
    return null;
  }
}

/**
 * Execute a database query with error handling and retry logic
 * 
 * @param queryFn - Function that returns a Supabase query promise
 * @param retries - Number of retry attempts (default: 2)
 * @returns Query result or null on failure
 */
export async function executeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  retries: number = 2
): Promise<{ data: T | null; error: any }> {
  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await queryFn();
      
      if (result.error) {
        // Retry on certain errors
        if (attempt < retries && (
          result.error.code === 'PGRST116' || // Connection error
          result.error.code === 'PGRST301' || // Timeout
          result.error.message?.includes('network')
        )) {
          console.warn(`Query failed, retrying (attempt ${attempt + 1}/${retries})...`);
          await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1))); // Exponential backoff
          lastError = result.error;
          continue;
        }
        
        return result;
      }

      return result;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        console.warn(`Query exception, retrying (attempt ${attempt + 1}/${retries})...`);
        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
        continue;
      }
    }
  }

  return { data: null, error: lastError };
}

/**
 * Check if database is available and configured
 */
export function isDatabaseAvailable(): boolean {
  const supabase = getSupabaseClient();
  return supabase !== null;
}

/**
 * Test database connection
 * Returns true if connection is successful
 */
export async function testConnection(): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return false;
  }

  try {
    // Simple query to test connection
    const { error } = await supabase.from('_prisma_migrations').select('id').limit(1);
    return error === null;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

