# Shared Edge Function Utilities

This directory contains shared utilities for Supabase Edge Functions that improve database integration, secrets management, and error handling.

## Modules

### `config.ts`

Centralized configuration and secrets management for edge functions.

**Features:**
- Unified access to environment variables
- Support for multiple environment variable names (for compatibility)
- Feature flags based on available secrets
- Helpful error messages for missing secrets

**Usage:**
```typescript
import { getConfig, getSecrets } from '../_shared/config.ts';

const config = getConfig();
if (config.features.enableLLM) {
  // LLM features are available
}

const secrets = getSecrets();
const apiKey = secrets.lovableApiKey;
```

### `database.ts`

Database client helper with connection pooling, error handling, and retry logic.

**Features:**
- Cached Supabase client (avoids creating multiple instances)
- Automatic retry on connection errors
- Graceful fallback when database is unavailable
- Connection testing utilities

**Usage:**
```typescript
import { getSupabaseClient, executeQuery } from '../_shared/database.ts';

const supabase = getSupabaseClient();
if (!supabase) {
  // Database not configured
  return;
}

// Use executeQuery for automatic retry
const { data, error } = await executeQuery(() =>
  supabase.from('table').select('*')
);
```

## Benefits

1. **Consistency**: All edge functions use the same configuration and database access patterns
2. **Error Handling**: Centralized error handling and retry logic
3. **Maintainability**: Update secrets management in one place
4. **Developer Experience**: Clear error messages and helpful warnings
5. **Flexibility**: Works with or without database/API keys (graceful degradation)

## Environment Variables

See `docs/LOVABLE_CLOUD_SETUP.md` for complete list of supported environment variables.

## Integration

To use these utilities in a new edge function:

1. Import the modules:
```typescript
import { getConfig, getSecrets } from '../_shared/config.ts';
import { getSupabaseClient, executeQuery } from '../_shared/database.ts';
```

2. Get configuration:
```typescript
const config = getConfig();
if (config.features.enableDatabase) {
  const supabase = getSupabaseClient();
  // Use database
}
```

3. Access secrets:
```typescript
const secrets = getSecrets();
if (secrets.lovableApiKey) {
  // Use Lovable API
}
```

