# 🗄️ Cómo Iniciar MongoDB

## Windows

### Opción 1: Como Servicio (Recomendado)

1. **Abre PowerShell o CMD como Administrador**
   - Click derecho en el menú inicio
   - Selecciona "Windows PowerShell (Administrador)" o "Símbolo del sistema (Administrador)"

2. **Inicia el servicio MongoDB**
   ```bash
   net start MongoDB
   ```

3. **Verifica que esté corriendo**
   ```bash
   net start | findstr MongoDB
   ```

### Opción 2: Script de Verificación

Ejecuta el script de verificación que intentará iniciar MongoDB automáticamente:

```bash
npm run check-mongodb
```

O directamente:
```bash
node scripts/verificar-mongodb.js
```

### Opción 3: Manualmente (si no está como servicio)

Si MongoDB no está instalado como servicio, puedes iniciarlo manualmente:

1. **Crea la carpeta de datos** (si no existe)
   ```bash
   mkdir C:\data\db
   ```

2. **Inicia MongoDB**
   ```bash
   mongod --dbpath "C:\data\db"
   ```

### Verificar que MongoDB está corriendo

```bash
# Probar conexión
mongosh
# O si no tienes mongosh:
mongo
```

Si se conecta, verás un mensaje como:
```
MongoDB shell version...
connecting to: mongodb://127.0.0.1:27017
```

## macOS

```bash
# Iniciar MongoDB
brew services start mongodb-community

# Verificar estado
brew services list
```

## Linux

```bash
# Iniciar MongoDB
sudo systemctl start mongod

# Verificar estado
sudo systemctl status mongod

# Habilitar inicio automático
sudo systemctl enable mongod
```

## Instalar MongoDB (si no está instalado)

### Windows

1. Descarga MongoDB Community Server:
   - https://www.mongodb.com/try/download/community

2. Ejecuta el instalador `.msi`

3. Durante la instalación:
   - Elige "Complete"
   - ✅ Marca "Install MongoDB as a Service"
   - ✅ Marca "Install MongoDB Compass" (opcional, interfaz gráfica)

4. MongoDB se iniciará automáticamente después de la instalación

### macOS

```bash
# Instalar con Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Linux (Ubuntu/Debian)

```bash
# Importar clave pública
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Agregar repositorio
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Instalar
sudo apt-get update
sudo apt-get install -y mongodb-org

# Iniciar
sudo systemctl start mongod
sudo systemctl enable mongod
```

## Solución de Problemas

### Error: "MongoDB service name not found"

MongoDB no está instalado como servicio. Reinstala MongoDB marcando "Install MongoDB as a Service".

### Error: "Access Denied"

Ejecuta PowerShell o CMD como **Administrador**.

### Error: "Cannot connect to MongoDB"

1. Verifica que MongoDB esté corriendo:
   ```bash
   net start | findstr MongoDB
   ```

2. Verifica que el puerto 27017 esté disponible:
   ```bash
   netstat -ano | findstr :27017
   ```

3. Si otro proceso está usando el puerto, detén MongoDB y reinícialo:
   ```bash
   net stop MongoDB
   net start MongoDB
   ```

### MongoDB no inicia automáticamente

```bash
# Verificar si el servicio está habilitado para inicio automático
sc qc MongoDB

# Si no está habilitado, habilítalo
sc config MongoDB start= auto
```

## Verificar que la aplicación puede conectarse

Una vez que MongoDB esté corriendo, verifica la conexión:

```bash
# Desde la aplicación
npm run check-mongodb

# O ejecuta el servidor
npm start
```

Deberías ver en la consola:
```
✅ MongoDB conectado exitosamente
```

---

**¿Necesitas ayuda?** Revisa los logs de MongoDB o ejecuta `npm run check-mongodb` para diagnóstico automático.

