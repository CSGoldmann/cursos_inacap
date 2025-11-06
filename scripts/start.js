// scripts/start.js
// Script para iniciar la aplicación con verificaciones

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando aplicación Cursos INACAP...\n');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Verificar si existe .env
function checkEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  
  if (!fs.existsSync(envPath)) {
    log('⚠️  Archivo .env no encontrado', 'yellow');
    
    if (fs.existsSync(envExamplePath)) {
      log('📝 Creando .env desde .env.example...', 'blue');
      const envExample = fs.readFileSync(envExamplePath, 'utf8');
      fs.writeFileSync(envPath, envExample);
      log('✅ Archivo .env creado exitosamente', 'green');
    } else {
      log('❌ Archivo .env.example no encontrado', 'red');
      log('📝 Creando .env con valores por defecto...', 'blue');
      const defaultEnv = `MONGODB_URI=mongodb://localhost:27017/cursos_inacap
PORT=3000
NODE_ENV=development
`;
      fs.writeFileSync(envPath, defaultEnv);
      log('✅ Archivo .env creado', 'green');
    }
  } else {
    log('✅ Archivo .env encontrado', 'green');
  }
}

// Verificar si node_modules existe
function checkNodeModules() {
  const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  
  // Verificar si existe package.json
  if (!fs.existsSync(packageJsonPath)) {
    log('❌ package.json no encontrado', 'red');
    process.exit(1);
  }
  
  // Verificar si node_modules existe y tiene dependencias instaladas
  if (!fs.existsSync(nodeModulesPath)) {
    log('⚠️  node_modules no encontrado', 'yellow');
    log('📦 Instalando dependencias...', 'blue');
    
    try {
      execSync('npm install', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
        shell: true
      });
      log('✅ Dependencias instaladas', 'green');
    } catch (error) {
      log('❌ Error al instalar dependencias', 'red');
      log('   Por favor ejecuta manualmente: npm install', 'yellow');
      process.exit(1);
    }
  } else {
    // Verificar que al menos algunas dependencias críticas estén instaladas
    const dotenvPath = path.join(nodeModulesPath, 'dotenv');
    const mongoosePath = path.join(nodeModulesPath, 'mongoose');
    const expressPath = path.join(nodeModulesPath, 'express');
    
    if (!fs.existsSync(dotenvPath) || !fs.existsSync(expressPath)) {
      log('⚠️  Faltan algunas dependencias', 'yellow');
      log('📦 Reinstalando dependencias...', 'blue');
      
      try {
        execSync('npm install', { 
          stdio: 'inherit',
          cwd: path.join(__dirname, '..'),
          shell: true
        });
        log('✅ Dependencias instaladas', 'green');
      } catch (error) {
        log('❌ Error al instalar dependencias', 'red');
        log('   Por favor ejecuta manualmente: npm install', 'yellow');
        process.exit(1);
      }
    } else {
      log('✅ Dependencias instaladas', 'green');
    }
  }
}

// Verificar conexión a MongoDB
async function checkMongoDB() {
  return new Promise((resolve) => {
    log('🔍 Verificando conexión a MongoDB...', 'blue');
    
    try {
      // Intentar cargar mongoose solo si está instalado
      const mongoose = require('mongoose');
      require('dotenv').config();
      
      const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cursos_inacap';
      
      mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 3000
      }).then(() => {
        log('✅ MongoDB conectado exitosamente', 'green');
        mongoose.connection.close();
        resolve(true);
    }).catch((error) => {
      log('❌ No se pudo conectar a MongoDB', 'red');
      log(`   Error: ${error.message}`, 'yellow');
      
      // Detectar si es Windows
      const isWindows = process.platform === 'win32';
      
      log('\n💡 Soluciones:', 'cyan');
      if (isWindows) {
        log('   1. Verifica que MongoDB esté instalado', 'cyan');
        log('   2. Inicia MongoDB como administrador:', 'cyan');
        log('      net start MongoDB', 'cyan');
        log('   3. O ejecuta: node scripts/verificar-mongodb.js', 'cyan');
      } else {
        log('   1. macOS: brew services start mongodb-community', 'cyan');
        log('   2. Linux: sudo systemctl start mongod', 'cyan');
      }
      log('   4. Verifica la URI en .env: ' + mongoURI, 'cyan');
      log('\n⚠️  Continuando sin MongoDB. La aplicación funcionará pero no podrás usar la base de datos.', 'yellow');
      log('   Puedes iniciar MongoDB después y ejecutar: npm run seed', 'yellow');
      resolve(false);
    });
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        log('⚠️  Mongoose no está instalado aún', 'yellow');
        log('   Se verificará MongoDB después de instalar dependencias', 'cyan');
        resolve(false);
      } else {
        log('❌ Error al verificar MongoDB: ' + error.message, 'red');
        resolve(false);
      }
    }
  });
}

