const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

// Importar configuración de base de datos
const connectDB = require('./config/database');

// Modelos
const Notificacion = require('./models/Notificacion');
const Usuario = require('./models/Usuario');

// Importar rutas
const cursosRoutes = require('./routes/cursos');
const authRoutes = require('./routes/auth');
const inscripcionesRoutes = require('./routes/inscripciones');
const notificacionesRoutes = require('./routes/notificaciones');
const mediaRoutes = require('./routes/media');

const app = express();

// Middleware CORS - debe estar ANTES de las sesiones
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar sesiones - DESPUÉS de CORS y body parsers
app.use(session({
  secret: process.env.SESSION_SECRET || 'cursos-inacap-secret-key-change-in-production',
  resave: true, // Cambiar a true para asegurar que se guarde
  saveUninitialized: true, // Cambiar a true para crear sesión incluso si no hay datos
  name: 'sessionId', // Nombre de la cookie de sesión
  cookie: {
    secure: false, // Cambiar a true solo en HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    sameSite: 'lax', // Ayuda con CORS y cookies
    path: '/' // Asegurar que la cookie esté disponible en toda la aplicación
  },
  rolling: true // Renovar la cookie en cada request
}));

// 🔌 Conectar a MongoDB
connectDB();

// 📡 Rutas API - DEBEN estar ANTES de las rutas estáticas
app.use('/api/cursos', cursosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/inscripciones', inscripcionesRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/examenes', require('./routes/examenes'));

// 🟢 Servir archivos estáticos (HTML, CSS, JS) - DESPUÉS de las rutas API
app.use(express.static(path.join(__dirname)));

// 🟢 Servir archivos subidos (videos, audios, imágenes)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Redirigir raíz a login si no está autenticado
app.get('/', (req, res) => {
  if (!req.session.usuario) {
    return res.redirect('/login.html');
  }
  res.redirect('/index.html');
});

// 🧠 Crear servidor HTTP y conectar con Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 💬 Eventos en tiempo real
io.on('connection', async (socket) => {
  console.log('🟢 Usuario conectado:', socket.id);

  socket.on('diploma_emitido', async (data) => {
    console.log('🎓 Diploma emitido:', data);
    
    // Guardar notificación en BD si hay usuario
    if (data.usuarioId) {
      try {
        const notificacion = await Notificacion.create({
          usuario: data.usuarioId,
          titulo: 'Diploma emitido',
          mensaje: data.mensaje || 'Diploma disponible para descarga',
          tipo: 'diploma',
          link: data.link || '/profile.html'
        });

        await Usuario.findByIdAndUpdate(
          data.usuarioId,
          {
            $push: {
              notificacionesNoLeidas: {
                notificacion: notificacion._id,
                titulo: notificacion.titulo,
                mensaje: notificacion.mensaje,
                tipo: notificacion.tipo,
                link: notificacion.link,
                fecha: notificacion.fechaCreacion
              }
            }
          }
        );
      } catch (error) {
        console.error('Error al guardar notificación:', error);
      }
    }
    
    io.emit('notificacion_diploma', data);
  });

  socket.on('nuevo_curso', async (data) => {
    console.log('📚 Nuevo curso publicado:', data);
    
    // Si hay usuarios especificados, crear notificaciones para ellos
    if (data.usuariosIds && Array.isArray(data.usuariosIds)) {
      try {
        const notificaciones = data.usuariosIds.map(usuarioId => ({
          usuario: usuarioId,
          titulo: 'Nuevo curso disponible',
          mensaje: `Se ha publicado un nuevo curso: ${data.titulo}`,
          tipo: 'curso',
          link: data.link || `/curso.html?id=${data.cursoId}`
        }));
        const docs = await Notificacion.insertMany(notificaciones);

        await Promise.all(
          docs.map(notificacion =>
            Usuario.findByIdAndUpdate(
              notificacion.usuario,
              {
                $push: {
                  notificacionesNoLeidas: {
                    notificacion: notificacion._id,
                    titulo: notificacion.titulo,
                    mensaje: notificacion.mensaje,
                    tipo: notificacion.tipo,
                    link: notificacion.link,
                    fecha: notificacion.fechaCreacion
                  }
                }
              }
            )
          )
        );
      } catch (error) {
        console.error('Error al guardar notificaciones:', error);
      }
    }
    
    io.emit('notificacion_admin', data);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Usuario desconectado');
  });
});

// 🚀 Iniciar el servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📚 API disponible en http://localhost:${PORT}/api/cursos`);
});