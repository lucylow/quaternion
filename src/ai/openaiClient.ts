// src/ai/openaiClient.ts
// Frontend client for OpenAI API (calls Edge proxy, never calls OpenAI directly)
// Provides typed interfaces for chat completions and audio transcription

const EDGE_BASE = import.meta.env.VITE_EDGE_BASE || '/api';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  model?: string;
  max_tokens?: number;
  temperature?: number;
  cache?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface TranscriptionResponse {
  text: string;
}

/**
 * Chat completion (non-streaming)
 * @param options Chat completion options
 * @returns Promise with chat completion response
 */
export async function chatCompletion(
  options: ChatCompletionOptions
): Promise<ChatCompletionResponse> {
  const {
    messages,
    model = 'gpt-4o-mini',
    max_tokens = 512,
    temperature = 0.8,
    cache = false,
  } = options;

  const res = await fetch(`${EDGE_BASE}/ai/openai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model, max_tokens, temperature, cache }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(`Chat failed: ${res.status} ${errorText}`);
  }

  return res.json();
}

/**
 * Chat completion (streaming)
 * Returns a ReadableStream of text/event-stream that can be consumed progressively
 * @param options Chat completion options (stream is automatically set to true)
 * @returns Promise with ReadableStream
 */
export async function streamChat(
  options: Omit<ChatCompletionOptions, 'cache' | 'max_tokens'>
): Promise<ReadableStream<Uint8Array> | null> {
  const { messages, model = 'gpt-4o-mini', temperature = 0.8 } = options;

  const res = await fetch(`${EDGE_BASE}/ai/openai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model, temperature, stream: true }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => 'Unknown error');
    throw new Error(`Stream chat failed: ${res.status} ${txt}`);
  }

  return res.body;
}

/**
 * Audio transcription (send base64 encoded audio)
 * @param audioBase64 Base64 encoded audio data
 * @param model Whisper model to use (default: 'whisper-1')
 * @returns Promise with transcription response
 */
export async function transcribeAudioBase64(
  audioBase64: string,
  model: string = 'whisper-1'
): Promise<TranscriptionResponse> {
  const res = await fetch(`${EDGE_BASE}/ai/openai/transcribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioBase64, model }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(`Transcription failed: ${res.status} ${errorText}`);
  }

  return res.json();
}

/**
 * Helper to parse SSE (Server-Sent Events) from OpenAI streaming response
 * @param stream ReadableStream from streamChat
 * @param onChunk Callback for each parsed chunk
 * @returns Promise that resolves when stream is complete
 */
export async function parseStreamingResponse(
  stream: ReadableStream<Uint8Array> | null,
  onChunk: (content: string, done: boolean) => void
): Promise<void> {
  if (!stream) {
    throw new Error('Stream is null');
  }

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      
      if (done) {
        if (buffer.trim()) {
          // Process any remaining buffer
          processSSEChunk(buffer, onChunk);
        }
        onChunk('', true);
        break;
      }

      if (value) {
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete SSE lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          processSSEChunk(line, onChunk);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Process a single SSE chunk
 */
function processSSEChunk(
  line: string,
  onChunk: (content: string, done: boolean) => void
): void {
  if (!line.trim() || !line.startsWith('data: ')) {
    return;
  }

  const data = line.slice(6); // Remove 'data: ' prefix
  
  if (data === '[DONE]') {
    onChunk('', true);
    return;
  }

  try {
    const json = JSON.parse(data);
    const content = json.choices?.[0]?.delta?.content || '';
    if (content) {
      onChunk(content, false);
    }
  } catch (e) {
    // Ignore parse errors for incomplete chunks
  }
}

