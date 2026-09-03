#!/usr/bin/env bash
# ==============================================================================
# Single-command Deployment script using Docker Compose
# Binds directly to Port 80 without Nginx
# ==============================================================================
set -e

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "Creating .env from .env.example..."
        cp .env.example .env
        echo "WARNING: Please update .env with your actual production secrets."
    fi
fi

echo "Building and starting containers in detached mode..."
docker compose down || true
docker compose build --pull
docker compose up -d

echo ""
echo "================================================================="
echo " Juna Website is deployed successfully!"
echo " Check status with:  docker compose ps"
echo " View live logs with: docker compose logs -f"
echo "================================================================="
