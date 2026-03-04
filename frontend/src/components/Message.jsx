import React from 'react';

export function Message({ message }) {
  const isUser = message.role === 'user';
  const timestamp = new Date(message.timestamp).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      style={{
        ...messageContainerStyle,
        justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      <div
        style={{
          ...messageBubbleStyle,
          backgroundColor: isUser ? '#667eea' : '#2d2d44',
          borderBottomRightRadius: isUser ? '4px' : '12px',
          borderBottomLeftRadius: isUser ? '12px' : '4px',
        }}
      >
        <div style={messageHeaderStyle}>
          <span style={roleStyle}>{isUser ? 'You' : '🤖 OpenClaw'}</span>
          <span style={timestampStyle}>{timestamp}</span>
        </div>
        
        <div style={messageTextStyle}>{message.text}</div>
      </div>
    </div>
  );
}

// Styles
const messageContainerStyle = {
  display: 'flex',
  width: '100%',
};

const messageBubbleStyle = {
  maxWidth: '70%',
  padding: '12px 16px',
  borderRadius: '12px',
  wordBreak: 'break-word',
};

const messageHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  marginBottom: '6px',
};

const roleStyle = {
  fontSize: '12px',
  fontWeight: '600',
  opacity: 0.9,
};

const timestampStyle = {
  fontSize: '11px',
  opacity: 0.6,
};

const messageTextStyle = {
  fontSize: '14px',
  lineHeight: '1.5',
  whiteSpace: 'pre-wrap',
};
