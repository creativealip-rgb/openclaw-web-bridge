const WebSocket = require('ws');

class OpenClawService {
  constructor() {
    this.gatewayUrl = process.env.OPENCLAW_GATEWAY_URL || 'ws://localhost:18789';
    this.ws = null;
    this.connected = false;
    this.messageQueue = [];
    this.pendingResponses = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.gatewayUrl);
        
        this.ws.on('open', () => {
          console.log('Connected to OpenClaw Gateway:', this.gatewayUrl);
          this.connected = true;
          
          // Send queued messages
          while (this.messageQueue.length > 0) {
            const msg = this.messageQueue.shift();
            this.ws.send(JSON.stringify(msg));
          }
          
          resolve();
        });
        
        this.ws.on('message', (data) => {
          try {
            const response = JSON.parse(data);
            this.handleResponse(response);
          } catch (err) {
            console.error('Error parsing gateway message:', err);
          }
        });
        
        this.ws.on('error', (err) => {
          console.error('OpenClaw Gateway error:', err);
          if (!this.connected) {
            reject(err);
          }
        });
        
        this.ws.on('close', () => {
          console.log('Disconnected from OpenClaw Gateway');
          this.connected = false;
          
          // Reconnect logic
          setTimeout(() => {
            console.log('Attempting to reconnect...');
            this.connect().catch(err => console.error('Reconnect failed:', err));
          }, 5000);
        });
        
      } catch (err) {
        reject(err);
      }
    });
  }

  handleResponse(response) {
    // Handle response dari OpenClaw Gateway
    // Format bisa disesuaikan dengan protocol OpenClaw
    
    if (response.requestId && this.pendingResponses.has(response.requestId)) {
      const { resolve, reject } = this.pendingResponses.get(response.requestId);
      this.pendingResponses.delete(response.requestId);
      
      if (response.error) {
        reject(new Error(response.error));
      } else {
        resolve(response.data || response.message || response);
      }
    }
  }

  async sendMessage(text, sessionId) {
    return new Promise((resolve, reject) => {
      const requestId = this.generateId();
      const message = {
        type: 'chat',
        requestId,
        sessionId,
        text,
        timestamp: Date.now()
      };
      
      // Set timeout
      const timeout = setTimeout(() => {
        this.pendingResponses.delete(requestId);
        reject(new Error('Request timeout'));
      }, 30000);
      
      this.pendingResponses.set(requestId, {
        resolve: (data) => {
          clearTimeout(timeout);
          resolve(data);
        },
        reject: (err) => {
          clearTimeout(timeout);
          reject(err);
        }
      });
      
      if (this.connected && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      } else {
        this.messageQueue.push(message);
        // Resolve dengan placeholder jika tidak terkoneksi
        setTimeout(() => {
          if (this.pendingResponses.has(requestId)) {
            this.pendingResponses.delete(requestId);
            resolve(`[OpenClaw not connected] Echo: ${text}`);
          }
        }, 1000);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }

  generateId() {
    return Math.random().toString(36).substring(2, 15);
  }
}

module.exports = { OpenClawService };
