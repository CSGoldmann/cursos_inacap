// scripts/verificar-mongodb.js
// Script para verificar e iniciar MongoDB en Windows

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando MongoDB...\n');

function ejecutarComando(comando) {
  try {
    const resultado = execSync(comando, { encoding: 'utf8', stdio: 'pipe' });
    return { exito: true, salida: resultado };
  } catch (error) {
    return { exito: false, error: error.message };
  }
}

// Verificar si MongoDB está instalado
console.log('1. Verificando si MongoDB está instalado...');
const mongoPath = ejecutarComando('where mongod');
if (mongoPath.exito && mongoPath.salida.trim()) {
  console.log('   ✅ MongoDB está instalado');
  console.log('   📍 Ubicación:', mongoPath.salida.trim().split('\n')[0]);
} else {
  console.log('   ❌ MongoDB no está instalado o no está en el PATH');
  console.log('\n   📥 Para instalar MongoDB:');
  console.log('   1. Descarga MongoDB Community Server desde:');
  console.log('      https://www.mongodb.com/try/download/community');
  console.log('   2. Ejecuta el instalador .msi');
  console.log('   3. Durante la instalación, marca "Install MongoDB as a Service"');
  console.log('   4. Reinicia este script después de instalar\n');
  process.exit(1);
}

// Verificar si el servicio está corriendo
console.log('\n2. Verificando si el servicio MongoDB está corriendo...');
const servicioStatus = ejecutarComando('sc query MongoDB');
if (servicioStatus.exito) {
  if (servicioStatus.salida.includes('RUNNING')) {
    console.log('   ✅ Servicio MongoDB está corriendo');
    console.log('   ✅ MongoDB está listo para usar\n');
    process.exit(0);
  } else if (servicioStatus.salida.includes('STOPPED')) {
    console.log('   ⚠️  Servicio MongoDB está detenido');
    console.log('\n   🚀 Intentando iniciar MongoDB...');
    
    const inicio = ejecutarComando('net start MongoDB');
    if (inicio.exito || inicio.error.includes('ya se inició') || inicio.error.includes('already started')) {
      console.log('   ✅ MongoDB iniciado exitosamente\n');
      process.exit(0);
    } else {
      console.log('   ❌ No se pudo iniciar MongoDB automáticamente');
      console.log('\n   💡 Intenta iniciar manualmente:');
      console.log('      net start MongoDB');
      console.log('   O ejecuta como administrador:\n');
      process.exit(1);
    }
  } else {
    console.log('   ⚠️  Servicio MongoDB no encontrado');
    console.log('\n   💡 MongoDB puede estar instalado pero no como servicio');
    console.log('   Intenta iniciar MongoDB manualmente:');
    console.log('      mongod --dbpath "C:\\data\\db"');
    console.log('   O reinstala MongoDB marcando "Install MongoDB as a Service"\n');
    process.exit(1);
  }
} else {
  console.log('   ⚠️  No se pudo verificar el servicio (puede que no esté instalado como servicio)');
  console.log('\n   💡 Intenta iniciar MongoDB manualmente:');
  console.log('      mongod --dbpath "C:\\data\\db"');
  console.log('   O verifica que MongoDB esté instalado correctamente\n');
  process.exit(1);
}

