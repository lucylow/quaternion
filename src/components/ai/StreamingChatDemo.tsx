// src/components/ai/StreamingChatDemo.tsx
// Example React component demonstrating OpenAI streaming chat integration

import { useEffect, useState } from 'react';
import { streamChat, parseStreamingResponse, chatCompletion, type ChatMessage } from '../../ai/openaiClient';

export default function StreamingChatDemo() {
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Example: Streaming chat
  const handleStreamingChat = async () => {
    setLoading(true);
    setError(null);
    setOutput('');

    try {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Explain the equilibrium system in 3 sentences.' }
      ];

      const stream = await streamChat({ messages });
      
      if (!stream) {
        throw new Error('No stream received');
      }

      await parseStreamingResponse(stream, (content, done) => {
        if (done) {
          setLoading(false);
        } else {
          setOutput(prev => prev + content);
        }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to stream chat');
      setLoading(false);
    }
  };

  // Example: Non-streaming chat
  const handleNonStreamingChat = async () => {
    setLoading(true);
    setError(null);
    setOutput('');

    try {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'What is the quaternion game about?' }
      ];

      const response = await chatCompletion({
        messages,
        model: 'gpt-4o-mini',
        max_tokens: 256,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || 'No response';
      setOutput(content);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to get chat completion');
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">OpenAI Chat Demo</h2>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleStreamingChat}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Streaming Chat
        </button>
        <button
          onClick={handleNonStreamingChat}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Non-Streaming Chat
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      <div className="border rounded p-4 bg-gray-50 min-h-[200px]">
        {loading && !output && (
          <div className="text-gray-500">Loading...</div>
        )}
        <pre className="whitespace-pre-wrap font-sans">{output}</pre>
      </div>
    </div>
  );
}

