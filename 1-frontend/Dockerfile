# Frontend production build and run
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies
RUN npm ci

# Copy source code and environment files
COPY . .

# Create .env file with build-time environment variables
ARG VITE_API_URL=https://api.lms.amberbisht.me/api
ARG VITE_API_BASE_URL=https://api.lms.amberbisht.me
ARG VITE_BACKEND_URL=https://api.lms.amberbisht.me
ARG VITE_APP_NAME
ARG VITE_APP_VERSION

RUN echo "VITE_API_URL=${VITE_API_URL}" > .env && \
    echo "VITE_API_BASE_URL=${VITE_API_BASE_URL}" >> .env && \
    echo "VITE_BACKEND_URL=${VITE_BACKEND_URL}" >> .env && \
    echo "VITE_APP_NAME=${VITE_APP_NAME}" >> .env && \
    echo "VITE_APP_VERSION=${VITE_APP_VERSION}" >> .env && \
    echo "VITE_ENABLE_ANALYTICS=false" >> .env && \
    echo "VITE_ENABLE_DEBUG_MODE=false" >> .env && \
    echo "VITE_ENABLE_HOT_RELOAD=false" >> .env && \
    echo "VITE_LOG_LEVEL=error" >> .env

# Build the app in production mode
RUN npm run build:prod

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install serve to serve static files
RUN npm install -g serve

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Create uploads and logs directories
RUN mkdir -p uploads logs

# Expose port 5173
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5173 || exit 1

# Start the app using serve (bind to all interfaces)
CMD ["serve", "-s", "dist", "-l", "5173"]
