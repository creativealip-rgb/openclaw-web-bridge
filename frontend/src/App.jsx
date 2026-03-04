import React from 'react'
import { Chat } from './components/Chat'

function App() {
  return (
    <div className="app">
      <header style={headerStyle}>
        <h1>🤖 OpenClaw Web Bridge</h1>
        <p style={subtitleStyle}>Chat dengan OpenClaw AI melalui WebSocket</p>
      </header>
      
      <main style={mainStyle}>
        <Chat />
      </main>
      
      <footer style={footerStyle}>
        <p>Powered by OpenClaw 🤖</p>
      </footer>
    </div>
  )
}

const headerStyle = {
  padding: '20px',
  textAlign: 'center',
  borderBottom: '1px solid #333',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
}

const subtitleStyle = {
  marginTop: '8px',
  opacity: 0.9,
  fontSize: '14px',
}

const mainStyle = {
  maxWidth: '900px',
  margin: '0 auto',
  padding: '20px',
  minHeight: 'calc(100vh - 140px)',
}

const footerStyle = {
  textAlign: 'center',
  padding: '15px',
  borderTop: '1px solid #333',
  fontSize: '12px',
  opacity: 0.6,
}

export default App
