# LMS Microservices System Architecture

## System Overview
This is a comprehensive Learning Management System built with microservices architecture, featuring video streaming, course management, authentication, and community features.

---

## 📊 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      CLIENT LAYER                                            │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────────────────┐     │
│   │                          React Frontend (Vite + TypeScript)                       │     │
│   │                                  Port: 5173                                       │     │
│   │                                                                                   │     │
│   │  • Auth UI (OAuth: Google, GitHub)      • Course Browse & Learn                 │     │
│   │  • Video Player (HLS.js, YouTube)       • Profile Management                    │     │
│   │  • Admin Dashboard                      • Comments & Reviews                    │     │
│   │  • Course Progress Tracking             • Responsive Design                     │     │
│   └───────────────────────────┬──────────────────────────────────────────────────────┘     │
│                               │                                                              │
└───────────────────────────────┼──────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP/HTTPS + WebSocket
                                │ Credentials: include (cookies)
                                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     API GATEWAY LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────────────────┐     │
│   │                       API Gateway (Express + Proxy)                               │     │
│   │                             Port: 3000                                            │     │
│   │                                                                                   │     │
│   │  • Request Routing            • Health Checks                                    │     │
│   │  • CORS Handling              • Error Handling                                   │     │
│   │  • Rate Limiting              • Request Logging                                  │     │
│   │  • Load Balancing             • Service Discovery                               │     │
│   └───┬─────────┬─────────┬─────────┬─────────┬─────────┬──────────────────────────┘     │
│       │         │         │         │         │         │                                  │
└───────┼─────────┼─────────┼─────────┼─────────┼─────────┼──────────────────────────────────┘
        │         │         │         │         │         │
        ▼         ▼         ▼         ▼         ▼         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  MICROSERVICES LAYER                                         │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐          │
│  │  Auth Service  │  │ Course Service │  │Uploader Service│  │ Media Service  │          │
│  │   Port: 3001   │  │   Port: 3004   │  │   Port: 3005   │  │  Port: 3008    │          │
│  ├────────────────┤  ├────────────────┤  ├────────────────┤  ├────────────────┤          │
│  │ • User Auth    │  │ • Courses      │  │ • File Upload  │  │ • YouTube API  │          │
│  │ • OAuth        │  │ • Lessons      │  │ • Video Queue  │  │ • Dailymotion  │          │
│  │ • Sessions     │  │ • Enrollment   │  │ • FFmpeg       │  │ • Video Search │          │
│  │ • JWT          │  │ • Progress     │  │ • HLS Convert  │  │ • Metadata     │          │
│  │ • Profiles     │  │ • Completion   │  │ • S3 Upload    │  │ • Embeds       │          │
│  │ • Passport.js  │  │ • Categories   │  │ • Thumbnails   │  └────────────────┘          │
│  └────┬───────────┘  └────┬───────────┘  └────┬───────────┘                               │
│       │                   │                    │                                            │
│       │                   │                    │                                            │
│  ┌────┴───────────┐  ┌────┴───────────┐  ┌────┴───────────┐                               │
│  │   Community    │  │  Admin Service │  │                 │                               │
│  │    Service     │  │  Port: 3010    │  │                 │                               │
│  │   Port: 3009   │  ├────────────────┤  │                 │                               │
│  ├────────────────┤  │ • Analytics    │  │                 │                               │
│  │ • Comments     │  │ • User Mgmt    │  │                 │                               │
│  │ • Reviews      │  │ • Moderation   │  │                 │                               │
│  │ • Ratings      │  │ • Redis Cache  │  │                 │                               │
│  │ • Discussions  │  │ • Stats        │  │                 │                               │
│  └────────────────┘  └────────────────┘  └─────────────────┘                               │
│                                                                                              │
└──────────┬────────────────┬────────────────┬────────────────────────────────────────────────┘
           │                │                │
           ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    DATA LAYER                                                │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐       │
