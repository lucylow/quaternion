// src/components/VideoGenerator.tsx
// React component for LTX Video Generation (text-to-video & image-to-video)
// Demo UI with upload/prompt interface and progress display

import React, { useState } from "react";
import { generateVideoFromText, generateVideoFromImage } from "../video/ltxClient";

export default function VideoGenerator() {
  const [prompt, setPrompt] = useState("A majestic eagle soaring through clouds at sunset");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string>("");
  const [progress, setProgress] = useState<number | null>(null);
  const [model, setModel] = useState<string>("ltx-2-pro");
  const [duration, setDuration] = useState<number>(6);
  const [resolution, setResolution] = useState<string>("1280x720");
  const [generateAudio, setGenerateAudio] = useState<boolean>(true);

  async function handleTextGen() {
    setLoading(true);
    setError(null);
    setProgress(0);
    setVideoUrl(null);

    try {
      const { url } = await generateVideoFromText({
        prompt,
        duration,
        resolution,
        model,
        generate_audio: generateAudio
      });
      setVideoUrl(url);
      setProgress(100);
    } catch (e: any) {
      setError(e.message || String(e));
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleImageGen() {
    if (!imageUri.trim()) {
      setError("Please provide an image URL");
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(0);
    setVideoUrl(null);

    try {
      const { url } = await generateVideoFromImage({
        imageUri,
        prompt,
        duration,
        resolution,
        model,
        generate_audio: generateAudio
      });
      setVideoUrl(url);
      setProgress(100);
    } catch (e: any) {
      setError(e.message || String(e));
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h3 className="text-2xl font-bold mb-4">LTX Video Generator</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Prompt</label>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the video you want to generate..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Model</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              <option value="ltx-2-pro">LTX-2 Pro</option>
              <option value="ltx-2-fast">LTX-2 Fast</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Duration (seconds)</label>
            <input
              type="number"
              min="1"
              max="30"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Resolution</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
            >
              <option value="1280x720">1280x720 (HD)</option>
              <option value="1920x1080">1920x1080 (Full HD)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Options</label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={generateAudio}
                onChange={(e) => setGenerateAudio(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Generate Audio</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Image URL (for image-to-video)</label>
          <input
            type="text"
            placeholder="https://example.com/image.jpg"
            value={imageUri}
            onChange={(e) => setImageUri(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleTextGen}
            disabled={loading || !prompt.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Generate from Text
          </button>
          <button
            onClick={handleImageGen}
            disabled={loading || !prompt.trim() || !imageUri.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Generate from Image
          </button>
        </div>

        {loading && (
          <div className="mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span>Generating video... (may take several seconds)</span>
            </div>
            {progress !== null && progress < 100 && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">{progress}%</p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600">
            {error}
          </div>
        )}

        {videoUrl && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold mb-2">Generated Video</h4>
            <video
              src={videoUrl}
              controls
              className="w-full rounded-md shadow-md"
              style={{ maxHeight: '600px' }}
            />
            <div className="mt-3">
              <a
                href={videoUrl}
                download="ltx_generated.mp4"
                className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Download Video
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

