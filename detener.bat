@echo off
echo ========================================
echo    JoySense Dashboard - Detener
echo ========================================
echo.

echo 🛑 Deteniendo todos los procesos de Node.js...
taskkill /f /im node.exe >nul 2>&1

if %errorlevel% equ 0 (
    echo ✅ Procesos detenidos correctamente
) else (
    echo ℹ️  No se encontraron procesos de Node.js ejecutándose
)

echo.
echo 🔄 Para reiniciar, ejecuta 'iniciar.bat' o 'iniciar-dinamico.bat'
echo.
pause