│  │                              MongoDB (Port: 27017)                               │       │
│  ├─────────────────────────────────────────────────────────────────────────────────┤       │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │       │
│  │  │  lms-auth    │  │ lms-courses  │  │ lms-uploader │  │  lms-community   │   │       │
│  │  ├──────────────┤  ├──────────────┤  ├──────────────┤  ├──────────────────┤   │       │
│  │  │ • Users      │  │ • Courses    │  │ • Videos     │  │ • Comments       │   │       │
│  │  │ • Profiles   │  │ • Lessons    │  │ • Uploads    │  │ • Reviews        │   │       │
│  │  │ • OAuth      │  │ • Enrollment │  │ • Processing │  │ • Ratings        │   │       │
│  │  │ • Sessions   │  │ • Progress   │  │ • Metadata   │  │ • Discussions    │   │       │
│  │  │ • Login Log  │  │ • Categories │  │ • Status     │  │                  │   │       │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────┘   │       │
│  └─────────────────────────────────────────────────────────────────────────────────┘       │
│                                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐       │
│  │                              Redis (Port: 6379)                                  │       │
│  ├─────────────────────────────────────────────────────────────────────────────────┤       │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │       │
│  │  │   Sessions   │  │ Bull Queues  │  │  Rate Limit  │  │      Cache       │   │       │
│  │  ├──────────────┤  ├──────────────┤  ├──────────────┤  ├──────────────────┤   │       │
│  │  │ • User Auth  │  │ • Video Jobs │  │ • API Limits │  │ • User Data      │   │       │
│  │  │ • OAuth      │  │ • Processing │  │ • IP Track   │  │ • Course Data    │   │       │
│  │  │ • JWT Store  │  │ • Job Status │  │ • Throttle   │  │ • Analytics      │   │       │
│  │  │ • Tokens     │  │ • Retries    │  │              │  │                  │   │       │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────┘   │       │
│  └─────────────────────────────────────────────────────────────────────────────────┘       │
│                                                                                              │
└──────────────────────────────────────────┬───────────────────────────────────────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              VIDEO PROCESSING PIPELINE                                       │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│  ┌────────────┐      ┌──────────────┐      ┌──────────────┐      ┌──────────────┐         │
│  │   Upload   │      │  Bull Queue  │      │    FFmpeg    │      │  HLS Output  │         │
│  │  (Video)   │─────▶│  (Redis)     │─────▶│  Processing  │─────▶│  (Segments)  │         │
│  └────────────┘      └──────────────┘      └──────────────┘      └──────────────┘         │
│       │                     │                      │                      │                 │
│       │                     ▼                      ▼                      ▼                 │
│       │              ┌──────────────┐      ┌──────────────┐      ┌──────────────┐         │
│       │              │  Job Status  │      │   Transcode  │      │  720p.m3u8   │         │
│       │              │  • Pending   │      │   • 720p     │      │  • segments  │         │
│       │              │  • Processing│      │   • 1080p    │      │  1080p.m3u8  │         │
│       │              │  • Completed │      │   • Bitrates │      │  • segments  │         │
│       │              │  • Failed    │      │   • Audio    │      │  thumb.jpg   │         │
│       │              └──────────────┘      └──────────────┘      └──────┬───────┘         │
│       │                                                                  │                   │
│       │                                                                  ▼                   │
│       │              ┌───────────────────────────────────────────────────────────┐         │
│       │              │            S3 / Local Storage Upload                      │         │
│       └─────────────▶│  • Upload HLS files (.m3u8, .ts)                         │         │
│                      │  • Upload thumbnails (.jpg)                               │         │
│                      │  • Generate presigned URLs                                │         │
│                      │  • CDN distribution ready                                 │         │
│                      └───────────────────────────────────────────────────────────┘         │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                EXTERNAL SERVICES LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │   AWS S3 / CDN   │  │   YouTube API    │  │   OAuth Providers│  │   Dailymotion    │   │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤   │
│  │ • Video Storage  │  │ • Video Metadata │  │ • Google OAuth   │  │ • Video API      │   │
│  │ • HLS Segments   │  │ • Search         │  │ • GitHub OAuth   │  │ • Search         │   │
│  │ • Thumbnails     │  │ • Thumbnails     │  │ • User Info      │  │ • Metadata       │   │
│  │ • CDN Delivery   │  │ • Duration       │  │ • Profiles       │  │                  │   │
│  │ • Presigned URLs │  │ • Statistics     │  │                  │  │                  │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘   │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagrams

### 1. **User Authentication Flow**

```
User → Frontend → API Gateway → Auth Service → MongoDB (User DB)
                                      ↓
                                   Passport.js (OAuth)
                                      ↓
                            Google/GitHub OAuth
                                      ↓
                                   JWT Token
                                      ↓
                              Redis (Session Store)
                                      ↓
                              Frontend (Cookie)
```

