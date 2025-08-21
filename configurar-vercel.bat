@echo off
chcp 65001 >nul
echo ========================================
echo    JoySense Dashboard - Configurar Vercel
echo ========================================
echo.

echo 🔐 CONFIRMACIÓN DE SEGURIDAD:
echo.
echo ✅ SEGURO de publicar en GitHub:
echo    - Supabase URL: https://fagswxnjkcavchfrnrhs.supabase.co
echo    - Supabase Publishable Key: sb_publishable_OTw0aSfLWFXIyQkYc-jRzg_KkeFvn3X
echo.
echo ❌ NUNCA publicar (Service Role Key):
echo    - [CONFIGURAR_EN_VERCEL_UI]
echo.

echo 🚀 Pasos para Vercel:
echo.
echo 1. Subir a GitHub:
echo    git init
echo    git add .
echo    git commit -m "Initial commit"
echo    git remote add origin https://github.com/tu-usuario/joysense-dashboard.git
echo    git push -u origin main
echo.
echo 2. Crear cuenta en https://vercel.com
echo.
echo 3. Conectar repositorio en Vercel
echo.
echo 4. Configurar variables de entorno en Vercel:
echo    - SUPABASE_URL=https://fagswxnjkcavchfrnrhs.supabase.co
echo    - SUPABASE_SERVICE_ROLE_KEY=[TU_SERVICE_ROLE_KEY_PRIVADA]
echo    - REACT_APP_BACKEND_URL=https://tu-backend.vercel.app
echo.
echo 5. Desplegar backend separado:
echo    - Subir carpeta 'backend' a repositorio separado
echo    - Conectar con Vercel
echo    - Obtener URL del backend
echo    - Actualizar REACT_APP_BACKEND_URL
echo.

echo 📋 ¿Quieres que te ayude con algún paso específico?
echo.
pause
