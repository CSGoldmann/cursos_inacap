@echo off
chcp 65001 >nul
echo ========================================
echo   Cerrar Servidor en Puerto 3000
echo ========================================
echo.

echo [INFO] Buscando procesos en puerto 3000...
netstat -ano | findstr :3000 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [OK] No hay procesos en el puerto 3000
    pause
    exit /b 0
)

echo [INFO] Procesos encontrados en puerto 3000:
netstat -ano | findstr :3000

echo.
echo [INFO] Cerrando procesos...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Cerrando proceso PID: %%a
    taskkill /PID %%a /F >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Proceso %%a cerrado
    ) else (
        echo [ADVERTENCIA] No se pudo cerrar proceso %%a (puede requerir permisos de administrador)
    )
)

echo.
echo [OK] Proceso completado
pause

