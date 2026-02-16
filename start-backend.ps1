# Backend Server Startup Script
Write-Host "Starting Backend Server..." -ForegroundColor Green
Write-Host "Make sure .env file is configured with your PostgreSQL password!" -ForegroundColor Yellow
Write-Host ""

go run cmd/server/main.go
