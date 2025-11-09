# Plataforma de Cursos INACAP

## 📋 Descripción General

Plataforma de aprendizaje en línea (LMS) desarrollada para INACAP, que permite a los estudiantes acceder a cursos, gestionar su perfil y recibir notificaciones en tiempo real. La aplicación combina un frontend moderno con Bootstrap 5 y un backend en Node.js con Express, MongoDB y Socket.IO para comunicación en tiempo real.

**Características principales:**
- ✅ Base de datos MongoDB para almacenamiento de cursos
- ✅ API REST completa para gestión de cursos
- ✅ Sistema de subida de archivos (videos, audios, imágenes)
- ✅ Notificaciones en tiempo real con Socket.IO
- ✅ Interfaz responsive y moderna

## 🛠️ Tecnologías Utilizadas

### Frontend
- **HTML5**: Estructura de las páginas
- **CSS3**: Estilos personalizados y Bootstrap 5.3.2
- **JavaScript (Vanilla)**: Lógica del cliente
- **Bootstrap 5.3.2**: Framework CSS para diseño responsivo
- **Bootstrap Icons 1.10.5**: Iconografía
- **Google Fonts (Inter)**: Tipografía
- **Socket.IO Client 4.8.1**: Cliente WebSocket para comunicación en tiempo real

### Backend
- **Node.js**: Entorno de ejecución
- **Express 5.1.0**: Framework web para Node.js
- **MongoDB**: Base de datos NoSQL
- **Mongoose 8.0.3**: ODM para MongoDB
- **Socket.IO 4.8.1**: Biblioteca para comunicación bidireccional en tiempo real
- **Multer 1.4.5**: Middleware para subida de archivos
- **CORS 2.8.5**: Middleware para permitir solicitudes cross-origin
- **dotenv 16.3.1**: Variables de entorno

## 📁 Estructura del Proyecto

```
cursos_inacap/
├── config/                  # Configuración
│   ├── database.js          # Conexión a MongoDB
│   └── multer.js            # Configuración de subida de archivos
├── models/                  # Modelos de datos
│   └── Curso.js             # Modelo de Curso (Mongoose)
├── routes/                  # Rutas API
│   └── cursos.js            # Endpoints de cursos
├── scripts/                 # Scripts JavaScript
│   ├── api.js               # Cliente API
│   ├── app.js               # Lógica principal
│   ├── cursos.js            # Gestión de cursos (frontend)
│   ├── curso-detalle.js     # Detalle de curso
│   ├── admin-cursos.js      # Administración de cursos
│   ├── include.js           # Cargador de partials
│   ├── notificaciones.js    # Gestión de notificaciones
│   └── seed.js              # Script para poblar BD
├── uploads/                 # Archivos subidos (generado automáticamente)
│   ├── videos/              # Videos de cursos
│   ├── audios/              # Audios de cursos
│   └── images/              # Imágenes de cursos
├── partials/                # Componentes reutilizables
│   ├── header.html          # Encabezado
│   └── sidebar.html         # Barra lateral
├── Pictures/                # Recursos estáticos
├── index.html               # Dashboard principal
├── login.html               # Página de login
├── curso.html               # Página de detalle de curso
├── profile.html             # Perfil de usuario
├── settings.html            # Configuración
├── server.js                # Servidor Express
├── package.json             # Dependencias
├── .env.example             # Ejemplo de variables de entorno
└── README.md                # Este archivo
```

## 🚀 Instalación y Configuración

### Requisitos Previos

