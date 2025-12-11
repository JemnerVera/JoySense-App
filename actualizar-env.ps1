# Script para actualizar archivos .env
# Ejecutar desde PowerShell: .\actualizar-env.ps1

Write-Host "🔄 Actualizando archivos .env..." -ForegroundColor Cyan

# Backend .env
$backendEnv = @"
SUPABASE_URL=https://fagswxnjkcavchfrnrhs.supabase.co
SUPABASE_ANON_KEY=sb_publishable_OTw0aSfLWFXIyQkYc-jRzg_KkeFvn3X
ADMIN_EMAIL=admin@joysense.com
ADMIN_PASSWORD=Admin123*
DB_SCHEMA=joysense
PORT=3001
NODE_ENV=development
"@

$backendEnv | Out-File -FilePath "backend\.env" -Encoding utf8 -NoNewline
Write-Host "✅ Backend .env actualizado" -ForegroundColor Green

# Frontend .env
$frontendEnv = @"
REACT_APP_SUPABASE_URL=https://fagswxnjkcavchfrnrhs.supabase.co
REACT_APP_SUPABASE_PUBLISHABLE_KEY=sb_publishable_OTw0aSfLWFXIyQkYc-jRzg_KkeFvn3X
REACT_APP_BACKEND_URL=http://localhost:3001/api
"@

$frontendEnv | Out-File -FilePath "frontend\.env" -Encoding utf8 -NoNewline
Write-Host "✅ Frontend .env actualizado" -ForegroundColor Green

Write-Host ""
Write-Host "✨ Archivos .env actualizados correctamente!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Contenido de backend/.env:" -ForegroundColor Yellow
Get-Content "backend\.env"
Write-Host ""
Write-Host "📋 Contenido de frontend/.env:" -ForegroundColor Yellow
Get-Content "frontend\.env"
