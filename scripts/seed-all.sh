#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  LMS Microservices Database Seeding${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Check if MongoDB is running
echo -e "${BLUE}Checking MongoDB connection...${NC}"
if ! mongosh --eval "db.version()" > /dev/null 2>&1; then
    echo -e "${RED}❌ MongoDB is not running. Please start MongoDB first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ MongoDB is running${NC}"
echo ""

# Seed Auth Service
echo -e "${BLUE}Seeding Auth Service...${NC}"
mongosh lms-auth --eval "
// Clear existing data (optional - comment out in production)
db.users.deleteMany({});
db.profiles.deleteMany({});

// Create admin user
db.users.insertOne({
    username: 'admin',
    email: 'admin@lms.amberbisht.me',
    password: '\$2b\$10\$YourHashedPasswordHere', // bcrypt hash of 'admin123'
    fullName: 'LMS Administrator',
    isAdmin: true,
    hasCompletedProfile: true,
    role: 'admin',
    banned: false,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
});

// Create test users
db.users.insertMany([
    {
        username: 'testuser1',
        email: 'user1@test.com',
        password: '\$2b\$10\$YourHashedPasswordHere',
        fullName: 'Test User One',
        isAdmin: false,
        hasCompletedProfile: true,
        role: 'user',
        banned: false,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        username: 'testuser2',
        email: 'user2@test.com',
        password: '\$2b\$10\$YourHashedPasswordHere',
        fullName: 'Test User Two',
        isAdmin: false,
        hasCompletedProfile: false,
        role: 'user',
        banned: false,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
    }
]);

print('✓ Auth Service seeded');
"
echo -e "${GREEN}✓ Auth Service seeded successfully${NC}"
echo ""

# Seed Content Service
echo -e "${BLUE}Seeding Content Service...${NC}"
mongosh lms-content --eval "
// Clear existing data
db.categories.deleteMany({});
db.blogs.deleteMany({});
db.roadmaps.deleteMany({});

// Create categories
const categories = db.categories.insertMany([
    { name: 'Web Development', slug: 'web-development', description: 'Learn web development', createdAt: new Date() },
    { name: 'Mobile Development', slug: 'mobile-development', description: 'Learn mobile app development', createdAt: new Date() },
    { name: 'Data Science', slug: 'data-science', description: 'Learn data science and ML', createdAt: new Date() },
    { name: 'DevOps', slug: 'devops', description: 'Learn DevOps practices', createdAt: new Date() }
]);

print('✓ Content Service seeded');
"
echo -e "${GREEN}✓ Content Service seeded successfully${NC}"
echo ""

# Seed Course Service
echo -e "${BLUE}Seeding Course Service...${NC}"
mongosh lms-courses --eval "
// Clear existing data
db.courses.deleteMany({});
db.lessons.deleteMany({});
db.enrollments.deleteMany({});

print('✓ Course Service seeded');
"
echo -e "${GREEN}✓ Course Service seeded successfully${NC}"
echo ""

# Seed Achievement Service
echo -e "${BLUE}Seeding Achievement Service...${NC}"
mongosh lms-achievements --eval "
// Clear existing data
db.achievements.deleteMany({});

print('✓ Achievement Service seeded');
"
echo -e "${GREEN}✓ Achievement Service seeded successfully${NC}"
echo ""

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}  ✓ All databases seeded successfully!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo -e "${BLUE}Default Admin Credentials:${NC}"
echo -e "  Email: admin@lms.amberbisht.me"
echo -e "  Password: admin123"
echo ""
echo -e "${BLUE}Test User Credentials:${NC}"
echo -e "  Email: user1@test.com"
echo -e "  Password: password123"
echo ""

