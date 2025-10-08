@echo off
echo ========================================
echo    JoySense Dashboard - Vista Dinamica
echo ========================================
echo.

REM Definir rutas de Node.js
set NODE_PATH=C:\Program Files\nodejs\node.exe
set NPM_PATH=C:\Program Files\nodejs\npm.cmd

REM Agregar Node.js al PATH para esta sesión
set "PATH=C:\Program Files\nodejs;%PATH%"

REM Verificar si Node.js está instalado en la ruta específica
if not exist "%NODE_PATH%" (
    echo ❌ Error: Node.js no está instalado en %NODE_PATH%
    echo Por favor, instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

if not exist "%NPM_PATH%" (
    echo ❌ Error: npm no está instalado en %NPM_PATH%
    echo Por favor, instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js encontrado en: %NODE_PATH%
echo ✅ npm encontrado en: %NPM_PATH%
echo.

REM Cambiar al directorio raíz del proyecto (un nivel arriba de deployment)
cd /d "%~dp0.."
echo 📁 Directorio actual: %CD%
echo.

REM Verificar que existan los directorios necesarios
if not exist "backend" (
    echo ❌ Error: No se encuentra el directorio 'backend'
    echo 📁 Directorio actual: %CD%
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ❌ Error: No se encuentra el directorio 'frontend'
    echo 📁 Directorio actual: %CD%
    pause
    exit /b 1
)

REM Detener procesos de Node.js existentes para evitar conflictos
echo 🛑 Verificando procesos de Node.js existentes...
taskkill /f /im node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Procesos de Node.js existentes detenidos
    echo ⏳ Esperando 2 segundos para liberar puertos...
    timeout /t 2 /nobreak >nul
) else (
    echo ℹ️ No había procesos de Node.js ejecutándose
)
echo.

REM Iniciar Backend
echo 🚀 Iniciando Backend...
start "JoySense Backend" cmd /k "cd /d "%~dp0..\backend" && echo Iniciando servidor backend... && set SUPABASE_URL=https://fagswxnjkcavchfrnrhs.supabase.co && set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhZ3N3eG5qa2NhdmNoZnJucmhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzE1NDMyNywiZXhwIjoyMDYyNzMwMzI3fQ.ioeluR-iTWJ7-w_7UAuMl_aPXHJM6nlhv6Nh4hohBjw && "%NPM_PATH%" install && "%NODE_PATH%" server.js"

REM Esperar un momento para que el backend se inicie
echo ⏳ Esperando 4 segundos para que el backend se inicie...
timeout /t 4 /nobreak >nul

REM Iniciar Frontend
echo 🎨 Iniciando Frontend...
start "JoySense Frontend" cmd /k "cd /d "%~dp0..\frontend" && echo Iniciando aplicación frontend... && set REACT_APP_SUPABASE_URL=https://fagswxnjkcavchfrnrhs.supabase.co && set REACT_APP_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhZ3N3eG5qa2NhdmNoZnJucmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNTQzMjcsImV4cCI6MjA2MjczMDMyN30.13bSx7s-r9jt7ZmIKOYsqTreAwGxqFB8_c5A1XrQBqc && set REACT_APP_BACKEND_URL=http://localhost:3001/api && "%NPM_PATH%" install && "%NPM_PATH%" start"

echo.
echo 🔍 Verificando que los servicios estén funcionando...
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:3001/api/sense/pais' -TimeoutSec 5; Write-Host '✅ Backend funcionando correctamente' } catch { Write-Host '❌ Backend no está respondiendo - revisa la ventana del backend' }"

echo.
echo ✅ Servicios iniciados correctamente
echo.
echo 📋 Información:
echo    - Backend: http://localhost:3001
echo    - Frontend: http://localhost:3000
echo    - Vista Dinámica: Activada por defecto
echo.
echo 🔄 Para detener los servicios, cierra las ventanas de CMD
echo.
echo ⚠️ IMPORTANTE: Si ejecutas este script mientras hay servicios corriendo,
echo    se detendrán automáticamente para evitar conflictos.
echo.
pause