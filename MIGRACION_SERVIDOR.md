# Guía de Migración a Servidor

Esta guía te ayudará a migrar la aplicación de un entorno local a un servidor de producción.

## 📋 Checklist Pre-Migración

- [ ] MongoDB instalado y funcionando localmente
- [ ] Base de datos poblada con datos de prueba
- [ ] Archivos de video/audio subidos y funcionando
- [ ] Aplicación funcionando correctamente en local
- [ ] Backup de la base de datos local creado

## 🗄️ Opción 1: MongoDB Atlas (Recomendado para empezar)

### Paso 1: Crear cuenta en MongoDB Atlas

1. Visita https://www.mongodb.com/cloud/atlas
2. Crea una cuenta gratuita
3. Crea un nuevo cluster (elige el plan gratuito M0)
4. Espera a que el cluster se cree (5-10 minutos)

### Paso 2: Configurar acceso

1. **Configurar acceso de red**
   - En "Network Access", agrega `0.0.0.0/0` para permitir acceso desde cualquier IP
   - O agrega la IP específica de tu servidor

2. **Crear usuario de base de datos**
   - Ve a "Database Access"
   - Crea un nuevo usuario
   - Guarda el nombre de usuario y contraseña

### Paso 3: Obtener URI de conexión

1. Ve a "Database" y haz clic en "Connect"
2. Selecciona "Connect your application"
3. Copia la URI de conexión
4. Reemplaza `<password>` con tu contraseña de usuario
5. Reemplaza `<database>` con `cursos_inacap`

Ejemplo:
```
mongodb+srv://usuario:contraseña@cluster0.xxxxx.mongodb.net/cursos_inacap?retryWrites=true&w=majority
```

### Paso 4: Migrar datos

```bash
# Exportar desde local
mongodump --uri="mongodb://localhost:27017/cursos_inacap" --out=./backup

# Importar a Atlas
mongorestore --uri="mongodb+srv://usuario:contraseña@cluster0.xxxxx.mongodb.net/cursos_inacap" ./backup/cursos_inacap
```

### Paso 5: Actualizar .env en servidor

```env
MONGODB_URI=mongodb+srv://usuario:contraseña@cluster0.xxxxx.mongodb.net/cursos_inacap?retryWrites=true&w=majority
PORT=3000
NODE_ENV=production
```

## 🖥️ Opción 2: Servidor Dedicado con MongoDB

### Paso 1: Instalar MongoDB en el servidor

**Ubuntu/Debian:**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Paso 2: Configurar acceso remoto

Editar `/etc/mongod.conf`:
```yaml
net:
  port: 27017
  bindIp: 0.0.0.0  # Permitir conexiones remotas
```

Reiniciar MongoDB:
```bash
sudo systemctl restart mongod
```

### Paso 3: Configurar firewall

```bash
# Permitir puerto 27017
sudo ufw allow 27017/tcp
```

### Paso 4: Crear usuario de administración

```bash
mongosh

# En la consola de MongoDB
use admin
db.createUser({
  user: "admin",
  pwd: "tu_contraseña_segura",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
})

use cursos_inacap
db.createUser({
  user: "cursos_user",
  pwd: "otra_contraseña_segura",
  roles: [ { role: "readWrite", db: "cursos_inacap" } ]
})
```

### Paso 5: Migrar datos

```bash
# Desde tu máquina local
mongodump --uri="mongodb://localhost:27017/cursos_inacap" --out=./backup

# Transferir al servidor
scp -r backup usuario@servidor:/tmp/

# En el servidor, importar
mongorestore --uri="mongodb://cursos_user:contraseña@localhost:27017/cursos_inacap" /tmp/backup/cursos_inacap
```

## 📦 Desplegar Aplicación Node.js

### Paso 1: Subir código al servidor

```bash
# Desde tu máquina local
tar -czf app.tar.gz --exclude='node_modules' --exclude='uploads' .
scp app.tar.gz usuario@servidor:/var/www/cursos-inacap/
```

### Paso 2: En el servidor

```bash
cd /var/www/cursos-inacap
tar -xzf app.tar.gz
npm install --production
```

### Paso 3: Configurar variables de entorno

```bash
cp .env.example .env
nano .env
# Editar con las credenciales correctas
```

### Paso 4: Migrar archivos uploads

```bash
# Desde local
tar -czf uploads.tar.gz uploads/
scp uploads.tar.gz usuario@servidor:/var/www/cursos-inacap/

# En servidor
tar -xzf uploads.tar.gz
chmod -R 755 uploads/
```

### Paso 5: Instalar y configurar PM2

```bash
npm install -g pm2
pm2 start server.js --name cursos-inacap
pm2 save
pm2 startup
# Seguir las instrucciones que aparecen
```

## 🌐 Configurar Nginx como Proxy Reverso

### Instalar Nginx

```bash
sudo apt update
sudo apt install nginx
```

### Configurar sitio

Crear `/etc/nginx/sites-available/cursos-inacap`:

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Tamaño máximo para uploads
    client_max_body_size 500M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Servir archivos estáticos directamente
    location /uploads {
        alias /var/www/cursos-inacap/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Habilitar sitio

```bash
sudo ln -s /etc/nginx/sites-available/cursos-inacap /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 Configurar SSL con Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

## ✅ Verificación Post-Migración

1. **Verificar conexión a MongoDB**
   ```bash
   pm2 logs cursos-inacap
   # Deberías ver: "✅ MongoDB conectado exitosamente"
   ```

2. **Verificar API**
   ```bash
   curl http://localhost:3000/api/cursos
   ```

3. **Verificar archivos estáticos**
   - Acceder a `http://tu-dominio.com`
   - Verificar que las imágenes se cargan
   - Intentar subir un archivo de prueba

4. **Verificar Socket.IO**
   - Abrir la aplicación en el navegador
   - Verificar que las notificaciones funcionan

## 🔄 Backup Automático

### Script de backup

Crear `/usr/local/bin/backup-cursos.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/cursos-inacap"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup MongoDB
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/mongodb_$DATE"

# Backup uploads
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" /var/www/cursos-inacap/uploads

# Eliminar backups antiguos (más de 30 días)
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completado: $DATE"
```

### Programar con cron

```bash
chmod +x /usr/local/bin/backup-cursos.sh
crontab -e

# Agregar (backup diario a las 2 AM)
0 2 * * * /usr/local/bin/backup-cursos.sh
```

## 🐛 Troubleshooting

### MongoDB no se conecta

```bash
# Verificar que MongoDB está corriendo
sudo systemctl status mongod

# Ver logs
sudo journalctl -u mongod -f
```

### PM2 no inicia

```bash
# Ver logs
pm2 logs cursos-inacap

# Reiniciar
pm2 restart cursos-inacap
```

### Nginx error 502

- Verificar que la aplicación está corriendo en el puerto 3000
- Verificar firewall
- Verificar logs de Nginx: `sudo tail -f /var/log/nginx/error.log`

## 📊 Monitoreo

### PM2 Monitoring

```bash
pm2 monit
```

### Ver estadísticas

```bash
pm2 status
pm2 info cursos-inacap
```

## 🔄 Actualizaciones

```bash
cd /var/www/cursos-inacap
git pull  # Si usas git
# O subir nueva versión manualmente
npm install --production
pm2 restart cursos-inacap
```

---

**Nota**: Asegúrate de cambiar todas las contraseñas por defecto y usar credenciales seguras en producción.

