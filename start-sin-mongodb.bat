@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo   Cursos INACAP - Iniciar SIN MongoDB
echo ========================================
echo.
echo [ADVERTENCIA] Esta opcion inicia la aplicacion sin MongoDB
echo La aplicacion funcionara pero NO podras usar la base de datos
echo.
echo Para instalar MongoDB localmente:
echo   1. Ve a: https://www.mongodb.com/try/download/community
echo   2. Descarga e instala MongoDB Community Server
echo   3. Durante la instalacion, marca "Install MongoDB as a Service"
echo.
echo O usa MongoDB Atlas (gratis en la nube):
echo   1. Ve a: https://www.mongodb.com/cloud/atlas
echo   2. Crea una cuenta gratuita
echo   3. Crea un cluster M0 (gratis)
echo   4. Actualiza la URI en .env
echo.
set /p CONTINUAR="Deseas continuar sin MongoDB? (s/n): "
if /i not "!CONTINUAR!"=="s" (
    echo.
    echo Cancelado. Instala MongoDB primero.
    pause
    exit /b 0
)

echo.
echo ========================================
echo   Iniciando aplicacion...
echo ========================================
echo.

REM Verificar Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js no esta instalado
    pause
    exit /b 1
)

REM Verificar dependencias
if not exist "node_modules\dotenv" (
    echo [INFO] Instalando dependencias...
    call npm install
    echo.
)

REM Iniciar servidor
echo [INFO] El servidor estara disponible en: http://localhost:3000
echo [INFO] Presiona Ctrl+C para detener
echo.
echo.

call node server.js

pause

