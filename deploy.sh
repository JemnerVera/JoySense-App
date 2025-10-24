#!/bin/bash

# =========================================
# Azure Deployment Script para JoySense
# =========================================

set -e

echo "======================================"
echo "🚀 JoySense - Azure Deployment Script"
echo "======================================"

# Variables
DEPLOYMENT_SOURCE=${DEPLOYMENT_SOURCE:-$PWD}
DEPLOYMENT_TARGET=${DEPLOYMENT_TARGET:-/home/site/wwwroot}

echo "📂 Source: $DEPLOYMENT_SOURCE"
echo "📂 Target: $DEPLOYMENT_TARGET"

# 1. Copiar archivos al target
echo ""
echo "📦 Paso 1: Copiando archivos..."
if [ -d "$DEPLOYMENT_TARGET" ]; then
  rm -rf "$DEPLOYMENT_TARGET"
fi
mkdir -p "$DEPLOYMENT_TARGET"
cp -r "$DEPLOYMENT_SOURCE"/* "$DEPLOYMENT_TARGET"

# 2. Instalar dependencias del backend
echo ""
echo "📦 Paso 2: Instalando dependencias del backend..."
cd "$DEPLOYMENT_TARGET/backend"
npm install --production

# 3. Instalar dependencias del frontend
echo ""
echo "📦 Paso 3: Instalando dependencias del frontend..."
cd "$DEPLOYMENT_TARGET/frontend"
npm install

# 4. Build del frontend
echo ""
echo "🏗️ Paso 4: Compilando frontend..."
npm run build

# 5. Verificar que el build exista
if [ ! -d "$DEPLOYMENT_TARGET/frontend/build" ]; then
  echo "❌ ERROR: Frontend build falló"
  exit 1
fi

echo ""
echo "✅ Deployment completado exitosamente!"
echo "======================================"
echo "📁 Backend: $DEPLOYMENT_TARGET/backend"
echo "📁 Frontend Build: $DEPLOYMENT_TARGET/frontend/build"
echo "======================================"
echo ""
echo "🎉 ¡Listo para servir!"

