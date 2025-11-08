// routes/auth.js
const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');

// POST /api/auth/login - Iniciar sesión
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Buscar usuario
    const usuario = await Usuario.findOne({ email: email.toLowerCase() });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const passwordMatch = await usuario.comparePassword(password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar si está activo
    if (!usuario.activo) {
      return res.status(403).json({ error: 'Usuario desactivado' });
    }

    const progresoCursos = (usuario.progresoCursos || []).map(item => ({
      curso: item.curso ? item.curso.toString() : null,
      progreso: item.progreso || 0,
      actualizadoEn: item.actualizadoEn || usuario.fechaActualizacion || new Date()
    }));

    const notificacionesNoLeidas = (usuario.notificacionesNoLeidas || []).map(item => ({
      notificacion: item.notificacion ? item.notificacion.toString() : null,
      titulo: item.titulo,
      mensaje: item.mensaje,
      tipo: item.tipo,
      link: item.link,
      fecha: item.fecha || new Date()
    }));

    // Guardar sesión (sin password)
    req.session.usuario = {
      id: usuario._id,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      nombreCompleto: `${usuario.nombre} ${usuario.apellido}`,
      fotoPerfil: usuario.fotoPerfil,
      rol: usuario.rol,
      cursosInscritos: (usuario.cursosInscritos || []).map(cursoId => cursoId.toString()),
      progresoCursos,
      notificacionesNoLeidas
    };

    // Guardar la sesión explícitamente
    req.session.save((err) => {
      if (err) {
        console.error('❌ Error al guardar sesión:', err);
        return res.status(500).json({ error: 'Error al guardar sesión' });
      }
      
      // Verificar que la sesión se guardó
      console.log('✅ Sesión guardada:', req.session.usuario);
      console.log('✅ Cookie de sesión ID:', req.sessionID);
      console.log('✅ Cookie config:', req.session.cookie);
      
      res.json({
        success: true,
        usuario: req.session.usuario
      });
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: error.message || 'Error al iniciar sesión' });
  }
});

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error al cerrar sesión' });
    }
    res.json({ success: true, message: 'Sesión cerrada' });
  });
});

// GET /api/auth/me - Obtener usuario actual
router.get('/me', (req, res) => {
  console.log('🔍 Verificando sesión - SessionID:', req.sessionID);
  console.log('🔍 Usuario en sesión:', req.session.usuario);
  console.log('🔍 Session completo:', req.session);
  
  if (req.session.usuario) {
    console.log('✅ Usuario autenticado encontrado');
    res.json({ usuario: req.session.usuario });
  } else {
    console.log('❌ No hay usuario en sesión');
    res.status(401).json({ error: 'No autenticado' });
  }
});

// POST /api/auth/register - Registrar nuevo usuario (opcional)
router.post('/register', async (req, res) => {
  try {
    const { email, password, nombre, apellido } = req.body;

    if (!email || !password || !nombre || !apellido) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({ email: email.toLowerCase() });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Crear nuevo usuario
    const nuevoUsuario = new Usuario({
      email: email.toLowerCase(),
      password,
      nombre,
      apellido,
      rol: 'estudiante'
    });

    await nuevoUsuario.save();

    // Guardar sesión automáticamente después del registro
    req.session.usuario = {
      id: nuevoUsuario._id,
      email: nuevoUsuario.email,
      nombre: nuevoUsuario.nombre,
      apellido: nuevoUsuario.apellido,
      nombreCompleto: `${nuevoUsuario.nombre} ${nuevoUsuario.apellido}`,
      fotoPerfil: nuevoUsuario.fotoPerfil,
      rol: nuevoUsuario.rol,
      cursosInscritos: [],
      progresoCursos: [],
      notificacionesNoLeidas: []
    };

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      usuario: {
        id: nuevoUsuario._id,
        email: nuevoUsuario.email,
        nombre: nuevoUsuario.nombre,
        apellido: nuevoUsuario.apellido,
        nombreCompleto: `${nuevoUsuario.nombre} ${nuevoUsuario.apellido}`,
        rol: nuevoUsuario.rol,
        cursosInscritos: [],
        progresoCursos: [],
        notificacionesNoLeidas: []
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    res.status(500).json({ error: error.message || 'Error al registrar usuario' });
  }
});

module.exports = router;

