# Embed Player Service API Documentation

## Overview

The Embed Player Service provides secure video session management for the LMS. It creates tokenized video sessions that allow users to access YouTube videos through secure tokens.

## API Endpoints

### 1. Create Video Session
**POST** `/api/embed/session`

Creates a new video session with a secure token.

**Request Body:**
```json
{
  "videoId": "dQw4w9WgXcQ",
  "courseId": "course123",
  "userId": "user456"
}
```

**Response:**
```json
{
  "success": true,
  "token": "a1b2c3d4e5f6...",
  "embedUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&fs=1",
  "expiresAt": "2024-01-02T12:00:00.000Z",
  "sessionId": "session789"
}
```

### 2. Get Video Session
**GET** `/api/embed/session/:token`

Retrieves video session information by token.

**Response:**
```json
{
  "success": true,
  "videoId": "dQw4w9WgXcQ",
  "courseId": "course123",
  "userId": "user456",
  "embedUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&fs=1",
  "expiresAt": "2024-01-02T12:00:00.000Z",
  "isActive": true
}
```

### 3. Get Embed Player HTML
**GET** `/api/embed/player/:token`

Returns HTML page with embedded video player.

**Query Parameters:**
- `autoplay` (boolean): Auto-play video
- `controls` (boolean): Show video controls
- `start` (number): Start time in seconds
- `end` (number): End time in seconds
- `loop` (boolean): Loop video
- `mute` (boolean): Mute video

**Example:**
```
GET /api/embed/player/abc123?autoplay=true&controls=true&start=30
```

**Response:** HTML page with embedded YouTube player

### 4. Get Video Information
**GET** `/api/embed/info/:token`

Returns detailed video information.

**Response:**
```json
{
  "success": true,
  "videoId": "dQw4w9WgXcQ",
  "courseId": "course123",
  "embedUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&fs=1",
  "thumbnail": "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
  "expiresAt": "2024-01-02T12:00:00.000Z",
  "title": "Rick Astley - Never Gonna Give You Up",
  "description": "The official video for \"Never Gonna Give You Up\" by Rick Astley",
  "duration": "3:33",
  "channel": "Rick Astley"
}
```

### 5. Deactivate Video Session
**PUT** `/api/embed/session/:token/deactivate`

Deactivates a video session.

**Request Body:**
```json
{
  "userId": "user456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Video session deactivated successfully"
}
```

### 6. Get User's Video Sessions
**GET** `/api/embed/user/:userId/sessions`

Returns all active video sessions for a user.

**Response:**
```json
{
  "success": true,
  "sessions": [
    {
      "sessionId": "session789",
      "videoId": "dQw4w9WgXcQ",
      "courseId": "course123",
      "token": "a1b2c3d4e5f6...",
      "embedUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&fs=1",
      "expiresAt": "2024-01-02T12:00:00.000Z",
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

### 7. Health Check
**GET** `/api/embed/health`

Returns service health status.

**Response:**
```json
{
  "status": "healthy",
  "service": "embed-player-service",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Usage Flow

### 1. Frontend Request Video Access
```javascript
// Frontend requests video session
const response = await fetch('/api/embed/session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer user-token'
  },
  body: JSON.stringify({
    videoId: 'dQw4w9WgXcQ',
    courseId: 'course123',
    userId: 'user456'
  })
});

const { token, embedUrl } = await response.json();
```

### 2. Display Video Player
```javascript
// Option 1: Use embed URL directly
const iframe = document.createElement('iframe');
iframe.src = embedUrl;
iframe.width = '100%';
iframe.height = '400';
document.getElementById('player').appendChild(iframe);

// Option 2: Use token-based player endpoint
const playerUrl = `/api/embed/player/${token}?autoplay=true&controls=true`;
window.open(playerUrl, '_blank');
```

### 3. Get Video Information
```javascript
// Get video details
const infoResponse = await fetch(`/api/embed/info/${token}`);
const videoInfo = await infoResponse.json();
console.log(videoInfo.title, videoInfo.thumbnail);
```

## Security Features

- **Token-based Access**: Each video session has a unique, secure token
- **Expiration**: Sessions expire after 24 hours
- **User Validation**: Sessions are tied to specific users
- **Course Validation**: Sessions are tied to specific courses
- **Automatic Cleanup**: Expired sessions are automatically removed

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "message": "videoId, courseId, and userId are required"
}
```

**404 Not Found:**
```json
{
  "message": "Video session not found or expired"
}
```

**500 Internal Server Error:**
```json
{
  "message": "Error creating video session"
}
```

## Environment Variables

```bash
PORT=3006
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/lms-embed-player
CORS_ORIGIN=*
LOG_LEVEL=info
```

## Database Schema

### VideoSession Collection
```javascript
{
  _id: ObjectId,
  videoId: String,        // YouTube video ID
  courseId: String,       // Course identifier
  userId: String,         // User identifier
  token: String,          // Unique session token
  embedUrl: String,       // Generated embed URL
  expiresAt: Date,        // Session expiration
  isActive: Boolean,      // Session status
  createdAt: Date,        // Creation timestamp
  updatedAt: Date         // Last update timestamp
}
```

## Integration with Frontend

The embed player service integrates with the frontend through the API Gateway:

1. **Course Service** creates video sessions when users access course videos
2. **Frontend** receives tokens and uses them to display videos
3. **Embed Player Service** validates tokens and serves video content
4. **Sessions** automatically expire for security

This architecture provides secure, tokenized access to video content while maintaining user and course context.
