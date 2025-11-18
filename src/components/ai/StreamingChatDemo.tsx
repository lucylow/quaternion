// src/components/ai/StreamingChatDemo.tsx
// Example React component demonstrating OpenAI streaming chat integration

import { useEffect, useState } from 'react';
import { streamChat, parseStreamingResponse, chatCompletion, type ChatMessage } from '../../ai/openaiClient';

export default function StreamingChatDemo() {
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMockMode, setIsMockMode] = useState(false);

  // Example: Streaming chat
  const handleStreamingChat = async () => {
    setLoading(true);
    setError(null);
    setOutput('');
    setIsMockMode(false);

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
          // Check if response indicates mock mode
          if (content.toLowerCase().includes('mock')) {
            setIsMockMode(true);
          }
        }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to stream chat');
      setLoading(false);
      // Try with explicit mock mode as fallback
      try {
        const messages: ChatMessage[] = [
          { role: 'user', content: 'Explain the equilibrium system in 3 sentences.' }
        ];
        const mockStream = await streamChat({ messages, mockKey: 'demo' });
        if (mockStream) {
          setIsMockMode(true);
          await parseStreamingResponse(mockStream, (content, done) => {
            if (done) {
              setLoading(false);
            } else {
              setOutput(prev => prev + content);
            }
          });
        }
      } catch (mockErr) {
        // If even mock fails, show error
      }
    }
  };

  // Example: Non-streaming chat
  const handleNonStreamingChat = async () => {
    setLoading(true);
    setError(null);
    setOutput('');
    setIsMockMode(false);

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
      
      // Check if response indicates mock mode
      if (content.toLowerCase().includes('mock')) {
        setIsMockMode(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get chat completion');
      setLoading(false);
      // Try with explicit mock mode as fallback
      try {
        const messages: ChatMessage[] = [
          { role: 'user', content: 'What is the quaternion game about?' }
        ];
        const mockResponse = await chatCompletion({
          messages,
          model: 'gpt-4o-mini',
          max_tokens: 256,
          temperature: 0.7,
          mockKey: 'demo',
        });
        const content = mockResponse.choices[0]?.message?.content || 'No response';
        setOutput(content);
        setIsMockMode(true);
        setLoading(false);
      } catch (mockErr) {
        // If even mock fails, show error
      }
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

      {isMockMode && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          ⚠️ Demo Mode: Using mock responses. Configure OPENAI_API_KEY in Lovable secrets for real AI responses.
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