### 2. **Video Upload & Processing Flow**

```
User → Upload Video → Frontend → API Gateway → Uploader Service
                                                      ↓
                                               MongoDB (Video Doc)
                                                      ↓
                                            Bull Queue (Redis)
                                                      ↓
                                                  FFmpeg Job
                                            ┌─────────┴─────────┐
                                            ▼                   ▼
                                    Convert to 720p      Convert to 1080p
                                    HLS Segments         HLS Segments
                                            │                   │
                                            └────────┬──────────┘
                                                     ▼
                                            Generate Thumbnail
                                                     ▼
                                            Upload to S3 (if enabled)
                                                     ▼
                                         Update MongoDB (Video Status)
                                                     ▼
                                            Frontend (Notification)
```

### 3. **Video Streaming Flow**

```
User → Request Video → Frontend → API Gateway → Course Service
                                                      ↓
                                         Check Enrollment
                                                      ↓
                                             Uploader Service
                                                      ↓
                                         Get HLS URL (S3 or Local)
                                                      ↓
                                         Return .m3u8 Playlist
                                                      ↓
                                 Frontend HLS Player (HLS.js)
                                                      ↓
                          Request Segments (.ts files) from S3/CDN
                                                      ↓
                                      Adaptive Bitrate Streaming
                                     (720p / 1080p auto-switch)
```

### 4. **Course Enrollment & Progress Flow**

```
User → Enroll Course → Frontend → API Gateway → Course Service
                                                      ↓
                                         Check User Auth (JWT)
                                                      ↓
                                         Create Enrollment Doc
                                                      ↓
                                              MongoDB (Courses DB)
                                                      ↓
                                         Initialize Progress (0%)
                                                      ↓
                                              Return to Frontend

User → Complete Lesson → Frontend → API Gateway → Course Service
                                                      ↓
                                         Update Progress
                                                      ↓
                                         Calculate Completion %
                                                      ↓
                                    If 100% → Mark Course Completed
                                                      ↓
                                         Update MongoDB
                                                      ↓
                                         Return Updated Progress
```

### 5. **Comments & Reviews Flow**

```
User → Post Comment → Frontend → API Gateway → Community Service
                                                      ↓
                                         Validate User Auth
                                                      ↓
                                         Check Course Exists
                                                      ↓
                                         Create Comment Doc
                                                      ↓
                                         MongoDB (Community DB)
                                                      ↓
                                         Return Comment
                                                      ↓
                                         Frontend (Real-time Update)
```

---

## 🎯 Key Features & Technologies

### **Frontend Stack**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui + Tailwind CSS
- **Routing**: Wouter
- **State Management**: React Query (TanStack Query)
- **Video Players**: 
  - HLS.js (for adaptive streaming)
  - YouTube Player API
- **Forms**: React Hook Form + Zod validation
- **Authentication**: Cookie-based sessions

### **Backend Stack**
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: MongoDB 7 (Mongoose ODM)
- **Cache/Queue**: Redis 7
- **Queue**: Bull (Redis-based job queue)
- **Authentication**: 
  - Passport.js (Google, GitHub OAuth)
  - JWT for API authentication
  - Express-session with Redis store

### **Video Processing**
- **FFmpeg**: Video transcoding (720p, 1080p)
- **HLS**: HTTP Live Streaming format
- **Segments**: 2-second segments for smooth playback
- **Codecs**: H.264 (video), AAC (audio)
- **Bitrates**: 2Mbps (720p), 4Mbps (1080p)

### **Storage**
- **Local**: File system storage (development)
- **S3**: AWS S3 or S3-compatible (production)
- **CDN**: CloudFront or custom CDN support

### **External APIs**
- **YouTube Data API v3**: Video search, metadata
- **Dailymotion API**: Alternative video platform
- **Google OAuth 2.0**: Social login
- **GitHub OAuth**: Social login

---

## 📦 Service Details

### **1. API Gateway (Port 3000)**
**Responsibilities:**
- Route requests to appropriate microservices
- CORS handling for frontend
- Health check aggregation
- Request/response logging
- Error handling and standardization

**Technologies:**
- Express.js
- http-proxy-middleware
- Axios (for direct service calls)

---

### **2. Auth Service (Port 3001)**
**Responsibilities:**
- User registration and login
- OAuth integration (Google, GitHub)
- Session management (Redis)
- JWT token generation and validation
- Profile management
- Login attempt tracking