- **Node.js** (versión 14 o superior) - [Descargar](https://nodejs.org/)
- **npm** (incluido con Node.js)
- **MongoDB** (versión 4.4 o superior) - Ver instrucciones más abajo

### Instalación de MongoDB

#### Windows

1. **Descargar MongoDB Community Server**
   - Visita: https://www.mongodb.com/try/download/community
   - Descarga la versión para Windows
   - Ejecuta el instalador `.msi`

2. **Instalación**
   - Durante la instalación, elige "Complete"
   - Marca "Install MongoDB as a Service"
   - Marca "Install MongoDB Compass" (opcional, interfaz gráfica)

3. **Verificar instalación**
   ```bash
   mongod --version
   ```

4. **Iniciar MongoDB**
   - MongoDB se inicia automáticamente como servicio en Windows
   - Si no está corriendo, ve a "Servicios" de Windows y busca "MongoDB"

#### macOS

1. **Usando Homebrew** (recomendado)
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   brew services start mongodb-community
   ```

2. **Verificar instalación**
   ```bash
   mongod --version
   ```

#### Linux (Ubuntu/Debian)

1. **Instalar MongoDB**
   ```bash
   # Importar clave pública
   wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
   
   # Agregar repositorio
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
   
   # Actualizar e instalar
   sudo apt-get update
   sudo apt-get install -y mongodb-org
   
   # Iniciar MongoDB
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

### Configuración del Proyecto

### 🚀 Inicio Rápido (Recomendado)

**Windows:**
```bash
# Doble clic en start.bat o ejecutar:
npm run setup
```

**Linux/macOS:**
```bash
./start.sh
# O:
npm run setup
```

El script automático verifica dependencias, configura el entorno y pregunta si deseas poblar datos de prueba.

### Pasos de Instalación Manual

1. **Clonar o descargar el proyecto**
   ```bash
   cd cursos_inacap
   ```

2. **Instalar dependencias de Node.js**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   # Copiar el archivo de ejemplo
   cp .env.example .env
   
   # Editar .env con tu configuración
   # Para desarrollo local, la configuración por defecto es:
   MONGODB_URI=mongodb://localhost:27017/cursos_inacap
   PORT=3000
   NODE_ENV=development
   ```

4. **Poblar la base de datos con datos iniciales** (opcional)
   ```bash
   npm run seed
   ```

5. **Iniciar el servidor**
   ```bash
   npm start
   # O para desarrollo con auto-reload:
   npm run dev
   ```

6. **Acceder a la aplicación**
   - Abrir el navegador en: `http://localhost:3000`
   - La página de inicio será `login.html`

## 📚 Base de Datos MongoDB

### Estructura de Datos

La aplicación utiliza MongoDB con el siguiente esquema:

#### Colección: `cursos`

```javascript
{
  titulo: String (requerido),
  descripcion: String (requerido),
  imagen: String,
  profesor: {
    nombre: String (requerido),
    avatar: String,
    descripcion: String
  },
  categoria: String,
  nivel: String (Principiante | Intermedio | Avanzado),
  idioma: String,
  duracionTotal: Number, // en horas
  calificacion: Number (0-5),
  numValoraciones: Number,
  precio: Number,
  activo: Boolean,
  secciones: [{
    titulo: String (requerido),
    descripcion: String,
    orden: Number (requerido),
    tieneExamen: Boolean,
    lecciones: [{
      titulo: String (requerido),
      descripcion: String,
      tipo: String (video | audio | texto | archivo),
      urlVideo: String,
      urlAudio: String,
      urlArchivo: String,
      duracion: Number, // en minutos
      orden: Number (requerido),
      completado: Boolean
    }]
  }],
  estudiantesInscritos: Number,
  fechaCreacion: Date,
  fechaActualizacion: Date
}
```

### Comandos Útiles de MongoDB

```bash
# Conectar a MongoDB desde terminal
mongosh

# Usar la base de datos
use cursos_inacap

# Ver todas las colecciones
show collections

# Ver todos los cursos
db.cursos.find().pretty()

# Contar cursos
db.cursos.countDocuments()

# Eliminar todos los cursos
db.cursos.deleteMany({})
```

## 🔌 API REST

### Endpoints Disponibles

#### Cursos

- **GET** `/api/cursos` - Obtener todos los cursos
- **GET** `/api/cursos/:id` - Obtener un curso por ID
- **POST** `/api/cursos` - Crear un nuevo curso
- **PUT** `/api/cursos/:id` - Actualizar un curso
- **DELETE** `/api/cursos/:id` - Eliminar un curso (soft delete)

#### Secciones

- **POST** `/api/cursos/:cursoId/secciones` - Agregar sección a un curso
- **PUT** `/api/cursos/:cursoId/secciones/:seccionId` - Actualizar sección
- **DELETE** `/api/cursos/:cursoId/secciones/:seccionId` - Eliminar sección

#### Lecciones

- **POST** `/api/cursos/:cursoId/secciones/:seccionId/lecciones` - Agregar lección
- **PUT** `/api/cursos/:cursoId/secciones/:seccionId/lecciones/:leccionId` - Actualizar lección
- **DELETE** `/api/cursos/:cursoId/secciones/:seccionId/lecciones/:leccionId` - Eliminar lección

### Ejemplos de Uso

#### Crear un curso

```javascript
const formData = new FormData();
formData.append('titulo', 'Nuevo Curso');
formData.append('descripcion', 'Descripción del curso');
formData.append('profesorNombre', 'Juan Pérez');
formData.append('imagen', fileInput.files[0]); // archivo opcional

fetch('http://localhost:3000/api/cursos', {
  method: 'POST',
  body: formData
});
```

#### Agregar una lección con video

```javascript
const formData = new FormData();
formData.append('titulo', 'Lección 1');
formData.append('descripcion', 'Descripción de la lección');
formData.append('tipo', 'video');
formData.append('orden', '1');
formData.append('video', videoFile); // archivo de video

fetch('http://localhost:3000/api/cursos/:cursoId/secciones/:seccionId/lecciones', {
  method: 'POST',
  body: formData
});
```

## 📤 Sistema de Subida de Archivos

### Formatos Soportados

- **Videos**: MP4, WebM, OGG, MOV (máximo 500MB)
- **Audios**: MP3, WAV, OGG, WebM (máximo 500MB)
- **Imágenes**: JPG, PNG, GIF, WebP

### Ubicación de Archivos

Los archivos se almacenan en:
- Videos: `uploads/videos/`
- Audios: `uploads/audios/`
- Imágenes: `uploads/images/`

Los archivos son accesibles públicamente en:
- `http://localhost:3000/uploads/videos/[nombre-archivo]`
- `http://localhost:3000/uploads/audios/[nombre-archivo]`
- `http://localhost:3000/uploads/images/[nombre-archivo]`

## 🌐 Despliegue en Servidor

### Preparación para Producción

1. **Configurar variables de entorno**
   ```env
   MONGODB_URI=mongodb://usuario:contraseña@servidor:27017/cursos_inacap
   PORT=3000
   NODE_ENV=production
   ```

2. **MongoDB en Servidor Remoto**

   **Opción A: MongoDB Atlas (Cloud)**
   - Crear cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Crear un cluster gratuito
   - Obtener la URI de conexión
   - Actualizar `MONGODB_URI` en `.env`

   **Opción B: Servidor Dedicado**
   - Instalar MongoDB en el servidor
   - Configurar acceso remoto
   - Actualizar `MONGODB_URI` en `.env`

3. **Migrar Base de Datos Local a Remota**

   ```bash
   # Exportar desde local
   mongodump --uri="mongodb://localhost:27017/cursos_inacap" --out=./backup
   
   # Importar a remoto
   mongorestore --uri="mongodb://usuario:contraseña@servidor:27017/cursos_inacap" ./backup/cursos_inacap
   ```

4. **Migrar Archivos Subidos**

   ```bash
   # Comprimir carpeta uploads
   tar -czf uploads.tar.gz uploads/
   
   # Transferir al servidor (usando SCP)
   scp uploads.tar.gz usuario@servidor:/ruta/aplicacion/
   
   # En el servidor, descomprimir
   tar -xzf uploads.tar.gz
   ```

5. **Configurar Servidor Web**

   **Con PM2 (recomendado)**
   ```bash
   npm install -g pm2
   pm2 start server.js --name cursos-inacap
   pm2 save
   pm2 startup
   ```

   **Con Nginx como proxy reverso**
   ```nginx
   server {
       listen 80;
       server_name tu-dominio.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Consideraciones de Seguridad

- ✅ Cambiar `MONGODB_URI` en producción
- ✅ Configurar CORS apropiadamente
- ✅ Usar HTTPS en producción
- ✅ Implementar autenticación real
- ✅ Validar y sanitizar inputs
- ✅ Limitar tamaño de archivos
- ✅ Configurar backups automáticos de MongoDB

## 📱 Funcionalidades

### 1. Sistema de Autenticación
- **Página de Login** (`login.html`)
  - Formulario de inicio de sesión (no funcional - solo UI)

### 2. Dashboard Principal (`index.html`)
- **Carga dinámica de cursos desde MongoDB**
- **Vista de Cursos Activos** con progreso
- **Sección de Otros Cursos**
- **Navegación a detalles de curso**

### 3. Página de Curso (`curso.html`)
- **Carga dinámica de información del curso**
- **Visualización de secciones y lecciones**
- **Reproductor de videos y audios**
- **Información del instructor**

### 4. API de Cursos
- **CRUD completo de cursos**
- **Gestión de secciones y lecciones**
- **Subida de archivos multimedia**

## 🧪 Uso de la Aplicación

1. **Iniciar MongoDB**
   ```bash
   # Windows (si no está como servicio)
   net start MongoDB
   
   # macOS/Linux
   brew services start mongodb-community
   # o
   sudo systemctl start mongod
   ```

2. **Iniciar el servidor**
   ```bash
   npm start
   ```

3. **Poblar datos iniciales** (primera vez)
   ```bash
   node scripts/seed.js
   ```

4. **Acceder a la aplicación**
   - Abrir: `http://localhost:3000`
   - Ir a `login.html` y hacer clic en "Iniciar Sesión"
   - Ver cursos en el dashboard

## 📦 Dependencias

```json
{
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^5.1.0",
    "socket.io": "^4.8.1",
    "socket.io-client": "^4.8.1",
    "mongoose": "^8.0.3",
    "multer": "^1.4.5-lts.1",
    "dotenv": "^16.3.1",
    "path": "^0.12.7",
    "fs-extra": "^11.2.0"
  }
}
```

## 🔧 Scripts Disponibles

```bash
npm start          # Iniciar servidor
npm run dev        # Iniciar con nodemon (auto-reload)
npm run setup      # Inicio automático completo (verifica todo)
npm run seed       # Poblar base de datos con datos iniciales
npm test           # Alias de npm run setup
```

### Scripts de Inicio Rápido

- **Windows**: `start.bat` - Doble clic o ejecutar desde terminal
- **Linux/macOS**: `start.sh` - Ejecutar `./start.sh`

Estos scripts verifican automáticamente:
- ✅ Instalación de dependencias
- ✅ Archivo .env
- ✅ Conexión a MongoDB
- ✅ Carpetas necesarias
- ✅ Opción de poblar datos de prueba

## 📝 Funciones JavaScript Disponibles

### API (scripts/api.js)
- `cursosAPI.getAll()` - Obtener todos los cursos
- `cursosAPI.getById(id)` - Obtener curso por ID
- `cursosAPI.create(data, imagenFile)` - Crear curso
- `cursosAPI.update(id, data, imagenFile)` - Actualizar curso
- `cursosAPI.delete(id)` - Eliminar curso
- `cursosAPI.addLeccion(cursoId, seccionId, data, videoFile, audioFile)` - Agregar lección

Ver `scripts/admin-cursos.js` para más funciones de administración.

## 🐛 Solución de Problemas

### MongoDB no se conecta

```bash
# Verificar que MongoDB está corriendo
# Windows
net start MongoDB

# macOS
brew services list

# Linux
sudo systemctl status mongod
```

### Error al subir archivos

- Verificar que la carpeta `uploads/` existe
- Verificar permisos de escritura
- Verificar tamaño máximo del archivo (500MB)

### Cursos no se muestran

- Verificar conexión a MongoDB
- Ejecutar `node scripts/seed.js` para poblar datos
- Verificar consola del navegador para errores

## 📄 Licencia

Este proyecto es propiedad de INACAP.

## 👥 Autor

Desarrollado para INACAP - Plataforma de Cursos Online

## 📞 Soporte

Para soporte técnico, contactar al equipo de desarrollo de INACAP.

---

**Versión**: 2.0.0  
**Última actualización**: 2024
