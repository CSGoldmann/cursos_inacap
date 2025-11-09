const express = require('express');
const fs = require('fs');
const path = require('path');
const { videosDir, audiosDir } = require('../config/multer');

const router = express.Router();

const MIME_TYPES = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
  '.mov': 'video/quicktime',
  '.m4v': 'video/x-m4v',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.aac': 'audio/aac',
  '.oga': 'audio/ogg'
};

function streamMedia(req, res, baseDir) {
  const { filename } = req.params;
  const filePath = path.join(baseDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Archivo no encontrado' });
  }

  const fileStat = fs.statSync(filePath);
  const fileSize = fileStat.size;
  const range = req.headers.range;
  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || 'application/octet-stream';

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = (end - start) + 1;

    const file = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': contentType
    });
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': contentType
    });
    fs.createReadStream(filePath).pipe(res);
  }
}

router.get('/videos/:filename', (req, res) => {
  streamMedia(req, res, videosDir);
});

router.get('/audios/:filename', (req, res) => {
  streamMedia(req, res, audiosDir);
});

module.exports = router;

