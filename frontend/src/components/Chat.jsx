import React, { useState, useEffect, useRef } from 'react';
import { Message } from './Message';
import { useOpenClaw } from '../hooks/useOpenClaw';

export function Chat() {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  
  const {
    messages,
    isConnected,
    isAuthenticated,
    sessionId,
    connect,
    disconnect,
    sendMessage,
    clearHistory,
  } = useOpenClaw('ws://localhost:3000/ws');

  // Auto-scroll ke bottom saat ada pesan baru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !isConnected) return;
    
    sendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div style={chatContainerStyle}>
      {/* Header dengan status */}
      <div style={chatHeaderStyle}>
        <div style={statusContainerStyle}>
          <div
            style={{
              ...statusDotStyle,
              backgroundColor: isConnected ? '#4ade80' : '#ef4444',
            }}
          />
          <span style={statusTextStyle}>
            {isConnected ? 'Connected' : 'Disconnected'}
            {isConnected && isAuthenticated && ' • Authenticated'}
          </span>
        </div>
        
        <div style={sessionInfoStyle}>
          {sessionId && <span>Session: {sessionId.slice(0, 8)}...</span>}
        </div>
        
        <div style={actionsStyle}>
          <button
            onClick={isConnected ? disconnect : connect}
            style={buttonStyle}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </button>
          <button
            onClick={clearHistory}
            style={{ ...buttonStyle, marginLeft: '8px' }}
            disabled={!isConnected}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Message list */}
      <div style={messagesContainerStyle}>
        {messages.length === 0 ? (
          <div style={emptyStateStyle}>
            <p>👋 Selamat datang di OpenClaw Web Bridge!</p>
            <p style={{ fontSize: '14px', marginTop: '10px', opacity: 0.7 }}>
              {isConnected
                ? 'Ketik pesan untuk mulai chat dengan OpenClaw AI'
                : 'Klik Connect untuk menghubungkan ke server'}
            </p>
          </div>
        ) : (
          messages.map((msg) => <Message key={msg.id} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} style={inputContainerStyle}>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isConnected ? 'Ketik pesan... (Enter untuk kirim)' : 'Menghubungkan...'
          }
          disabled={!isConnected}
          style={textareaStyle}
          rows={1}
        />
        <button
          type="submit"
          disabled={!isConnected || !inputText.trim()}
          style={{
            ...submitButtonStyle,
            opacity: !isConnected || !inputText.trim() ? 0.5 : 1,
          }}
        >
          ➤
        </button>
      </form>
    </div>
  );
}

// Styles
const chatContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  height: '600px',
  backgroundColor: '#1a1a2e',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
};

const chatHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  backgroundColor: '#16162a',
  borderBottom: '1px solid #333',
};

const statusContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const statusDotStyle = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  transition: 'background-color 0.3s',
};

const statusTextStyle = {
  fontSize: '13px',
  color: '#aaa',
};

const sessionInfoStyle = {
  fontSize: '12px',
  color: '#666',
};

const actionsStyle = {
  display: 'flex',
  gap: '8px',
};

const buttonStyle = {
  padding: '6px 12px',
  fontSize: '12px',
  backgroundColor: '#333',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
};

const messagesContainerStyle = {
  flex: 1,
  overflowY: 'auto',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const emptyStateStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#666',
  textAlign: 'center',
};

const inputContainerStyle = {
  display: 'flex',
  gap: '8px',
  padding: '12px 16px',
  backgroundColor: '#16162a',
  borderTop: '1px solid #333',
};

const textareaStyle = {
  flex: 1,
  padding: '10px 14px',
  backgroundColor: '#0f0f23',
  color: '#fff',
  border: '1px solid #333',
  borderRadius: '8px',
  resize: 'none',
  fontSize: '14px',
  fontFamily: 'inherit',
  outline: 'none',
  minHeight: '40px',
  maxHeight: '120px',
};

const submitButtonStyle = {
  width: '40px',
  height: '40px',
  backgroundColor: '#667eea',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.2s',
};
