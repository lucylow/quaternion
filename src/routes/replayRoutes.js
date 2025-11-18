// src/routes/replayRoutes.js
// Express router for replay endpoints.
// Add into your main server (e.g., server.js): app.use('/api/replay', require('./src/routes/replayRoutes'));

const express = require('express');
const router = express.Router();
const exporter = require('../replay/exporter');
const fs = require('fs');
const path = require('path');

async function validateGenerateBody(body) {
  if (!body) return 'Missing body';
  if (typeof body.seed !== 'number') return 'seed must be a number';
  if (!body.mapConfig || typeof body.mapConfig !== 'object') return 'mapConfig required';
  if (!body.commanderId || typeof body.commanderId !== 'string') return 'commanderId required';
  return null;
}

router.post('/generate', async (req, res) => {
  try {
    const errMsg = await validateGenerateBody(req.body);
    if (errMsg) return res.status(400).json({ message: errMsg });

    const { seed, mapConfig, commanderId, mode = 'fast' } = req.body;

    // exporter returns { replayId, metadata, url }
    const result = await exporter.generateAndUpload({ seed, mapConfig, commanderId, mode });

    return res.json(result);
  } catch (err) {
    console.error('replay.generate error', err);
    const errorId = (Math.random() + 1).toString(36).substring(2, 10);
    return res.status(500).json({ errorId, message: 'Internal server error' });
  }
});

router.get('/:replayId', async (req, res) => {
  try {
    const { replayId } = req.params;
    const meta = await exporter.getMetadata(replayId);
    if (!meta) return res.status(404).json({ message: 'Not found' });
    return res.json(meta);
  } catch (err) {
    console.error('replay.get error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:replayId/download', async (req, res) => {
  try {
    const { replayId } = req.params;
    const downloadInfo = await exporter.getDownloadStream(replayId);
    if (!downloadInfo) return res.status(404).json({ message: 'Not found' });

    const { stream, size, filename } = downloadInfo;

    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    if (size) res.setHeader('Content-Length', size);

    // Pipe the stream to response
    stream.pipe(res);
  } catch (err) {
    console.error('replay.download error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;


