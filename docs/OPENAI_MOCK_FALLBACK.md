# OpenAI Mock Fallback System

This document explains how the OpenAI integration gracefully falls back to mock data when API keys are missing or API calls fail.

## Overview

The OpenAI integration is designed to **always work**, even when:
- The `OPENAI_API_KEY` is not configured
- The API key is invalid or expired
- Network errors occur
- API rate limits are hit
- Server errors (5xx) occur

In all these cases, the system automatically falls back to mock responses so your demo always works.

## How It Works

### Edge Function (`src/edge/ai/openai.ts`)

The edge function checks for mock mode in this order:

1. **Explicit mock key** - If `mockKey` is provided in the request body
2. **Environment variable** - If `OPENAI_MOCK=true` is set
3. **Missing API key** - If `OPENAI_API_KEY` is not configured

```typescript
function shouldUseMock(mockKey?: string): boolean {
  return !!(mockKey || MOCK || !OPENAI_KEY);
}
```

### Automatic Fallback

Even when trying to use the real API, the system automatically falls back to mock if:

- **Fetch errors** - Network failures, timeouts, etc.
- **API errors (5xx)** - Server errors from OpenAI
- **401/403 errors** - Invalid or expired API keys
- **Rate limit errors** - When API quota is exceeded

### Mock Response Quality

Mock responses are **context-aware** and provide helpful information:

- **Questions** → "Mock answer: This is a demo response..."
- **Explanations** → "Mock explanation: This feature demonstrates..."
- **Quaternion-related** → "Mock response: Quaternion is a strategic game..."
- **Generic** → Includes the original prompt snippet

### Streaming Support

Mock mode also works with streaming responses, simulating the progressive text output that real OpenAI streaming provides.

## Frontend Client (`src/ai/openaiClient.ts`)

The frontend client automatically retries with mock mode when:

- **Server errors (5xx)** occur
- **Network errors** (fetch failures) occur

This ensures the UI always gets a response, even if the API is down.

## Usage Examples

### Automatic Fallback (Recommended)

Just call the functions normally - they'll automatically use mock if needed:

```typescript
// This will use real API if available, mock if not
const response = await chatCompletion({
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

### Explicit Mock Mode

Force mock mode for demos:

```typescript
// Always use mock, even if API key is configured
const response = await chatCompletion({
  messages: [{ role: 'user', content: 'Hello!' }],
  mockKey: 'demo'
});
```

### Environment-Based Mock

Set in Lovable Console → Secrets:
```
OPENAI_MOCK=true
```

This forces all requests to use mock mode, useful for:
- Local development
- Hackathons/demos
- Testing without API costs

## Demo Component

The `StreamingChatDemo` component shows:
- ✅ **Yellow banner** when using mock mode
- ✅ **Automatic fallback** if real API fails
- ✅ **Clear indication** that mock responses are being used

## Benefits

1. **Always Works** - Your demo never breaks due to missing API keys
2. **Cost Control** - Test without API costs
3. **Graceful Degradation** - App continues working even if API is down
4. **Developer Friendly** - No need to configure API keys for basic testing
5. **Demo Ready** - Perfect for hackathons and presentations

## Configuration

### For Real API Usage

1. Add `OPENAI_API_KEY` to Lovable Console → Secrets
2. Remove or set `OPENAI_MOCK=false`
3. Don't pass `mockKey` in requests

### For Demo/Mock Mode

1. Don't set `OPENAI_API_KEY` (or set `OPENAI_MOCK=true`)
2. Or pass `mockKey: 'demo'` in requests
3. System automatically uses mock

## Error Handling Flow

```
User Request
    ↓
Check for mock mode?
    ├─ Yes → Return mock response ✅
    └─ No → Try real API
            ↓
        API call succeeds?
            ├─ Yes → Return real response ✅
            └─ No → Fallback to mock ✅
```

## Best Practices

1. **Always handle errors** - Even with automatic fallback, catch errors
2. **Show mock indicator** - Let users know when mock mode is active
3. **Test both modes** - Verify real API and mock mode both work
4. **Monitor logs** - Check console for fallback warnings
5. **Set API key in production** - Use real API in production, mock in dev

## Troubleshooting

### "Always getting mock responses"

- Check if `OPENAI_MOCK=true` is set
- Verify `OPENAI_API_KEY` is configured correctly
- Check console logs for API errors

### "Not falling back to mock on errors"

- Ensure you're using the latest client code
- Check that error handling is in place
- Verify edge function is deployed

### "Mock responses seem generic"

- Mock responses are intentionally simple
- They indicate demo mode is active
- Real API provides full AI responses

## Summary

The mock fallback system ensures your OpenAI integration:
- ✅ Works out of the box (no API key required)
- ✅ Never breaks due to API issues
- ✅ Provides clear feedback about mode
- ✅ Gracefully degrades on errors
- ✅ Perfect for demos and development

This makes your integration **demo-ready** and **production-ready** at the same time!

