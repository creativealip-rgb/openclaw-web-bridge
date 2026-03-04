import { useState, useEffect, useRef, useCallback } from 'react';

export function useOpenClaw(wsUrl) {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);

  // Generate atau ambil session ID dari localStorage
  const getOrCreateSessionId = useCallback(() => {
    const stored = localStorage.getItem('openclaw_session_id');
    if (stored) return stored;
    
    const newId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem('openclaw_session_id', newId);
    return newId;
  }, []);

  // Connect ke WebSocket
  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      console.log('Already connected');
      return;
    }

    try {
      ws.current = new WebSocket(wsUrl);
      
      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        
        // Auth dengan session ID
        const sid = getOrCreateSessionId();
        ws.current.send(JSON.stringify({
          type: 'auth',
          token: 'demo-token',
          sessionId: sid,
        }));
      };
      
      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };
      
      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setIsAuthenticated(false);
        
        // Auto reconnect
        reconnectTimeout.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, 3000);
      };
      
      ws.current.onerror = (err) => {
        console.error('WebSocket error:', err);
      };
    } catch (err) {
      console.error('Connection error:', err);
    }
  }, [wsUrl, getOrCreateSessionId]);

  // Handle incoming messages
  const handleMessage = useCallback((data) => {
    switch (data.type) {
      case 'auth_success':
        setIsAuthenticated(true);
        setSessionId(data.sessionId);
        if (data.history) {
          setMessages(data.history);
        }
        break;
        
      case 'message':
        setMessages((prev) => {
          // Hindari duplikat
          if (prev.some((m) => m.id === data.data.id)) {
            return prev;
          }
          return [...prev, data.data];
        });
        break;
        
      case 'history_cleared':
        setMessages([]);
        break;
        
      case 'error':
        console.error('Server error:', data.message);
        break;
        
      default:
        console.log('Unknown message type:', data);
    }
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    setIsConnected(false);
    setIsAuthenticated(false);
  }, []);

  // Kirim pesan
  const sendMessage = useCallback((text) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }
    
    ws.current.send(JSON.stringify({
      type: 'chat',
      text,
    }));
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      return;
    }
    
    ws.current.send(JSON.stringify({
      type: 'clear_history',
    }));
  }, []);

  // Auto-connect saat mount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    messages,
    isConnected,
    isAuthenticated,
    sessionId,
    connect,
    disconnect,
    sendMessage,
    clearHistory,
  };
}
