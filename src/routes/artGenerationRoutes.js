/**
 * Art Generation API Routes
 * Proxy endpoints for ImagineArt and Dreamina image generation
 */

const express = require('express');
const router = express.Router();

// Environment variables for API keys
const IMAGINEART_API_KEY = process.env.IMAGINEART_API_KEY;
const DREAMINA_API_KEY = process.env.DREAMINA_API_KEY;
const IMAGINEART_API_URL = process.env.IMAGINEART_API_URL || 'https://api.imagine.art/v1';
const DREAMINA_API_URL = process.env.DREAMINA_API_URL || 'https://api.imagine.art/v1/dreamina';

/**
 * Generate image using ImagineArt
 * POST /api/art/imagineart
 */
router.post('/imagineart', async (req, res) => {
  try {
    const { prompt, style, width, height, aspectRatio, quality, seed, negativePrompt, numImages } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // If no API key, return mock response for development
    if (!IMAGINEART_API_KEY) {
      console.warn('IMAGINEART_API_KEY not set, returning mock response');
      return res.json({
        imageUrl: `https://via.placeholder.com/${width || 512}x${height || 512}?text=${encodeURIComponent(prompt)}`,
        imageId: `mock-${Date.now()}`,
        prompt,
        model: 'imagineart-1.0',
        metadata: {
          seed: seed || Math.floor(Math.random() * 1000000),
          style,
          generationTime: 1500,
        },
      });
    }

    // Make request to ImagineArt API
    const response = await fetch(`${IMAGINEART_API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${IMAGINEART_API_KEY}`,
      },
      body: JSON.stringify({
        prompt,
        model: 'imagineart-1.0',
        style,
        width: width || 512,
        height: height || 512,
        aspect_ratio: aspectRatio,
        quality: quality || 'high',
        seed,
        negative_prompt: negativePrompt,
        num_images: numImages || 1,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ImagineArt API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    
    res.json({
      imageUrl: data.image_url || data.url || data.image,
      imageId: data.id || data.image_id || `img-${Date.now()}`,
      prompt,
      model: 'imagineart-1.0',
      metadata: {
        seed: data.seed,
        style: data.style,
        generationTime: data.generation_time || data.time,
      },
    });
  } catch (error) {
    console.error('ImagineArt generation error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate image',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

/**
 * Generate image using Dreamina
 * POST /api/art/dreamina
 */
router.post('/dreamina', async (req, res) => {
  try {
    const { prompt, style, width, height, aspectRatio, quality, seed, negativePrompt, numImages } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // If no API key, return mock response for development
    if (!DREAMINA_API_KEY) {
      console.warn('DREAMINA_API_KEY not set, returning mock response');
      return res.json({
        imageUrl: `https://via.placeholder.com/${width || 1024}x${height || 1024}?text=${encodeURIComponent(prompt)}`,
        imageId: `mock-${Date.now()}`,
        prompt,
        model: 'dreamina-3.1',
        metadata: {
          seed: seed || Math.floor(Math.random() * 1000000),
          style,
          generationTime: 2000,
        },
      });
    }

    // Make request to Dreamina API
    const response = await fetch(`${DREAMINA_API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DREAMINA_API_KEY}`,
      },
      body: JSON.stringify({
        prompt,
        model: 'dreamina-3.1',
        style,
        width: width || 1024,
        height: height || 1024,
        aspect_ratio: aspectRatio,
        quality: quality || 'ultra',
        seed,
        negative_prompt: negativePrompt,
        num_images: numImages || 1,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Dreamina API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    
    res.json({
      imageUrl: data.image_url || data.url || data.image,
      imageId: data.id || data.image_id || `img-${Date.now()}`,
      prompt,
      model: 'dreamina-3.1',
      metadata: {
        seed: data.seed,
        style: data.style,
        generationTime: data.generation_time || data.time,
      },
    });
  } catch (error) {
    console.error('Dreamina generation error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate image',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

/**
 * Health check endpoint
 * GET /api/art/health
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    services: {
      imagineart: {
        configured: !!IMAGINEART_API_KEY,
        url: IMAGINEART_API_URL,
      },
      dreamina: {
        configured: !!DREAMINA_API_KEY,
        url: DREAMINA_API_URL,
      },
    },
  });
});

module.exports = router;

