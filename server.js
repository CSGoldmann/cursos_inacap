const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// 🟢 Servir tus archivos HTML, CSS y JS desde la carpeta actual
app.use(express.static(path.join(__dirname)));

// 🧠 Crear servidor HTTP y conectar con Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 💬 Eventos en tiempo real
io.on('connection', (socket) => {
  console.log('🟢 Usuario conectado:', socket.id);

  socket.on('diploma_emitido', (data) => {
    console.log('🎓 Diploma emitido:', data);
    io.emit('notificacion_diploma', data);
  });

  socket.on('nuevo_curso', (data) => {
    console.log('📚 Nuevo curso publicado:', data);
    io.emit('notificacion_admin', data);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Usuario desconectado');
  });
});

// 🚀 Iniciar el servidor
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});