**Database Collections:**
- `users` - User accounts
- `profiles` - User profiles (extended info)
- `loginattempts` - Security tracking
- `accountdeletions` - Soft delete records

**Technologies:**
- Passport.js (OAuth)
- bcrypt (password hashing)
- jsonwebtoken (JWT)
- express-session + connect-redis

---

### **3. Course Service (Port 3004)**
**Responsibilities:**
- Course CRUD operations
- Lesson management
- Course enrollment
- Progress tracking
- Course completion
- Category management
- Course search and filtering

**Database Collections:**
- `courses` - Course information
- `lessons` - Lesson content
- `enrollments` - User enrollments

**Key Features:**
- Slug-based course URLs
- Completion percentage calculation
- Lesson order management
- Instructor assignment

---

### **4. Uploader Service (Port 3005)**
**Responsibilities:**
- File upload handling
- Video processing queue management
- FFmpeg video conversion
- HLS format generation (720p, 1080p)
- Thumbnail generation
- S3 upload integration
- Video status tracking

**Database Collections:**
- `videos` - Video metadata and processing status
- `uploads` - Upload history

**Queue Jobs:**
- Video transcoding (Bull queue)
- HLS segment generation
- Thumbnail extraction
- S3 upload

**Technologies:**
- Multer (file upload)
- FFmpeg (fluent-ffmpeg)
- Bull (job queue)
- AWS SDK v3 (S3)

---

### **5. Media Service (Port 3008)**
**Responsibilities:**
- YouTube video integration
- Video search
- Video metadata fetching
- Embed URL generation
- Dailymotion integration

**External APIs:**
- YouTube Data API v3
- Dailymotion API

---

### **6. Community Service (Port 3009)**
**Responsibilities:**
- Comments management
- Course reviews
- Rating system
- Discussion threads

**Database Collections:**
- `comments` - User comments
- `reviews` - Course reviews

---

### **7. Admin Service (Port 3010)**
**Responsibilities:**
- User management
- Content moderation
- Analytics and statistics
- System monitoring
- Cache management (Redis)

**Technologies:**
- Redis for caching
- Analytics data aggregation

---

## 🔐 Security Features

1. **Authentication & Authorization**
   - JWT-based authentication
   - Session management with Redis
   - OAuth 2.0 (Google, GitHub)
   - Role-based access control (Admin, User)

2. **Data Protection**
   - Password hashing (bcrypt)
   - CORS configuration
   - HTTP-only cookies
   - Secure session cookies (production)

3. **Rate Limiting**
   - Redis-based rate limiting
   - IP tracking
   - API throttling

4. **Input Validation**
   - Request validation
   - File type validation
   - File size limits
   - Zod schema validation (frontend)

---

## 🚀 Deployment Architecture

### **Docker Compose Services**
```yaml
Services:
  - mongodb (27017)
  - redis (6379)
  - auth-service (3001)
  - course-service (3004)
  - uploader-service (3005)
  - media-service (3008)
  - community-service (3009)
  - admin-service (3010)
  - api-gateway (3000)
  - frontend (5173 - dev / nginx - prod)

Networks:
  - lms-network (bridge)

Volumes:
  - mongodb_data
  - redis_data
  - uploads_data
```

### **Production Considerations**
1. **Scaling**: Each service can be scaled independently
2. **Load Balancing**: API Gateway can distribute load
3. **CDN**: S3 + CloudFront for video delivery
4. **Monitoring**: Health checks for all services
5. **Logging**: Centralized logging (Winston)
6. **Backups**: MongoDB and Redis backups
7. **SSL/TLS**: HTTPS in production

---

## 📊 Database Schema Overview

### **Auth Database (lms-auth)**
```
Users:
  - _id, email, username, password (hashed)
  - oauthProvider, oauthId
  - role (user/admin)
  - isActive, isBanned

Profiles:
  - userId, firstName, lastName
  - bio, avatar, phoneNumber
  - country, dateOfBirth
  - socialLinks

LoginAttempts:
  - userId, email, ip
  - success, timestamp
```

### **Course Database (lms-courses)**
```
Courses:
  - _id, title, slug, description
  - instructor, category, level
  - thumbnail, price
  - enrollmentCount, rating
  - lessons[] (references)
  - isPublished

Lessons:
  - _id, courseId, title, order
  - videoUrl, videoType (youtube/hls)
  - duration, description
  - isPublished

Enrollments:
  - _id, userId, courseId
  - enrolledAt, completedAt
  - progress, completedLessons[]
```

