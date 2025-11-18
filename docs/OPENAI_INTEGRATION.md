# OpenAI Integration Guide

This document describes the OpenAI API integration for the Quaternion project, including setup, usage, and best practices.

## Overview

The OpenAI integration consists of:
- **Edge Proxy** (`src/edge/ai/openai.ts`) - Server-side proxy that keeps API keys secure
- **Frontend Client** (`src/ai/openaiClient.ts`) - Typed TypeScript client for frontend use
- **Example Component** (`src/components/ai/StreamingChatDemo.tsx`) - React demo component

## Setup

### 1. Environment Variables

Add your OpenAI API key to Lovable Console → Secrets:
- **OPENAI_API_KEY** = `sk-...` (your OpenAI API key)

Optional environment variables:
- **OPENAI_MOCK** = `true` - Enable mock mode for offline/demo use
- **OPENAI_BASE** = Custom OpenAI API base URL (default: `https://api.openai.com/v1`)
- **VITE_EDGE_BASE** = Frontend base URL for edge functions (default: `/api`)

### 2. Security

**IMPORTANT**: The `OPENAI_API_KEY` is kept server-side only in the edge function. Never expose it to the browser. The edge proxy handles all API calls securely.

## API Endpoints

The edge function exposes two endpoints:

### POST `/api/ai/openai/chat`
Chat completions (streaming or non-streaming)

**Request Body:**
```typescript
{
  messages: Array<{ role: 'user' | 'assistant' | 'system', content: string }>,
  model?: string,           // Default: 'gpt-4o-mini'
  max_tokens?: number,       // Default: 512
  temperature?: number,      // Default: 0.8
  stream?: boolean,         // Default: false
  cache?: boolean           // Enable caching (default: false)
}
```

**Response (non-streaming):**
```typescript
{
  id: string,
  choices: Array<{
    message: { role: string, content: string },
    finish_reason?: string
  }>,
  usage?: {
    prompt_tokens: number,
    completion_tokens: number,
    total_tokens: number
  }
}
```

**Response (streaming):**
Returns a `ReadableStream` with `text/event-stream` content type (Server-Sent Events format).

### POST `/api/ai/openai/transcribe`
Audio transcription using Whisper

**Request Body:**
```typescript
{
  audioBase64: string,      // Base64 encoded audio data
  model?: string            // Default: 'whisper-1'
}
```

**Response:**
```typescript
{
  text: string
}
```

## Usage Examples

### Non-Streaming Chat

```typescript
import { chatCompletion, type ChatMessage } from '@/ai/openaiClient';

const messages: ChatMessage[] = [
  { role: 'user', content: 'What is the quaternion game about?' }
];

const response = await chatCompletion({
  messages,
  model: 'gpt-4o-mini',
  max_tokens: 256,
  temperature: 0.7,
});

console.log(response.choices[0].message.content);
```

### Streaming Chat

```typescript
import { streamChat, parseStreamingResponse, type ChatMessage } from '@/ai/openaiClient';

const messages: ChatMessage[] = [
  { role: 'user', content: 'Explain the equilibrium system in 3 sentences.' }
];

const stream = await streamChat({ messages });

if (stream) {
  await parseStreamingResponse(stream, (content, done) => {
    if (!done) {
      console.log('Chunk:', content);
      // Update UI progressively
    } else {
      console.log('Stream complete');
    }
  });
}
```

### React Hook Example

```typescript
import { useState } from 'react';
import { streamChat, parseStreamingResponse, type ChatMessage } from '@/ai/openaiClient';

function useStreamingChat() {
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (message: string) => {
    setLoading(true);
    setOutput('');

    const messages: ChatMessage[] = [
      { role: 'user', content: message }
    ];

    try {
      const stream = await streamChat({ messages });
      if (stream) {
        await parseStreamingResponse(stream, (content, done) => {
          if (done) {
            setLoading(false);
          } else {
            setOutput(prev => prev + content);
          }
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setLoading(false);
    }
  };

  return { output, loading, sendMessage };
}
```

### Audio Transcription

```typescript
import { transcribeAudioBase64 } from '@/ai/openaiClient';

// Assuming you have audio as base64 (e.g., from a recording)
const audioBase64 = '...'; // Your base64 audio data

const result = await transcribeAudioBase64(audioBase64);
console.log(result.text);
```

## Features

### Caching

The edge function supports prompt-based caching to avoid repeated API calls for identical prompts:

```typescript
const response = await chatCompletion({
  messages,
  cache: true  // Enable caching
});
```

**Note**: The current implementation uses in-memory caching. For production, replace with durable storage (Lovable storage, S3, or similar).

### Retry Logic

The edge function includes automatic retry with exponential backoff:
- Default: 3 retries
- Initial delay: 200ms
- Backoff factor: 2x

### Mock Mode

Enable mock mode for development or when API key is unavailable:

```bash
OPENAI_MOCK=true
```

Mock responses are deterministic and suitable for demos and testing.

## Telemetry & Logging

For production, consider logging:
- `promptHash` - SHA256 hash of the prompt
- `model`, `temperature`, `max_tokens`
- `timestamp`, `latencyMs`, `edgeRequestId`
- Response content (avoid storing raw user PII)

This helps with:
- Reproducibility for judges/sponsors
- Usage tracking
- Debugging

## Best Practices

1. **Security**
   - Never expose `OPENAI_API_KEY` to the browser
   - Validate and sanitize user inputs to prevent prompt injection
   - Add usage caps to prevent runaway billing

2. **Performance**
   - Use streaming for long responses to reduce perceived latency
   - Enable caching for repeated prompts
   - Implement rate limiting on the server side

3. **Error Handling**
   - Always handle errors gracefully
   - Provide fallback behavior when API is unavailable
   - Log errors for debugging

4. **Cost Management**
   - Monitor token usage
   - Set appropriate `max_tokens` limits
   - Use caching to avoid duplicate calls
   - Consider using `gpt-4o-mini` for non-critical tasks

## Migration from Other LLM Integrations

If you're migrating from other LLM integrations:

1. Replace direct API calls with `chatCompletion()` or `streamChat()`
2. Update environment variables to use `OPENAI_API_KEY`
3. Update error handling to match the new API
4. Test streaming functionality if previously using non-streaming

## Troubleshooting

### "Missing OPENAI_API_KEY in environment"
- Ensure the key is set in Lovable Console → Secrets
- Check that the environment variable name is exactly `OPENAI_API_KEY`

### "Chat failed: 401"
- Verify your API key is valid
- Check that the key has not expired

### "Stream chat failed"
- Ensure the response body is a ReadableStream
- Check network connectivity
- Verify the edge function is deployed correctly

### Streaming not working
- Check that `stream: true` is set in the request
- Verify the frontend can handle `ReadableStream`
- Use `parseStreamingResponse()` helper for proper SSE parsing

## Next Steps

Consider implementing:
1. **Function Calling** - Use OpenAI's function calling API for structured outputs
2. **Structured Outputs** - Use JSON mode for consistent response formats
3. **Persistent Caching** - Replace in-memory cache with durable storage
4. **Rate Limiting** - Add per-user or per-session rate limits
5. **Usage Tracking** - Implement comprehensive telemetry

## References

- [OpenAI Platform Documentation](https://platform.openai.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Server-Sent Events (SSE) Specification](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

