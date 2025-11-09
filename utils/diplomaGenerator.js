const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs-extra');
const { diplomasDir } = require('../config/multer');

function slugify(text) {
  return text
    .toString()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

async function generarDiploma({ usuario, curso, porcentaje, fecha = new Date() }) {
  await fs.ensureDir(diplomasDir);

  const nombreCurso = curso?.titulo || 'Curso';
  const nombreUsuario = usuario?.nombre && usuario?.apellido
    ? `${usuario.nombre} ${usuario.apellido}`
    : usuario?.nombre || usuario?.email || 'Estudiante';

  const fileBase = `diploma-${slugify(nombreUsuario)}-${slugify(nombreCurso)}-${Date.now()}.pdf`;
  const rutaAbsoluta = path.join(diplomasDir, fileBase);
  const rutaRelativa = path.join('uploads', 'diplomas', fileBase);
  const archivoPublico = `/uploads/diplomas/${fileBase}`;

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 40
    });

    const stream = fs.createWriteStream(rutaAbsoluta);
    doc.pipe(stream);

    // Fondo suave
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f7f7f7');

    // Marco
    doc
      .lineWidth(4)
      .strokeColor('#C0A46B')
      .rect(30, 30, doc.page.width - 60, doc.page.height - 60)
      .stroke();

    doc.fillColor('#C0A46B')
      .fontSize(28)
      .font('Helvetica-Bold')
      .text('Certificado de Finalización', { align: 'center', underline: false });

    doc.moveDown(1.5);

    doc.fillColor('#333333')
      .fontSize(18)
      .font('Helvetica')
      .text('Se otorga el presente diploma a', { align: 'center' });

    doc.moveDown(0.5);

    doc.fillColor('#111111')
      .fontSize(32)
      .font('Helvetica-Bold')
      .text(nombreUsuario.toUpperCase(), { align: 'center' });

    doc.moveDown(0.75);

    doc.fillColor('#333333')
      .fontSize(18)
      .font('Helvetica')
      .text('por haber completado satisfactoriamente el curso', { align: 'center' });

    doc.moveDown(0.5);

    doc.fillColor('#111111')
      .fontSize(24)
      .font('Helvetica-Bold')
      .text(`"${nombreCurso}"`, { align: 'center' });

    doc.moveDown(1);

    doc.fillColor('#444444')
      .fontSize(16)
      .font('Helvetica')
      .text(`Porcentaje obtenido: ${porcentaje != null ? `${porcentaje}%` : 'N/A'}`, { align: 'center' });

    doc.moveDown(2);

    const fechaTexto = fecha instanceof Date ? fecha.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : fecha;

    doc.fillColor('#444444')
      .fontSize(14)
      .font('Helvetica')
      .text(`Emitido el ${fechaTexto}`, 0, doc.page.height - 140, { align: 'center' });

    doc.moveDown(2);

    doc
      .moveDown(1)
      .fontSize(12)
      .fillColor('#999999')
      .text('Este diploma certifica que el estudiante ha completado todos los requisitos del curso.', {
        align: 'center',
        width: doc.page.width - 160,
        continued: false
      });

    doc.end();

    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return {
    rutaAbsoluta,
    rutaRelativa,
    archivoPublico,
    archivoNombre: path.basename(rutaAbsoluta)
  };
}

module.exports = generarDiploma;

