#!/bin/bash
export DOCKER_HOST=unix:///var/run/docker.sock
echo "Building backend image..."
docker compose build backend
echo "Starting services..."
docker compose up -d
echo "Waiting for services to be ready..."
sleep 10
docker compose ps
echo "Backend logs:"
docker compose logs backend --tail=50