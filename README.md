# 🚀 LMS Microservices Platform

A complete Learning Management System built with microservices architecture.

## 📁 Project Structure

```
microservices/
├── frontend/                    # React Frontend Application
├── auth-service/               # Authentication & User Management (Port: 3001)
├── course-service/             # Courses & Lessons (Port: 3004)
├── uploader-service/           # File Upload Management (Port: 3005)
├── media-service/              # YouTube & Dailymotion API (Port: 3008)
├── community-service/          # Comments & Reviews (Port: 3009)
├── admin-service/              # Admin Dashboard (Port: 3010)
├── api-gateway/                # API Gateway (Port: 3000)
└── docker-compose.yml          # Docker orchestration
```

## 🛠️ Quick Start

### Option 1: Using NPM Workspaces (Recommended)

```bash
# 1. Navigate to microservices folder
cd microservices

# 2. Install ALL dependencies (all services + frontend)
npm install

# 3. Set up environment files
.\setup-env.ps1     # Windows
./setup-env.sh      # Linux/Mac

# 4. Run with Docker Compose
npm run docker:up
```

### Option 2: Using Docker Only

```bash
# 1. Navigate to microservices folder
cd microservices

# 2. Copy environment file
cp env.example .env

# 3. Start all services
docker-compose up -d

# 4. View logs
docker-compose logs -f
```

## 📦 Installation Commands

### Install Everything at Once
```bash
npm install                 # Installs all workspaces (all services + frontend)
```

### Install Specific Parts
```bash
npm run install:services    # Install only microservices
npm run install:frontend    # Install only frontend
```

## 🚀 Running Services

### Run All Services (Docker)
```bash
npm run docker:up           # Start all services
npm run docker:down         # Stop all services
npm run docker:logs         # View logs
npm run docker:restart      # Restart services
npm run docker:build        # Rebuild containers
```

### Run Individual Services (Development)
```bash
npm run dev:auth            # Auth Service
npm run dev:course          # Course Service
npm run dev:uploader        # Uploader Service
npm run dev:media           # Media Service
npm run dev:community       # Community Service
npm run dev:admin           # Admin Service
npm run dev:gateway         # API Gateway
npm run dev:frontend        # Frontend Application
```

## 🏗️ Build Commands

```bash
npm run build:all           # Build all services + frontend
npm run build:services      # Build only microservices
npm run build:frontend      # Build only frontend
```

## 🔧 Environment Setup

### Automated Setup (Recommended)
```bash
# Windows
.\setup-env.ps1

# Linux/Mac
chmod +x setup-env.sh
./setup-env.sh
```

### Manual Setup
Create `.env` files from `env.example` in:
- Root: `microservices/.env` (for Docker Compose)
- Each service: `<service-name>/.env` (for local development)

## 📊 Service Ports

| Service | Port | Description |
|---------|------|-------------|
| **API Gateway** | 3000 | Main entry point for all requests |
| **Auth Service** | 3001 | Authentication & user management |
| **Course Service** | 3004 | Courses, lessons, enrollments |
| **Uploader Service** | 3005 | File upload management |
| **Media Service** | 3008 | YouTube & Dailymotion |
| **Community Service** | 3009 | Comments & reviews |
| **Admin Service** | 3010 | Admin dashboard |
| **Frontend** | 5173 | React application |

## 🗄️ Database & Cache

- **MongoDB**: Port 27017 (Shared by all services)
- **Redis**: Port 6379 (For caching & sessions)

## 🔑 Environment Variables

Key variables you need to set in `.env`:

```env
# Database
MONGODB_URI=mongodb+srv://...your-connection-string

# Secrets
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# External APIs
YOUTUBE_API_KEY=your-youtube-api-key
```

See `env.example` for complete list.

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Restart a service
docker-compose restart [service-name]

# Rebuild services
docker-compose build

# Remove volumes (clean database)
docker-compose down -v
```

## 📝 Development Workflow

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   .\setup-env.ps1  # Windows
   ```

3. **Run with Docker** (Recommended for full stack)
   ```bash
   npm run docker:up
   ```

   OR **Run individually** (for service development)
   ```bash
   npm run dev:auth        # Terminal 1
   npm run dev:frontend    # Terminal 2
   ```

4. **Access applications**
   - Frontend: http://localhost:5173
   - API Gateway: http://localhost:3000
   - Individual services: http://localhost:300X

## 🧪 Testing

```bash
# Run tests for all services
npm test

# Run tests for specific service
cd auth-service && npm test
```

## 📚 API Documentation

- Postman Collection: `postman_collection.json`
- Monitoring Dashboard: `monitoring-dashboard.html`

## 🔍 Troubleshooting

### Services can't connect
- Ensure all environment variables are set
- Check if MongoDB and Redis are running
- Verify service URLs in `.env`

### npm install fails
```bash
# Clean and reinstall
npm run clean
npm install
```

### Docker issues
```bash
# Clean Docker cache
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

## 🏆 Architecture Highlights

- ✅ **7 Microservices** - Fully decoupled and scalable
- ✅ **API Gateway** - Single entry point with routing
- ✅ **MongoDB** - Separate databases per service
- ✅ **Redis** - Shared cache and session storage
- ✅ **Docker** - Containerized deployment
- ✅ **TypeScript** - Type-safe codebase
- ✅ **React** - Modern frontend with Vite

## 📄 License

MIT License - See LICENSE file for details

## 👥 Contributors

- Amber Bisht - Lead Developer

---

**Happy Coding! 🚀**

For detailed environment setup, see [README-ENV-SETUP.md](./README-ENV-SETUP.md)