### **Uploader Database (lms-uploader)**
```
Videos:
  - _id, userId, filename
  - originalFilename, mimeType
  - size, duration
  - status (pending/processing/completed/failed)
  - hls720Url, hls1080Url
  - s3Key, thumbnail
  - processingError
```

### **Community Database (lms-community)**
```
Comments:
  - _id, courseId, userId
  - content, createdAt
  - likes, replies[]

Reviews:
  - _id, courseId, userId
  - rating (1-5), comment
  - createdAt
```

---

## 🎬 Video Processing Pipeline Details

### **Step-by-Step Flow**

1. **Upload**
   - User uploads MP4 video
   - Multer receives file
   - Validation (file type, size)
   - Save to local storage or S3

2. **Queue Job**
   - Create Bull job in Redis
   - Job data: videoId, path, userId
   - Status: pending

3. **FFmpeg Processing**
   - Extract video metadata (duration)
   - Generate thumbnail (first second)
   - Transcode to 720p HLS
     - Codec: H.264
     - Audio: AAC stereo 128k
     - Segments: 2 seconds
     - Output: .m3u8 + .ts files
   - Transcode to 1080p HLS
     - Same settings, higher bitrate

4. **Upload to S3** (if enabled)
   - Upload .m3u8 playlist files
   - Upload all .ts segment files
   - Upload thumbnail
   - Generate public URLs or presigned URLs

5. **Update Database**
   - Status: completed
   - Store URLs (local or S3)
   - Store duration
   - Store thumbnail URL

6. **Error Handling**
   - Job retries (3 attempts)
   - Status: failed
   - Store error message
   - Notify user

---

## 🎯 HLS Streaming Details

### **Adaptive Bitrate Streaming**
```
Frontend (HLS.js):
  ↓
Request master.m3u8 → Lists available qualities
  ↓
Select quality based on:
  - Network speed
  - Buffer status
  - Device capability
  ↓
Request 720p.m3u8 or 1080p.m3u8
  ↓
Playlist contains:
  - Segment URLs (segment_000.ts, segment_001.ts, ...)
  - Segment duration (2s)
  - Total segments
  ↓
Download segments sequentially:
  - Buffer ahead (3-5 segments)
  - Play while downloading
  - Switch quality if needed
```

### **HLS Segment Structure**
```
/uploads/videos/{userId}/
  ├── {filename}-720p.m3u8       # 720p playlist
  ├── {filename}-720p_000.ts     # Segment 0
  ├── {filename}-720p_001.ts     # Segment 1
  ├── ...
  ├── {filename}-1080p.m3u8      # 1080p playlist
  ├── {filename}-1080p_000.ts    # Segment 0
  ├── {filename}-1080p_001.ts    # Segment 1
  ├── ...
  └── thumb-{filename}.jpg       # Thumbnail
```

---

## 🔄 Cron Jobs & Scheduled Tasks

Currently implemented through Bull Queue:
- Video processing jobs
- Failed job cleanup
- Stale session cleanup (Redis TTL)

Potential additions:
- Daily analytics aggregation
- Course recommendation updates
- User engagement emails
- Database backups
- Log rotation

---

## 📈 Performance Optimizations

1. **Caching Strategy**
   - Redis for session data
   - Redis for rate limiting
   - Redis for analytics
   - Query result caching

2. **Video Delivery**
   - HLS adaptive streaming
   - CDN distribution
   - Segment caching
   - Progressive download

3. **Database**
   - Indexed queries (slug, userId)
   - Pagination for large datasets
   - Aggregation pipelines

4. **API Gateway**
   - Request deduplication
   - Response compression
   - Connection pooling

---

## 🛠️ Development vs Production

### **Development**
- Local file storage
- MongoDB local instance
- Redis local instance
- No SSL
- Debug logging
- Frontend dev server (Vite)

### **Production**
- S3 storage with CDN
- MongoDB Atlas or managed instance
- Redis Cloud or managed instance
- SSL/TLS (HTTPS)
- Production logging
- Frontend static build (Nginx)
- Environment-based configs
- Health monitoring
- Auto-scaling
- Backup strategies

---

## 📊 Monitoring & Observability

