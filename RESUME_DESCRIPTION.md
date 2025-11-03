**Learning Management System (LMS).** Live Demo — GitHub

• Developed a full-featured LMS using React, TypeScript, Express.js, MongoDB, Redis, Docker, OAuth, S3, FFmpeg.

• Built a scalable microservices architecture with 8 independent services (Auth, Course, Uploader, Media, Community, Admin, API Gateway) for optimal performance and maintainability.

• Integrated HLS adaptive video streaming with YouTube/Dailymotion APIs and AWS S3 storage, implementing FFmpeg transcoding to 720p/1080p for seamless playback across devices.

• Implemented OAuth 2.0 authentication (Google, GitHub) with JWT tokens, Passport.js, Redis-backed sessions, and role-based access control for secure user management.

• Automated video processing pipeline with Bull Queue and Redis, enabling asynchronous FFmpeg transcoding, thumbnail generation, and S3 uploads with 3-retry fallback.

• Designed Docker Compose orchestration with MongoDB, Redis, and 8 containerized services, ensuring consistent deployments and simplified CI/CD integration.

• Created a modern React frontend with Vite, TanStack Query, shadcn/ui, HLS.js video player, React Hook Form validation, and responsive design for cross-platform compatibility.

• Built RESTful APIs with Express.js and an API Gateway for request routing, rate limiting, CORS handling, and centralized logging with Winston across all services.

• Developed course management features including enrollment tracking, progress monitoring, completion certificates, category filtering, and instructor assignments with MongoDB aggregation pipelines.

• Implemented community features with comment threads, course reviews, 5-star ratings, and real-time updates integrated with the course service for seamless user engagement.

• Added comprehensive error handling, input validation with Zod, file type/size restrictions, Redis caching for performance optimization, and health check endpoints for production monitoring.

