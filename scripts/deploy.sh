#!/bin/bash
# Rebuilding Iran - Deployment Script
# Usage: ./scripts/deploy.sh [domain]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Rebuilding Iran - Production Deploy  ${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please copy .env.example to .env and fill in the values."
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Set domain from argument or environment
DOMAIN=${1:-${DOMAIN:-localhost}}
export DOMAIN

echo -e "${YELLOW}Deploying to domain: ${DOMAIN}${NC}"

# Pull latest code (if using git)
if [ -d .git ]; then
    echo -e "${YELLOW}Pulling latest changes...${NC}"
    git pull origin main || true
fi

# Build and start containers
echo -e "${YELLOW}Building Docker images...${NC}"
docker compose build --no-cache

echo -e "${YELLOW}Starting containers...${NC}"
docker compose up -d

# Wait for health check
echo -e "${YELLOW}Waiting for application to be ready...${NC}"
sleep 10

# Check if app is running
if docker compose ps | grep -q "running"; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Deployment successful!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "Application is running at: ${GREEN}https://${DOMAIN}${NC}"
    echo ""
    echo "Useful commands:"
    echo "  View logs:      docker compose logs -f"
    echo "  Restart app:    docker compose restart"
    echo "  Stop app:       docker compose down"
    echo "  Update app:     ./scripts/deploy.sh"
else
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}  Deployment failed!${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo "Check logs with: docker compose logs"
    exit 1
fi
