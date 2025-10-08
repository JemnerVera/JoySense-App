@echo off
echo ========================================
echo   JoySense Dashboard - Post Deploy Local
echo ========================================
echo.
echo ⚠️  IMPORTANTE: Este script usa las variables de entorno
echo    configuradas en Vercel para ejecutar localmente
echo    después del deploy en producción.
echo.

REM Definir rutas de Node.js
set NODE_PATH=C:\Program Files\nodejs\node.exe
set NPM_PATH=C:\Program Files\nodejs\npm.cmd

REM Agregar Node.js al PATH para esta sesión
set "PATH=C:\Program Files\nodejs;%PATH%"

REM Verificar si Node.js está instalado
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

REM Cambiar al directorio raíz del proyecto
cd /d "%~dp0.."
echo 📁 Directorio actual: %CD%
echo.

REM Verificar que existan los directorios necesarios
if not exist "backend" (
    echo ❌ Error: No se encuentra el directorio 'backend'
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ❌ Error: No se encuentra el directorio 'frontend'
    pause
    exit /b 1
)

REM Detener procesos de Node.js existentes
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

REM Verificar que existan los archivos .env
if not exist "backend\.env" (
    echo ❌ Error: No se encuentra backend\.env
    echo Por favor, asegúrate de que el archivo .env esté configurado
    echo con las variables de entorno de producción.
    pause
    exit /b 1
)

if not exist "frontend\.env" (
    echo ❌ Error: No se encuentra frontend\.env
    echo Por favor, asegúrate de que el archivo .env esté configurado
    echo con las variables de entorno de producción.
    pause
    exit /b 1
)

echo ✅ Archivos .env encontrados
echo.

REM Iniciar Backend con variables de entorno de producción
echo 🚀 Iniciando Backend (Producción)...
start "JoySense Backend - Producción" cmd /k "cd /d "%~dp0..\backend" && echo Iniciando servidor backend con variables de producción... && echo 🔑 Usando variables de entorno de PRODUCCIÓN && "%NPM_PATH%" install && "%NODE_PATH%" server.js"

REM Esperar un momento para que el backend se inicie
echo ⏳ Esperando 4 segundos para que el backend se inicie...
timeout /t 4 /nobreak >nul

REM Iniciar Frontend con variables de entorno de producción
echo 🎨 Iniciando Frontend (Producción)...
start "JoySense Frontend - Producción" cmd /k "cd /d "%~dp0..\frontend" && echo Iniciando aplicación frontend con variables de producción... && echo 🔑 Usando variables de entorno de PRODUCCIÓN && "%NPM_PATH%" install && "%NPM_PATH%" start"

echo.
echo 🔍 Verificando que los servicios estén funcionando...
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:3001/api/sense/pais' -TimeoutSec 5; Write-Host '✅ Backend funcionando correctamente' } catch { Write-Host '❌ Backend no está respondiendo - revisa la ventana del backend' }"

echo.
echo ✅ Servicios iniciados correctamente
echo.
echo 📋 Información:
echo    - Backend: http://localhost:3001
echo    - Frontend: http://localhost:3000
echo    - Variables: PRODUCCIÓN (después del deploy)
echo.
echo 🔄 Para detener los servicios, cierra las ventanas de CMD
echo.
echo ⚠️ IMPORTANTE: Este script usa las variables de entorno
echo    configuradas para producción. Asegúrate de que los
echo    archivos .env contengan las keys correctas.
echo.
pause
