require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const { OpenClawService } = require('./src/services/openclawService');
const openclawRoutes = require('./src/routes/openclaw');
const { authMiddleware } = require('./src/middleware/auth');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');

// Middleware
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}));
app.use(express.json());

// Store untuk sessions dan message history
const sessions = new Map();
const messageHistory = new Map();

// OpenClaw Service
const openclawService = new OpenClawService();

// WebSocket connections
const clients = new Map();

// WebSocket handler
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');
  
  const clientId = generateId();
  clients.set(clientId, { ws, sessionId: null });
  
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'auth':
          // Handle authentication
          const { token, sessionId } = message;
          const isValid = await validateToken(token);
          
          if (!isValid) {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid token' }));
            return;
          }
          
          const session = sessionId || generateId();
          clients.set(clientId, { ws, sessionId: session });
          
          if (!messageHistory.has(session)) {
            messageHistory.set(session, []);
          }
          
          ws.send(JSON.stringify({ 
            type: 'auth_success', 
            sessionId: session,
            history: messageHistory.get(session) 
          }));
          break;
          
        case 'chat':
          const client = clients.get(clientId);
          if (!client || !client.sessionId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
            return;
          }
          
          const { text } = message;
          const history = messageHistory.get(client.sessionId) || [];
          
          // Save user message
          const userMsg = { id: generateId(), role: 'user', text, timestamp: Date.now() };
          history.push(userMsg);
          messageHistory.set(client.sessionId, history);
          
          // Broadcast to all clients in same session
          broadcast(client.sessionId, { type: 'message', data: userMsg });
          
          // Send to OpenClaw Gateway
          try {
            const response = await openclawService.sendMessage(text, client.sessionId);
            
            const aiMsg = { 
              id: generateId(), 
              role: 'assistant', 
              text: response, 
              timestamp: Date.now() 
            };
            history.push(aiMsg);
            messageHistory.set(client.sessionId, history);
            
            broadcast(client.sessionId, { type: 'message', data: aiMsg });
          } catch (err) {
            ws.send(JSON.stringify({ type: 'error', message: err.message }));
          }
          break;
          
        case 'clear_history':
          const c = clients.get(clientId);
          if (c && c.sessionId) {
            messageHistory.set(c.sessionId, []);
            ws.send(JSON.stringify({ type: 'history_cleared' }));
          }
          break;
      }
    } catch (err) {
      console.error('WebSocket error:', err);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket disconnected:', clientId);
    clients.delete(clientId);
  });
  
  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

// Broadcast ke semua client dalam session yang sama
function broadcast(sessionId, data) {
  clients.forEach((client) => {
    if (client.sessionId === sessionId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
    }
  });
}

// Generate unique ID
function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

// Token validation (simplified)
async function validateToken(token) {
  // Implementasi JWT atau validasi token lainnya
  // Untuk demo, accept semua token yang tidak kosong
  return token && token.length > 0;
}

// Routes
app.use('/api', openclawRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    connections: clients.size,
    sessions: sessions.size
  });
});

// Get session history
app.get('/api/history/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const history = messageHistory.get(sessionId) || [];
  res.json({ sessionId, messages: history });
});

// Create new session
app.post('/api/session', (req, res) => {
  const sessionId = generateId();
  sessions.set(sessionId, { createdAt: Date.now() });
  messageHistory.set(sessionId, []);
  res.json({ sessionId, createdAt: new Date().toISOString() });
});

// Delete session
app.delete('/api/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  sessions.delete(sessionId);
  messageHistory.delete(sessionId);
  res.json({ message: 'Session deleted' });
});

// Connect to OpenClaw Gateway
async function startServer() {
  try {
    await openclawService.connect();
    console.log('✅ Connected to OpenClaw Gateway');
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 WebSocket available at ws://localhost:${PORT}/ws`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to OpenClaw Gateway:', err.message);
    console.log('⚠️  Starting server without OpenClaw connection...');
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  openclawService.disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

startServer();
