@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo   Cursos INACAP - Iniciar Aplicacion
echo ========================================
echo.

REM Verificar Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js no esta instalado
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js encontrado
echo.

REM Verificar npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm no esta instalado
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] npm encontrado
echo.

REM Verificar si existe package.json
if not exist "package.json" (
    echo [ERROR] package.json no encontrado
    echo Asegurate de estar en el directorio correcto del proyecto
    pause
    exit /b 1
)

echo [OK] package.json encontrado
echo.

REM Verificar y crear archivo .env
if not exist ".env" (
    echo [ADVERTENCIA] Archivo .env no encontrado
    if exist ".env.example" (
        echo [INFO] Creando .env desde .env.example...
        copy /Y ".env.example" ".env" >nul
        echo [OK] Archivo .env creado
    ) else (
        echo [INFO] Creando .env con valores por defecto...
        (
            echo MONGODB_URI=mongodb://localhost:27017/cursos_inacap
            echo PORT=3000
            echo NODE_ENV=development
            echo SESSION_SECRET=cursos-inacap-secret-key-change-in-production
        ) > .env
        echo [OK] Archivo .env creado
    )
    echo.
) else (
    echo [OK] Archivo .env encontrado
    echo.
)

REM Verificar y crear carpetas uploads
if not exist "uploads" (
    echo [INFO] Creando carpetas de uploads...
    mkdir uploads 2>nul
    mkdir uploads\videos 2>nul
    mkdir uploads\audios 2>nul
    mkdir uploads\images 2>nul
    echo [OK] Carpetas de uploads creadas
    echo.
) else (
    echo [OK] Carpetas de uploads existen
    echo.
)

REM Verificar node_modules
if not exist "node_modules" (
    echo [ADVERTENCIA] node_modules no encontrado
    echo [INFO] Instalando dependencias...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Error al instalar dependencias
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencias instaladas
    echo.
    ) else (
        REM Verificar que existan dependencias críticas
        if not exist "node_modules\dotenv" (
            echo [ADVERTENCIA] Faltan algunas dependencias
            echo [INFO] Reinstalando dependencias...
            echo.
            call npm install
            if %ERRORLEVEL% NEQ 0 (
                echo [ERROR] Error al instalar dependencias
                pause
                exit /b 1
            )
            echo.
            echo [OK] Dependencias instaladas
            echo.
        ) else if not exist "node_modules\mongoose" (
            echo [ADVERTENCIA] Faltan dependencias de base de datos
            echo [INFO] Reinstalando dependencias...
            echo.
            call npm install
            if %ERRORLEVEL% NEQ 0 (
                echo [ERROR] Error al instalar dependencias
                pause
                exit /b 1
            )
            echo.
            echo [OK] Dependencias instaladas
            echo.
        ) else if not exist "node_modules\bcryptjs" (
            echo [ADVERTENCIA] Faltan dependencias de autenticacion
            echo [INFO] Reinstalando dependencias...
            echo.
            call npm install
            if %ERRORLEVEL% NEQ 0 (
                echo [ERROR] Error al instalar dependencias
                pause
                exit /b 1
            )
            echo.
            echo [OK] Dependencias instaladas
            echo.
        ) else (
            echo [OK] Dependencias instaladas
            echo.
        )
    )

REM Verificar MongoDB
echo [INFO] Verificando MongoDB...
echo.

REM Intentar verificar si el servicio MongoDB está corriendo
sc query MongoDB >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    sc query MongoDB | findstr /C:"RUNNING" >nul
    if %ERRORLEVEL% EQU 0 (
        echo [OK] MongoDB esta corriendo
        echo.
        set MONGODB_AVAILABLE=1
    ) else (
        echo [ADVERTENCIA] MongoDB no esta corriendo
        echo [INFO] Intentando iniciar MongoDB...
        echo.
        net start MongoDB >nul 2>nul
        if %ERRORLEVEL% EQU 0 (
            echo [OK] MongoDB iniciado exitosamente
            echo.
            set MONGODB_AVAILABLE=1
        ) else (
            echo [ADVERTENCIA] No se pudo iniciar MongoDB automaticamente
            echo.
            echo [INFO] Para iniciar MongoDB manualmente:
            echo   - Abre PowerShell o CMD como Administrador
            echo   - Ejecuta: net start MongoDB
            echo.
            echo [INFO] O ejecuta: npm run check-mongodb
            echo.
            set MONGODB_AVAILABLE=0
        )
    )
) else (
    echo [ADVERTENCIA] Servicio MongoDB no encontrado
    echo [INFO] MongoDB puede no estar instalado o no esta como servicio
    echo.
    echo [INFO] Para instalar MongoDB:
    echo   1. Descarga desde: https://www.mongodb.com/try/download/community
    echo   2. Durante la instalacion, marca "Install MongoDB as a Service"
    echo.
    echo [INFO] La aplicacion continuara sin MongoDB
    echo   Puedes poblar datos despues con: npm run seed
    echo.
    set MONGODB_AVAILABLE=0
)

