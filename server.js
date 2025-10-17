const express = require('express');
const QRCode = require('qrcode');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(express.json());

// 🔹 Servir archivos estáticos desde la carpeta public
app.use(express.static('public'));

// 🔹 Fallback para la raíz "/"
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

let urls = {};

if (fs.existsSync('urls.json')) {
  urls = JSON.parse(fs.readFileSync('urls.json'));
}

app.post('/api/generar', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Falta la URL' });

  const id = Date.now().toString(36);
  urls[id] = url;
  fs.writeFileSync('urls.json', JSON.stringify(urls, null, 2));
  
  const baseURL = 'https://www.a.com/qr';
  const qrlink = `${baseURL}/r/${id}`;
  //const qrlink = `http://192.168.1.7:${port}/r/${id}`;
  const qrDataUrl = await QRCode.toDataURL(qrlink, {
  width: 800,               // 🔹 más grande (por defecto ~200)
  margin: 2,                // 🔹 espacio blanco alrededor
  errorCorrectionLevel: 'H' // 🔹 mayor redundancia (mejor escaneo)
  });
  res.json({ id, qrDataUrl });
});

app.get('/r/:id', (req, res) => {
  const { id } = req.params;
  const destino = urls[id];
  if (destino) res.redirect(destino);
  else res.status(404).send('QR no encontrado');
});

app.listen(port, () => {
  //console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});
