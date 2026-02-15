#!/bin/bash
# Rebuilding Iran - VPS Setup Script
# Run this on a fresh Ubuntu/Debian VPS to set up the server
# Usage: curl -sSL https://raw.githubusercontent.com/.../setup-vps.sh | bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Rebuilding Iran - VPS Setup${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (sudo)${NC}"
    exit 1
fi

# Update system
echo -e "${YELLOW}Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    ufw

# Install Docker
echo -e "${YELLOW}Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh

    # Add current user to docker group
    usermod -aG docker $SUDO_USER || true
fi

# Install Docker Compose
echo -e "${YELLOW}Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    apt-get install -y docker-compose-plugin
fi

# Configure firewall
echo -e "${YELLOW}Configuring firewall...${NC}"
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw --force enable

# Create app directory
echo -e "${YELLOW}Creating application directory...${NC}"
APP_DIR="/opt/rebuilding-iran"
mkdir -p $APP_DIR
chown $SUDO_USER:$SUDO_USER $APP_DIR

# Enable Docker to start on boot
systemctl enable docker
systemctl start docker

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  VPS Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Clone your repository:"
echo "   cd /opt/rebuilding-iran"
echo "   git clone <your-repo-url> ."
echo ""
echo "2. Create .env file:"
echo "   cp .env.example .env"
echo "   nano .env"
echo ""
echo "3. Deploy the application:"
echo "   ./scripts/deploy.sh your-domain.com"
echo ""
echo -e "${YELLOW}Note: Log out and back in for Docker permissions to take effect.${NC}"
