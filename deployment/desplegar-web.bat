@echo off
chcp 65001 >nul
echo ========================================
echo    JoySense Dashboard - Desplegar Web
echo ========================================
echo.

REM Verificar si Node.js está instalado
if exist "C:\Program Files\nodejs\node.exe" (
    echo ✅ Node.js encontrado en: C:\Program Files\nodejs\node.exe
    set PATH=%PATH%;C:\Program Files\nodejs
) else (
    echo ❌ Node.js no encontrado. Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo 📂 Directorio actual: %CD%
echo.

echo 🔨 Construyendo aplicación para producción...
cd frontend
call npm run build

if %errorlevel% neq 0 (
    echo ❌ Error construyendo la aplicación
    pause
    exit /b 1
)

echo ✅ Aplicación construida exitosamente
echo.

echo 🌐 Opciones de despliegue:
echo.
echo 1. Vercel (Recomendado - Gratis)
echo    - Subir a GitHub y conectar con Vercel
echo    - URL automática: https://tu-app.vercel.app
echo.
echo 2. Netlify (Alternativa - Gratis)
echo    - Arrastrar carpeta 'build' a netlify.com
echo    - URL automática: https://tu-app.netlify.app
echo.
echo 3. GitHub Pages (Gratis)
echo    - Subir a repositorio público
echo    - URL: https://usuario.github.io/repositorio
echo.
echo 4. Servidor Local (Para pruebas)
echo    - Usar el backend actual en localhost:3001
echo.

echo 📋 Pasos para Vercel (Opción más fácil):
echo.
echo 1. Crear cuenta en https://vercel.com
echo 2. Subir el proyecto a GitHub
echo 3. Conectar repositorio en Vercel
echo 4. Configurar variables de entorno:
echo    - REACT_APP_BACKEND_URL=https://tu-backend.vercel.app
echo.
echo 📋 Pasos para Netlify:
echo.
echo 1. Ir a https://netlify.com
echo 2. Arrastrar la carpeta 'build' al área de deploy
echo 3. Obtener URL automática
echo.

echo 📁 La carpeta 'build' está lista en: frontend\build\
echo.
echo 🎯 ¿Qué opción prefieres?
echo.
pause