REM Preguntar si poblar base de datos
if "%MONGODB_AVAILABLE%"=="1" (
    echo.
    set /p POBLAR_DB="Deseas poblar la base de datos con datos de prueba? (s/n): "
    if /i "!POBLAR_DB!"=="s" (
        echo.
        echo [INFO] Poblando base de datos...
        echo   Esto creara cursos, usuarios de prueba e inscripciones
        echo.
        call node scripts/seed.js
        if %ERRORLEVEL% NEQ 0 (
            echo [ADVERTENCIA] Error al poblar base de datos
            echo   Puede que ya existan datos o haya un error de conexion
            echo.
        ) else (
            echo.
            echo [OK] Base de datos poblada exitosamente
            echo.
            echo [INFO] Usuarios de prueba creados:
            echo   - Estudiante: estudiante@inacap.cl / 123456
            echo   - Profesor: profesor@inacap.cl / 123456
            echo   - Admin: admin@inacap.cl / 123456
            echo.
        )
    ) else (
        echo [INFO] Omitiendo poblado de base de datos
        echo   Puedes poblar datos despues con: npm run seed
        echo.
    )
) else (
    echo [INFO] MongoDB no esta disponible, omitiendo poblado de base de datos
    echo   Puedes poblar datos despues con: npm run seed
    echo.
    echo [ADVERTENCIA] Sin MongoDB, las siguientes funcionalidades no estaran disponibles:
    echo   - Login y autenticacion
    echo   - Cursos desde base de datos
    echo   - Inscripciones a cursos
    echo   - Notificaciones guardadas
    echo   - Progreso de cursos
    echo.
)

REM Verificar que server.js existe
if not exist "server.js" (
    echo [ERROR] server.js no encontrado
    pause
    exit /b 1
)

REM Verificar que dotenv esté instalado antes de iniciar
if not exist "node_modules\dotenv" (
    echo [ERROR] Las dependencias no estan completamente instaladas
    echo Por favor ejecuta: npm install
    pause
    exit /b 1
)

REM Verificar si el puerto 3000 está en uso
echo [INFO] Verificando puerto 3000...
netstat -ano | findstr :3000 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [ADVERTENCIA] El puerto 3000 esta en uso
    echo.
    echo [INFO] Opciones:
    echo   1. Cerrar el proceso que usa el puerto
    echo   2. Usar otro puerto
    echo   3. Cancelar
    echo.
    set /p OPCION_PORT="Selecciona una opcion (1/2/3): "
    
    if /i "!OPCION_PORT!"=="1" (
        echo.
        echo [INFO] Buscando proceso en puerto 3000...
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
            set PID=%%a
        )
        if defined PID (
            echo [INFO] Cerrando proceso PID: !PID!
            taskkill /PID !PID! /F >nul 2>nul
            if %ERRORLEVEL% EQU 0 (
                echo [OK] Proceso cerrado
                timeout /t 2 >nul
            ) else (
                echo [ADVERTENCIA] No se pudo cerrar el proceso automaticamente
                echo   Puede requerir permisos de administrador
            )
        ) else (
            echo [ADVERTENCIA] No se encontro el proceso
        )
        echo.
    ) else if /i "!OPCION_PORT!"=="2" (
        echo.
        set /p NUEVO_PUERTO="Ingresa el numero de puerto a usar (default 3001): "
        if "!NUEVO_PUERTO!"=="" set NUEVO_PUERTO=3001
        echo [INFO] Actualizando puerto en .env...
        powershell -Command "(Get-Content .env) -replace 'PORT=3000', 'PORT=!NUEVO_PUERTO!' | Set-Content .env"
        echo [OK] Puerto cambiado a !NUEVO_PUERTO!
        echo.
        set PORT_USADO=!NUEVO_PUERTO!
    ) else (
        echo [INFO] Operacion cancelada
        pause
        exit /b 0
    )
) else (
    echo [OK] Puerto 3000 disponible
    echo.
    set PORT_USADO=3000
)

REM Iniciar servidor
echo ========================================
echo   Iniciando servidor...
echo ========================================
echo.
if defined PORT_USADO (
    echo [INFO] El servidor estara disponible en: http://localhost:!PORT_USADO!
) else (
    echo [INFO] El servidor estara disponible en: http://localhost:3000
)
echo [INFO] Presiona Ctrl+C para detener el servidor
echo.
if "%MONGODB_AVAILABLE%"=="1" (
    echo [INFO] Funcionalidades disponibles:
    echo   - Login y registro de usuarios
    echo   - Cursos completos desde base de datos
    echo   - Vista de curso con reproductor de lecciones
    echo   - Inscripciones a cursos
    echo   - Examenes por seccion y examen final
    echo   - Progreso de lecciones y cursos
    echo   - Notificaciones en tiempo real
    echo.
    echo [INFO] Para iniciar sesion:
    echo   - Email: estudiante@inacap.cl
    echo   - Contrasena: 123456
    echo.
    echo [INFO] Tambien puedes registrar un nuevo usuario desde login.html
    echo.
) else (
    echo [ADVERTENCIA] MongoDB no esta disponible
    echo   Algunas funcionalidades estaran limitadas
    echo.
)
echo.

call node server.js

REM Si el servidor se detiene
echo.
echo [INFO] Servidor detenido
pause