### **Health Checks**
Each service exposes `/health` endpoint:
```javascript
{
  status: "healthy" | "unhealthy" | "degraded",
  service: "service-name",
  dependencies: {...}
}
```

### **Logging**
- Winston logger in all services
- Structured JSON logs
- Log levels: error, warn, info, debug
- Centralized log aggregation (future)

### **Metrics** (Future Implementation)
- Request rate (per service)
- Response time (p50, p95, p99)
- Error rate
- Video processing time
- Queue length
- Active sessions

---

## 🎯 API Endpoints Overview

### **Auth Service** (`/api/auth`)
```
POST   /register                  - User registration
POST   /login                     - User login
POST   /logout                    - User logout
GET    /me                        - Current user
GET    /oauth/google              - Google OAuth
GET    /oauth/github              - GitHub OAuth
GET    /profile/:userId           - User profile
PUT    /profile/:userId           - Update profile
```

### **Course Service** (`/api/courses`)
```
GET    /                          - List courses
POST   /create                    - Create course
GET    /slug/:slug                - Course by slug
GET    /:id                       - Course by ID
PUT    /:id                       - Update course
DELETE /:id                       - Delete course
POST   /:id/enroll                - Enroll in course
GET    /:id/enrollment            - Get enrollment
POST   /:id/lessons/:lid/complete - Mark lesson complete
GET    /:id/completion            - Course completion
```

### **Uploader Service** (`/api/upload`, `/api/videos`)
```
POST   /upload                    - Upload file
POST   /upload/video              - Upload video
GET    /videos                    - List videos
GET    /videos/:id                - Video details
GET    /videos/:id/status         - Processing status
DELETE /videos/:id                - Delete video
```

### **Media Service** (`/api/media`)
```
GET    /youtube/:videoId          - YouTube video info
GET    /youtube/search            - Search YouTube
GET    /dailymotion/:videoId      - Dailymotion video
GET    /embed/:platform/:videoId  - Embed URL
```

### **Community Service** (`/api/comments`, `/api/reviews`)
```
GET    /comments/:courseId        - Course comments
POST   /comments                  - Create comment
DELETE /comments/:id              - Delete comment
GET    /reviews/:courseId         - Course reviews
POST   /reviews                   - Create review
```

### **Admin Service** (`/api/admin`)
```
GET    /users                     - List users
PUT    /users/:id/ban             - Ban user
GET    /analytics                 - System analytics
GET    /cache/flush               - Flush cache
```

---

## 🔮 Future Enhancements

1. **Real-time Features**
   - WebSocket for live updates
   - Real-time notifications
   - Live streaming support

2. **Advanced Video**
   - Multiple quality options (360p, 480p, 4K)
   - Subtitle support
   - Video analytics (watch time)

3. **AI/ML Features**
   - Course recommendations
   - Content moderation
   - Automatic video chapters

4. **Payment Integration**
   - Stripe/PayPal
   - Course pricing
   - Subscription model

5. **Enhanced Community**
   - Discussion forums
   - Live Q&A sessions
   - Student messaging

6. **Mobile Apps**
   - React Native apps
   - Offline video download
   - Push notifications

---

## 📝 Environment Variables

### **Common**
```
NODE_ENV=development|production
PORT=<service-port>
```

### **Auth Service**
```
MONGODB_URI=mongodb://localhost:27017/lms-auth
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret
SESSION_SECRET=your-session-secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

### **Uploader Service**
```
USE_S3=true|false
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=...
S3_ENDPOINT=...  # for S3-compatible services
```

### **Media Service**
```
YOUTUBE_API_KEY=...
DAILYMOTION_API_KEY=...
```

---

## 🎓 Conclusion

This LMS is a production-ready, scalable microservices architecture with:
- ✅ Robust authentication (OAuth, JWT, sessions)
- ✅ Video processing pipeline (FFmpeg, HLS, S3)
- ✅ Adaptive video streaming (720p, 1080p)
- ✅ Course management with progress tracking
- ✅ Community features (comments, reviews)
- ✅ Admin dashboard for management
- ✅ External service integrations (YouTube, OAuth)
- ✅ Containerized deployment (Docker)
- ✅ Health monitoring and logging
- ✅ Scalable architecture

The system is designed for horizontal scaling, with each service independently deployable and maintainable.

---

**Generated:** 2025-11-1
**Version:** 1.0.0
**Author:** Amber Bisht

