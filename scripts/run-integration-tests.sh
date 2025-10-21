#!/bin/bash

echo "🧪 Running LMS Integration Tests..."
echo ""

# Check if services are running
echo "1️⃣  Checking services health..."
./scripts/check-health.sh
if [ $? -ne 0 ]; then
  echo "❌ Some services are not healthy. Please start all services first."
  echo "Run: docker-compose up -d"
  exit 1
fi

echo ""
echo "2️⃣  Running integration tests..."
echo ""

# Navigate to tests directory
cd tests/integration 2>/dev/null || mkdir -p tests/integration

# Run tests with Jest
npm run test:integration

echo ""
if [ $? -eq 0 ]; then
  echo "✅ All integration tests passed!"
  exit 0
else
  echo "❌ Some tests failed!"
  exit 1
fi

