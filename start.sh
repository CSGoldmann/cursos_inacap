#!/bin/bash

echo "========================================"
echo "  Cursos INACAP - Iniciar Aplicacion"
echo "========================================"
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js no está instalado"
    echo "Por favor instala Node.js desde https://nodejs.org/"
    exit 1
fi

echo "[OK] Node.js encontrado"
echo ""

# Dar permisos de ejecución
chmod +x scripts/start.js 2>/dev/null

# Ejecutar script de inicio
node scripts/start.js

