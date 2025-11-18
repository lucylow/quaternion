# LTX Video Generation Integration

Complete integration for LTX (text-to-video & image-to-video) API with mock mode support.

## Overview

This integration provides:
- **Edge handler** (`api/ai/ltx.js`) - Server-side proxy that keeps API keys secure
- **Frontend client** (`src/video/ltxClient.ts`) - TypeScript client for calling the API
- **React component** (`src/components/VideoGenerator.tsx`) - Demo UI component
- **Batch script** (`scripts/batch_generate_ltx.js`) - For pre-generating videos

## Setup

### 1. API Key Configuration

Set your LTX API key in your environment:

**For Lovable Cloud:**
- Add `LTX_API_KEY` to your Lovable secrets/environment variables

**For local development:**
- Create `.env.local` file:
  ```
  LTX_API_KEY=sk_your_api_key_here
  ```

**Mock Mode (no API key needed):**
- Set `LTX_MOCK=true` in environment, or
- The handler automatically uses mock mode if no API key is set

### 2. API Endpoints

The edge handler exposes two endpoints:

- `POST /api/ai/ltx/text-to-video` - Generate video from text prompt
- `POST /api/ai/ltx/image-to-video` - Generate video from image + prompt

### 3. Usage Examples

#### Frontend (React)

```tsx
import { generateVideoFromText, generateVideoFromImage } from '../video/ltxClient';

// Text-to-video
const { blob, url } = await generateVideoFromText({
  prompt: "A majestic eagle soaring through clouds",
  model: "ltx-2-pro",
  duration: 8,
  resolution: "1920x1080"
});

// Image-to-video
const { blob, url } = await generateVideoFromImage({
  imageUri: "https://example.com/image.jpg",
  prompt: "Make this image come to life",
  duration: 6
});
```

#### Using the VideoGenerator Component

```tsx
import VideoGenerator from '../components/VideoGenerator';

function MyPage() {
  return <VideoGenerator />;
}
```

#### Batch Generation (Node.js)

```bash
# Set your edge base URL
export EDGE_BASE=http://localhost:3000

# Run batch generation
node scripts/batch_generate_ltx.js
```

Edit `scripts/ltx_jobs.json` to define your video generation jobs.

## API Reference

### Text-to-Video

**Endpoint:** `POST /api/ai/ltx/text-to-video`

**Request Body:**
```json
{
  "prompt": "Your video description",
  "model": "ltx-2-pro" | "ltx-2-fast",
  "duration": 8,
  "resolution": "1920x1080" | "1280x720",
  "fps": 25,
  "generate_audio": true
}
```

**Response:**
- Success: Binary MP4 video (or JSON with `url` if cached)
- Error: JSON with `error` field

### Image-to-Video

**Endpoint:** `POST /api/ai/ltx/image-to-video`

**Request Body:**
```json
{
  "image_uri": "https://example.com/image.jpg",
  "prompt": "Your video description",
  "model": "ltx-2-pro",
  "duration": 8,
  "resolution": "1920x1080",
  "fps": 25,
  "generate_audio": true
}
```

## Mock Mode

Mock mode is automatically enabled when:
- `LTX_MOCK=true` is set in environment
- `mock: true` is passed in request body
- No `LTX_API_KEY` is configured

Mock mode returns a minimal valid MP4 structure (not playable but valid format) for testing and demos.

## Caching

The handler includes cache hooks (`getCachedVideo`, `putCachedVideo`) that can be implemented with:
- S3 bucket storage
- Lovable blob storage
- Database with presigned URLs

Cache is keyed by prompt hash (SHA256 of prompt + options) for reproducibility.

## Telemetry

The handler logs:
- Prompt hash
- Model used
- Generation duration
- Response size
- Timestamp

This data can be stored for judge-proof reproducibility.

## Security Notes

- API key is never exposed to the client
- All requests go through the edge handler
- Input validation on prompt length and parameters
- Rate limiting should be implemented at the edge level

## Troubleshooting

**Error: "Missing LTX_API_KEY"**
- Set `LTX_MOCK=true` to use mock mode, or
- Configure your API key in environment variables

**Videos not generating:**
- Check network tab for API errors
- Verify API key is valid
- Check LTX API status

**Mock videos not working:**
- Mock videos are minimal MP4 structures (not playable)
- Use real API key for actual video generation

## Sponsor Integration

For Devpost/hackathon submissions:
1. Store prompt hash + metadata in a JSON manifest
2. Include sample request/response examples
3. Note that API key is stored in Lovable secrets (not exposed)
4. Include generated video files in assets

## Files

- `api/ai/ltx.js` - Edge handler
- `src/video/ltxClient.ts` - Frontend client
- `src/components/VideoGenerator.tsx` - React component
- `scripts/batch_generate_ltx.js` - Batch generation script
- `scripts/ltx_jobs.json` - Batch job definitions

