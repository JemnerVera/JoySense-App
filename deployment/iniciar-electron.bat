@echo off
chcp 65001 >nul
echo ========================================
echo    JoySense Dashboard - Electron App
echo ========================================
echo.

REM Verificar si Node.js está instalado
if exist "C:\Program Files\nodejs\node.exe" (
    echo ✅ Node.js encontrado en: C:\Program Files\nodejs\node.exe
    set NODE_PATH=C:\Program Files\nodejs\node.exe
    set NPM_PATH=C:\Program Files\nodejs\npm.cmd
) else (
    echo ❌ Node.js no encontrado. Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar si npm está instalado
if exist "C:\Program Files\nodejs\npm.cmd" (
    echo ✅ npm encontrado en: C:\Program Files\nodejs\npm.cmd
) else (
    echo ❌ npm no encontrado. Por favor instala npm.
    pause
    exit /b 1
)

REM Cambiar al directorio raíz del proyecto (un nivel arriba de deployment)
cd /d "%~dp0.."
echo 📂 Directorio actual: %CD%
echo.

REM Verificar si las dependencias están instaladas
if not exist "frontend\node_modules" (
    echo 📦 Instalando dependencias del frontend...
    cd frontend
    "C:\Program Files\nodejs\npm.cmd" install
    cd ..
) else (
    echo ✅ Dependencias del frontend ya instaladas
)

REM Verificar si las dependencias de Electron están instaladas
if not exist "frontend\node_modules\electron" (
    echo 📦 Instalando dependencias de Electron...
    cd frontend
    set PATH=%PATH%;C:\Program Files\nodejs
    npm install --save-dev electron electron-builder concurrently wait-on electron-is-dev
    cd ..
) else (
    echo ✅ Dependencias de Electron ya instaladas
)

echo.
echo 🚀 Iniciando Backend...
start "JoySense Backend" cmd /k "set PATH=%PATH%;C:\Program Files\nodejs && cd "%~dp0..\backend" && npm start"

echo ⏳ Esperando que el backend esté listo...
timeout /t 3 /nobreak >nul

echo 🖥️  Iniciando aplicación Electron...
cd frontend
start "JoySense Electron" cmd /k "set PATH=%PATH%;C:\Program Files\nodejs && cd "%~dp0..\frontend" && npm run electron-dev"

echo.
echo ✅ Aplicación Electron iniciada correctamente
echo.
echo 📋 Información:
echo    - Backend: http://localhost:3001
echo    - Frontend: http://localhost:3000
echo    - Electron: Ventana de aplicación nativa
echo.
echo 🎯 La aplicación se abrirá en una ventana separada
echo.
echo ⚠️  Para detener los servicios, cierra las ventanas de CMD
echo.
pause
