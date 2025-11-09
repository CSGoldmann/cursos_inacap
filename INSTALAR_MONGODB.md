# 📥 Instalar MongoDB en Windows

## Opción 1: Instalación Manual (Recomendada)

### Paso 1: Descargar MongoDB
1. Ve a: https://www.mongodb.com/try/download/community
2. Selecciona:
   - **Version**: 7.0 (Latest) o 6.0
   - **Platform**: Windows
   - **Package**: MSI
3. Haz clic en **Download**

### Paso 2: Instalar MongoDB
1. Ejecuta el archivo `.msi` descargado
2. En la pantalla de instalación:
   - ✅ Selecciona **"Complete"** (instalación completa)
   - ✅ Marca **"Install MongoDB as a Service"**
   - ✅ Selecciona **"Run service as Network Service user"**
   - ✅ Marca **"Install MongoDB Compass"** (interfaz gráfica opcional)
3. Haz clic en **Install**

### Paso 3: Verificar Instalación
1. Abre PowerShell o CMD como **Administrador**
2. Verifica el servicio:
   ```bash
   net start | findstr MongoDB
   ```
3. Deberías ver: `MongoDB` en la lista

### Paso 4: Iniciar MongoDB
Si no está corriendo automáticamente:
```bash
net start MongoDB
```

## Opción 2: MongoDB Atlas (Cloud - Gratis)

Si prefieres no instalar MongoDB localmente, puedes usar MongoDB Atlas (gratis):

### Paso 1: Crear cuenta
1. Ve a: https://www.mongodb.com/cloud/atlas/register
2. Crea una cuenta gratuita

### Paso 2: Crear cluster
1. Selecciona el plan **FREE (M0)**
2. Elige una región cercana
3. Crea el cluster (tarda 5-10 minutos)

### Paso 3: Configurar acceso
1. Ve a **Database Access**
2. Crea un usuario de base de datos
3. Ve a **Network Access**
4. Agrega `0.0.0.0/0` para permitir acceso desde cualquier IP

### Paso 4: Obtener URI de conexión
1. Ve a **Database** → **Connect**
2. Selecciona **"Connect your application"**
3. Copia la URI de conexión
4. Reemplaza `<password>` con tu contraseña

### Paso 5: Actualizar .env
Edita el archivo `.env` y cambia:
```env
MONGODB_URI=mongodb+srv://usuario:contraseña@cluster0.xxxxx.mongodb.net/cursos_inacap?retryWrites=true&w=majority
```

## Verificar Instalación

Después de instalar MongoDB, verifica:

```bash
# Verificar que el servicio está corriendo
net start | findstr MongoDB

# Probar conexión (si tienes mongosh instalado)
mongosh
```

## Solución de Problemas

### El servicio no inicia
```bash
# Verificar estado del servicio
sc query MongoDB

# Intentar iniciar manualmente
net start MongoDB
```

### Error de permisos
- Ejecuta PowerShell o CMD como **Administrador**

### Puerto 27017 ocupado
```bash
# Ver qué proceso usa el puerto
netstat -ano | findstr :27017

# Si es otro proceso, detén MongoDB y reinícialo
net stop MongoDB
net start MongoDB
```

### MongoDB no está en el PATH
Si instalaste MongoDB pero no está en el PATH:
1. Busca la ubicación de instalación (normalmente: `C:\Program Files\MongoDB\Server\7.0\bin`)
2. Agrega esa ruta al PATH del sistema

---

**¿Necesitas ayuda?** Ejecuta `npm run check-mongodb` para diagnóstico automático.

