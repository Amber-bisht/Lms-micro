# AWS S3 Setup for Uploader Service

This document explains how to configure the uploader service to use AWS S3 for file storage.

## Environment Variables

Add the following environment variables to your `.env` file or Docker Compose configuration:

```bash
# Enable S3 storage
USE_S3=true

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
S3_BUCKET_NAME=your-bucket-name
S3_BUCKET_REGION=us-east-1

# Optional: For S3-compatible services (like MinIO)
# S3_ENDPOINT=http://localhost:9000
```

## AWS S3 Setup

### 1. Create an S3 Bucket

1. Go to AWS S3 Console
2. Create a new bucket with a unique name
3. Configure bucket permissions as needed

### 2. Create IAM User

1. Go to AWS IAM Console
2. Create a new user with programmatic access
3. Attach the following policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
```

### 3. Configure CORS (Optional)

If you need to upload files directly from the browser, configure CORS on your S3 bucket:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

## S3-Compatible Services (MinIO)

For local development or S3-compatible services like MinIO:

```bash
USE_S3=true
S3_ENDPOINT=http://localhost:9000
S3_BUCKET_NAME=uploads
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_REGION=us-east-1
```

## API Endpoints

### Upload File
```
POST /api/upload/single
Content-Type: multipart/form-data
```

### Generate Presigned Upload URL
```
POST /api/upload/s3/presigned-upload
Content-Type: application/json
{
  "filename": "example.jpg",
  "mimetype": "image/jpeg"
}
```

### Generate Presigned Download URL
```
GET /api/upload/s3/presigned-download/:fileId
```

### Get S3 Configuration
```
GET /api/upload/s3/config
```

## Features

- **Automatic Fallback**: If S3 upload fails, falls back to local storage
- **Thumbnail Generation**: Automatically generates thumbnails for images
- **Presigned URLs**: Support for direct browser uploads
- **File Management**: Upload, download, and delete files
- **Access Control**: Public/private file access
- **Multiple Storage**: Support for both local and S3 storage

## File Structure in S3

Files are organized in S3 with the following structure:
```
bucket-name/
├── uploads/
│   ├── user-id-1/
│   │   ├── timestamp-randomstring.jpg
│   │   └── thumb-timestamp-randomstring.jpg
│   └── user-id-2/
│       └── timestamp-randomstring.pdf
```

## Migration from Local to S3

To migrate existing files from local storage to S3:

1. Set `USE_S3=true`
2. Restart the service
3. New uploads will go to S3
4. Existing files remain in local storage until manually migrated
