# 🚀 Inicio Rápido

Guía rápida para iniciar la aplicación Cursos INACAP.

## ⚡ Inicio Automático (Recomendado)

### Windows
```bash
# Doble clic en:
start.bat

# O desde la terminal:
npm run setup
```

### Linux/macOS
```bash
# Ejecutar:
./start.sh

# O desde npm:
npm run setup
```

El script automático:
- ✅ Verifica e instala dependencias
- ✅ Crea archivo .env si no existe
- ✅ Verifica conexión a MongoDB
- ✅ Crea carpetas necesarias
- ✅ Pregunta si deseas poblar datos de prueba
- ✅ Inicia el servidor

## 📋 Inicio Manual

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env si es necesario
# Por defecto usa: mongodb://localhost:27017/cursos_inacap
```

### 3. Verificar MongoDB

**Windows:**
```bash
net start MongoDB
```

**macOS:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

### 4. Poblar base de datos (opcional)
```bash
npm run seed
```

### 5. Iniciar servidor
```bash
npm start
```

## 🎯 Acceder a la aplicación

Una vez iniciado el servidor:
- Abre tu navegador en: `http://localhost:3000`
- Ve a `login.html` para iniciar sesión
- El dashboard mostrará los cursos disponibles

## 📚 Datos de Prueba

El script `seed.js` incluye 6 cursos completos:

1. **Fundamentos de Ciberseguridad** (6 secciones, 20+ lecciones)
2. **Ethical Hacking** (3 secciones)
3. **Pentesting** (2 secciones)
4. **Python para Análisis de Datos** (3 secciones)
5. **IA y Machine Learning** (3 secciones)
6. **Ciencia de Datos** (3 secciones)

Cada curso incluye:
- Información del profesor
- Múltiples secciones
- Lecciones organizadas
- Calificaciones y valoraciones
- Progreso de estudiantes

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

### Error al instalar dependencias
```bash
# Limpiar e instalar de nuevo
rm -rf node_modules package-lock.json
npm install
```

### Puerto 3000 ocupado
Edita `.env` y cambia el puerto:
```env
PORT=3001
```

## 📝 Scripts Disponibles

```bash
npm start          # Iniciar servidor
npm run dev        # Iniciar con auto-reload (requiere nodemon)
npm run setup      # Inicio automático completo
npm run seed       # Poblar base de datos
```

## ✅ Verificación

Después de iniciar, verifica:
1. ✅ MongoDB conectado (mensaje en consola)
2. ✅ Servidor corriendo en puerto 3000
3. ✅ Cursos visibles en el dashboard
4. ✅ API funcionando: `http://localhost:3000/api/cursos`

---

**¿Necesitas ayuda?** Revisa el README.md completo para más detalles.

