#!/bin/bash

# Deployment script for LMS Frontend
# Updated for server with 8GB RAM

echo "🚀 Starting LMS Frontend Deployment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Stop and remove existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Remove old images to free up space
echo "🧹 Cleaning up old images..."
docker image prune -f

# Build and start the new containers
echo "🔨 Building and starting containers..."
docker-compose up --build -d

# Wait for the frontend to be ready
echo "⏳ Waiting for frontend to be ready..."
sleep 30

# Check if the frontend is running
if curl -f http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Frontend is running successfully!"
    echo "🌐 Frontend URL: http://localhost:5173"
    echo "📱 Frontend is ready for production use"
else
    echo "❌ Frontend failed to start. Check logs with: docker-compose logs frontend"
    exit 1
fi

echo "🎉 Frontend deployment completed successfully!"
echo ""
echo "📋 Useful commands:"
echo "  View logs: docker-compose logs -f frontend"
echo "  Stop services: docker-compose down"
echo "  Restart services: docker-compose restart"
echo "  Check status: docker-compose ps"
