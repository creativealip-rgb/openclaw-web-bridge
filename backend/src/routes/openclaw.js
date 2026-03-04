const express = require('express');
const router = express.Router();
const { OpenClawService } = require('../services/openclawService');

const openclawService = new OpenClawService();

// POST /api/chat - Kirim pesan via REST
router.post('/chat', async (req, res) => {
  try {
    const { text, sessionId } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const response = await openclawService.sendMessage(text, sessionId);
    
    res.json({
      success: true,
      sessionId,
      message: text,
      response,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/status - Check OpenClaw connection status
router.get('/status', (req, res) => {
  res.json({
    connected: openclawService.connected,
    gatewayUrl: openclawService.gatewayUrl,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