// Verificar si existe la carpeta uploads
function checkUploadsFolder() {
  const uploadsPath = path.join(__dirname, '..', 'uploads');
  const videosPath = path.join(uploadsPath, 'videos');
  const audiosPath = path.join(uploadsPath, 'audios');
  const imagesPath = path.join(uploadsPath, 'images');
  
  if (!fs.existsSync(uploadsPath)) {
    log('📁 Creando carpeta uploads...', 'blue');
    fs.mkdirSync(uploadsPath, { recursive: true });
    fs.mkdirSync(videosPath, { recursive: true });
    fs.mkdirSync(audiosPath, { recursive: true });
    fs.mkdirSync(imagesPath, { recursive: true });
    log('✅ Carpetas de uploads creadas', 'green');
  } else {
    log('✅ Carpetas de uploads existen', 'green');
  }
}

// Preguntar si poblar base de datos
function askToSeed() {
  return new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('\n❓ ¿Deseas poblar la base de datos con datos de prueba? (s/n): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 's' || answer.toLowerCase() === 'si' || answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Ejecutar seed
async function runSeed() {
  log('\n🌱 Poblando base de datos...', 'blue');
  try {
    execSync('node scripts/seed.js', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    log('✅ Base de datos poblada exitosamente', 'green');
  } catch (error) {
    log('⚠️  Error al poblar base de datos (puede que ya existan datos)', 'yellow');
  }
}

// Iniciar servidor
function startServer() {
  log('\n🚀 Iniciando servidor...\n', 'blue');
  log('📝 El servidor estará disponible en: http://localhost:3000\n', 'cyan');
  log('⏹️  Presiona Ctrl+C para detener el servidor\n', 'yellow');
  
  // Verificar que el servidor existe
  const serverPath = path.join(__dirname, '..', 'server.js');
  if (!fs.existsSync(serverPath)) {
    log('❌ server.js no encontrado', 'red');
    process.exit(1);
  }
  
  // Verificar que las dependencias críticas estén instaladas
  const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
  const dotenvPath = path.join(nodeModulesPath, 'dotenv');
  
  if (!fs.existsSync(dotenvPath)) {
    log('❌ Las dependencias no están completamente instaladas', 'red');
    log('   Por favor ejecuta: npm install', 'yellow');
    process.exit(1);
  }
  
  // Iniciar servidor sin shell para evitar el warning de seguridad
  const server = spawn('node', ['server.js'], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    shell: false
  });
  
  server.on('error', (error) => {
    log(`❌ Error al iniciar servidor: ${error.message}`, 'red');
    if (error.code === 'ENOENT') {
      log('   Node.js no está instalado o no está en el PATH', 'yellow');
    }
    process.exit(1);
  });
  
  server.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      log(`\n⚠️  El servidor se detuvo con código: ${code}`, 'yellow');
    }
  });
  
  process.on('SIGINT', () => {
    log('\n\n🛑 Deteniendo servidor...', 'yellow');
    server.kill('SIGINT');
    setTimeout(() => {
      if (!server.killed) {
        server.kill('SIGTERM');
      }
      process.exit(0);
    }, 1000);
  });
  
  process.on('SIGTERM', () => {
    server.kill('SIGTERM');
    process.exit(0);
  });
}

// Función principal
async function main() {
  try {
    // Verificaciones iniciales
    checkEnvFile();
    checkNodeModules(); // Esto instala dependencias si no existen
    checkUploadsFolder();
    
    // Verificar MongoDB después de instalar dependencias (no bloqueante)
    const mongoConnected = await checkMongoDB();
    
    // Preguntar si poblar BD solo si MongoDB está conectado
    if (mongoConnected) {
      const shouldSeed = await askToSeed();
      if (shouldSeed) {
        await runSeed();
      }
    } else {
      log('\n⚠️  MongoDB no está disponible. Puedes iniciar el servidor pero necesitarás MongoDB para usar la aplicación.', 'yellow');
      log('   Puedes poblar datos después con: npm run seed\n', 'cyan');
    }
    
    // Iniciar servidor
    startServer();
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

main();

