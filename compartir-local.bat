@echo off
chcp 65001 >nul
echo ========================================
echo    JoySense Dashboard - Compartir Local
echo ========================================
echo.

echo 🚀 Iniciando Backend...
start "JoySense Backend" cmd /k "set PATH=%PATH%;C:\Program Files\nodejs && cd backend && npm start"

echo ⏳ Esperando que el backend esté listo...
timeout /t 3 /nobreak >nul

echo 🌐 Iniciando túnel público con ngrok...
echo.
echo 📋 Instrucciones:
echo 1. ngrok te dará una URL pública
echo 2. Comparte esa URL con otros
echo 3. Ellos podrán acceder a tu aplicación
echo.
echo ⚠️  IMPORTANTE: Mantén esta ventana abierta
echo.

ngrok http 3001

echo.
echo ✅ Túnel cerrado
pause
