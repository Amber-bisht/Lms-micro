#!/bin/bash

echo "🔍 Checking all LMS microservices health..."
echo ""

services=(
  "3000:API Gateway"
  "3001:Auth Service"
  "3004:Course Service"
  "3005:Uploader Service"
  "3006:Content Service"
  "3008:Media Service"
  "3009:Community Service"
  "3010:Admin Service"
)

healthy_count=0
unhealthy_count=0

for service in "${services[@]}"; do
  IFS=":" read -r port name <<< "$service"
  response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/health 2>/dev/null)
  
  if [ "$response" -eq 200 ]; then
    echo "✅ $name (Port $port): Healthy"
    ((healthy_count++))
  else
    echo "❌ $name (Port $port): Unhealthy (HTTP $response)"
    ((unhealthy_count++))
  fi
done

echo ""
echo "📊 Summary:"
echo "  ✅ Healthy: $healthy_count"
echo "  ❌ Unhealthy: $unhealthy_count"
echo "  📈 Total: $((healthy_count + unhealthy_count))"
echo ""

if [ $unhealthy_count -eq 0 ]; then
  echo "🎉 All services are healthy!"
  exit 0
else
  echo "⚠️  Some services need attention!"
  exit 1
fi

