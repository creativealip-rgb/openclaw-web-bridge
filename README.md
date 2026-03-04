# OpenClaw Web Bridge 🤖

Template lengkap untuk embed OpenClaw AI ke dalam web application dengan kontrol penuh.

## Fitur

- ✅ **Real-time Chat** via WebSocket ke OpenClaw Gateway
- ✅ **Session Management** - persist session ID
- ✅ **Message History** - history pesan tersimpan
- ✅ **Custom Auth** - middleware autentikasi
- ✅ **React Frontend** - UI chat yang clean
- ✅ **Express Backend** - REST API + WebSocket bridge

## Tech Stack

- **Backend**: Node.js, Express, WebSocket Client
- **Frontend**: React, Vite
- **Gateway**: OpenClaw Gateway (ws://localhost:18789)

## 📁 Struktur Project

```
openclaw-web-bridge/
├── backend/
│   ├── server.js              # Entry point Express
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── routes/
│       │   └── openclaw.js    # API routes
│       ├── services/
│       │   └── openclawService.js  # WebSocket handler
│       └── middleware/
│           └── auth.js        # Auth middleware
└── frontend/
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── App.jsx
        ├── components/
        │   ├── Chat.jsx       # Main chat component
        │   └── Message.jsx    # Message bubble
        └── hooks/
            └── useOpenClaw.js # Custom hook
```

## 🚀 Setup & Run

### 1. Setup Backend

```bash
cd backend
npm install

# Copy env file
cp .env.example .env

# Edit .env sesuai konfigurasi
nano .env

# Jalankan server
npm run dev
```

### 2. Setup Frontend

```bash
cd frontend
npm install

# Jalankan dev server
npm run dev
```

### 3. Akses Aplikasi

Buka browser: http://localhost:5173

## ⚙️ Konfigurasi

### Environment Variables (Backend)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Port backend server |
| `OPENCLAW_GATEWAY_URL` | ws://localhost:18789 | URL OpenClaw Gateway |
| `JWT_SECRET` | - | Secret key untuk JWT |
| `ALLOWED_ORIGINS` | http://localhost:5173 | CORS origins |

### OpenClaw Gateway

Pastikan OpenClaw Gateway sudah running:

```bash
openclaw gateway status
# atau
openclaw gateway start
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Kirim pesan ke OpenClaw |
| GET | `/api/history/:sessionId` | Ambil history chat |
| POST | `/api/session` | Buat session baru |
| DELETE | `/api/session/:sessionId` | Hapus session |
| WS | `/ws` | WebSocket real-time connection |

## 🔐 Autentikasi

Default menggunakan JWT Bearer token:

```bash
# Header untuk request
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/chat
```

## 💡 Usage Example

### Frontend Hook

```jsx
import { useOpenClaw } from './hooks/useOpenClaw';

function MyComponent() {
  const { messages, sendMessage, isConnected } = useOpenClaw();
  
  return (
    <div>
      {messages.map(msg => <p>{msg.text}</p>)}
      <button onClick={() => sendMessage('Halo!')}>Send</button>
    </div>
  );
}
```

### Backend Service

```js
const { OpenClawService } = require('./src/services/openclawService');

const service = new OpenClawService();
await service.connect();
service.sendMessage('Halo OpenClaw!');
```

## 🛠️ Customization

### Menambah Custom Auth

Edit `backend/src/middleware/auth.js`:

```js
// Tambahkan logic auth sesuai kebutuhan
// API Key, OAuth, Session-based, dll
```

### Styling

Frontend pakai Tailwind CSS (default). Edit di `frontend/src/components/Chat.jsx`

## 🚀 Deployment ke VPS (Production)

### Prerequisites
- VPS dengan Ubuntu 20.04/22.04
- Domain yang sudah pointing ke VPS (savelink.web.id)
- Port 80 dan 443 terbuka

### Quick Deploy dengan Docker

1. **SSH ke VPS**:
```bash
ssh user@vps-ip
```

2. **Clone repo**:
```bash
cd /opt
git clone https://github.com/creativealip-rgb/openclaw-web-bridge.git
cd openclaw-web-bridge
```

3. **Jalankan deploy script**:
```bash
chmod +x deploy.sh
sudo ./deploy.sh
```

Script akan otomatis:
- Install Docker & Docker Compose
- Build containers
- Setup SSL dengan Let's Encrypt
- Konfigurasi Nginx reverse proxy
- Setup auto-renewal SSL

### Manual Deploy

1. **Install Docker & Docker Compose**:
```bash
curl -fsSL https://get.docker.com | sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

2. **Setup environment**:
```bash
cp .env.example .env
nano .env  # Edit sesuai kebutuhan
```

3. **Build & run**:
```bash
docker-compose up -d --build
```

4. **Setup SSL (Let's Encrypt)**:
```bash
docker-compose run --rm certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@savelink.web.id \
  --agree-tos --no-eff-email \
  -d savelink.web.id -d www.savelink.web.id
```

### Struktur Docker

```
┌─────────────────────────────────────┐
│           Nginx (80/443)            │
│     SSL + Reverse Proxy             │
└──────────────┬──────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼────┐          ┌────▼────┐
│Frontend│          │ Backend │
│(:5173) │          │ (:3000) │
└────────┘          └─────────┘
```

### Update Deployment

```bash
cd /opt/openclaw-web-bridge
git pull
docker-compose down
docker-compose up -d --build
```

### Troubleshooting

**Cek logs**:
```bash
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend
```

**Restart services**:
```bash
docker-compose restart
docker-compose restart nginx
```

**SSL issues**:
```bash
# Renew manual
docker-compose run --rm certbot renew

# Force renew
docker-compose run --rm certbot certonly --force-renew ...
```

## 📄 License

MIT

---
Dibuat dengan ❤️ oleh Budi
