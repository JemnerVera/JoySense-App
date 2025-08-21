@echo off
chcp 65001 >nul
echo ========================================
echo    JoySense Dashboard - Construir App
echo ========================================
echo.

REM Verificar si Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js no encontrado. Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
) else (
    echo ✅ Node.js encontrado
)

echo.
echo 📂 Directorio actual: %CD%
echo.

REM Verificar si las dependencias están instaladas
if not exist "frontend\node_modules" (
    echo 📦 Instalando dependencias del frontend...
    cd frontend
    npm install
    cd ..
) else (
    echo ✅ Dependencias del frontend ya instaladas
)

REM Verificar si las dependencias de Electron están instaladas
if not exist "frontend\node_modules\electron" (
    echo 📦 Instalando dependencias de Electron...
    cd frontend
    npm install --save-dev electron electron-builder concurrently wait-on electron-is-dev
    cd ..
) else (
    echo ✅ Dependencias de Electron ya instaladas
)

echo.
echo 🔨 Construyendo aplicación Electron...
echo.

cd frontend

echo 📦 Construyendo React app...
call npm run build

if %errorlevel% neq 0 (
    echo ❌ Error construyendo la aplicación React
    pause
    exit /b 1
)

echo ✅ React app construida exitosamente
echo.

echo 🖥️  Construyendo aplicación Electron para Windows...
call npm run dist-win

if %errorlevel% neq 0 (
    echo ❌ Error construyendo la aplicación Electron
    pause
    exit /b 1
)

cd ..

echo.
echo ✅ ¡Aplicación construida exitosamente!
echo.
echo 📁 El ejecutable se encuentra en: frontend\dist\
echo.
echo 🎯 Puedes distribuir el archivo .exe a otros usuarios
echo.
pause
