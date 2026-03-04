#!/bin/bash

# OpenClaw Web Bridge Deployment Script
# Domain: savelink.web.id

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Deploying OpenClaw Web Bridge to savelink.web.id${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root or with sudo${NC}"
    exit 1
fi

# Update system
echo -e "${YELLOW}📦 Updating system...${NC}"
apt-get update && apt-get upgrade -y

# Install Docker if not exists
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}🐳 Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker $USER
    rm get-docker.sh
fi

# Install Docker Compose if not exists
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}🐳 Installing Docker Compose...${NC}"
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Create app directory
APP_DIR="/opt/openclaw-web-bridge"
echo -e "${YELLOW}📁 Creating app directory: $APP_DIR${NC}"
mkdir -p $APP_DIR
cd $APP_DIR

# Clone repository (if not already cloned)
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}📥 Cloning repository...${NC}"
    git clone https://github.com/creativealip-rgb/openclaw-web-bridge.git .
fi

# Create .env file
echo -e "${YELLOW}⚙️  Creating environment file...${NC}"
cat > .env << EOF
NODE_ENV=production
PORT=3000
OPENCLAW_GATEWAY_URL=ws://localhost:18789
JWT_SECRET=$(openssl rand -base64 32)
ALLOWED_ORIGINS=https://savelink.web.id,http://localhost:5173
EOF

# Create necessary directories
echo -e "${YELLOW}📁 Creating directories...${NC}"
mkdir -p certbot/conf certbot/www

# Build and start containers
echo -e "${YELLOW}🏗️  Building containers...${NC}"
docker-compose build --no-cache

echo -e "${YELLOW}▶️  Starting containers...${NC}"
docker-compose up -d

# Get SSL certificate
echo -e "${YELLOW}🔒 Getting SSL certificate...${NC}"
docker-compose run --rm certbot certonly --webroot --webroot-path=/var/www/certbot \
    --email admin@savelink.web.id --agree-tos --no-eff-email \
    -d savelink.web.id -d www.savelink.web.id || true

# Reload nginx
echo -e "${YELLOW}🔄 Reloading Nginx...${NC}"
docker-compose exec nginx nginx -s reload || true

# Setup auto-renewal cron job
echo -e "${YELLOW}⏰ Setting up SSL auto-renewal...${NC}"
(crontab -l 2>/dev/null; echo "0 12 * * * cd $APP_DIR && docker-compose run --rm certbot renew --quiet && docker-compose exec nginx nginx -s reload") | crontab -

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 Your app is running at: https://savelink.web.id${NC}"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  View logs:    docker-compose logs -f"
echo "  Stop app:     docker-compose down"
echo "  Restart app:  docker-compose restart"
echo "  Update app:   docker-compose pull && docker-compose up -d"
