# LMS Microservices Health Check Script
# Usage: .\check-health.ps1

Write-Host "🔍 Checking all LMS microservices health..." -ForegroundColor Cyan
Write-Host ""

$services = @(
    @{Port=3000; Name="API Gateway"},
    @{Port=3001; Name="Auth Service"},
    @{Port=3004; Name="Course Service"},
    @{Port=3005; Name="Uploader Service"},
    @{Port=3006; Name="Content Service"},
    @{Port=3008; Name="Media Service"},
    @{Port=3009; Name="Community Service"},
    @{Port=3010; Name="Admin Service"},
)

$healthyCount = 0
$unhealthyCount = 0

foreach ($service in $services) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $($service.Name) (Port $($service.Port)): Healthy" -ForegroundColor Green
            $healthyCount++
        }
        else {
            Write-Host "❌ $($service.Name) (Port $($service.Port)): Unhealthy (HTTP $($response.StatusCode))" -ForegroundColor Red
            $unhealthyCount++
        }
    }
    catch {
        Write-Host "❌ $($service.Name) (Port $($service.Port)): Unhealthy (Connection Failed)" -ForegroundColor Red
        $unhealthyCount++
    }
}

Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "  ✅ Healthy: $healthyCount" -ForegroundColor Green
Write-Host "  ❌ Unhealthy: $unhealthyCount" -ForegroundColor Red
Write-Host "  📈 Total: $($healthyCount + $unhealthyCount)" -ForegroundColor Cyan
Write-Host ""

if ($unhealthyCount -eq 0) {
    Write-Host "🎉 All services are healthy!" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "⚠️  Some services need attention!" -ForegroundColor Yellow
    exit 1
}

