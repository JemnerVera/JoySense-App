#!/bin/bash

echo "🚀 Iniciando JoySense en Azure..."

# Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
cd /home/site/wwwroot/backend
npm install --production

# Instalar dependencias del frontend
echo "📦 Instalando dependencias del frontend..."
cd /home/site/wwwroot/frontend
npm install --production

# Build del frontend
echo "🏗️ Compilando frontend..."
npm run build

# Iniciar backend
echo "🚀 Iniciando servidor backend..."
cd /home/site/wwwroot/backend
node server.js

