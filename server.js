const express = require('express');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000; // Render usa process.env.PORT

app.use(express.json());

// 🔹 Servir archivos estáticos desde la carpeta public
app.use(express.static('public'));

// 🔹 Carpeta para guardar QR generados
const qrDir = path.join(__dirname, 'qrs');
if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir);

// 🔹 Fallback para la raíz "/"
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🔹 Keep-alive endpoint
app.get('/ping', (req, res) => {
  res.send('pong');
});

let urls = {};
if (fs.existsSync('urls.json')) {
  urls = JSON.parse(fs.readFileSync('urls.json'));
}

// 🔹 Endpoint para generar QR
app.post('/api/generar', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Falta la URL' });

  const id = Date.now().toString(36);
  urls[id] = { url };

  // Guardar en JSON
  fs.writeFileSync('urls.json', JSON.stringify(urls, null, 2));

  // 🔹 Generar QR solo si no existe
  const qrPath = path.join(qrDir, `${id}.png`);
  if (!fs.existsSync(qrPath)) {
    const baseURL = 'https://qr.dentrodelacaja.com'; // ✅ tu dominio
    const qrlink = new URL(`/r/${id}`, baseURL).toString();
    await QRCode.toFile(qrPath, qrlink, {
      width: 800,
      margin: 2,
      errorCorrectionLevel: 'H'
    });
  }

  // Enviar URL de la imagen
  const qrURL = `/qrs/${id}.png`;
  res.json({ id, qrDataUrl: qrURL });
});

// 🔹 Endpoint de redirección
app.get('/r/:id', (req, res) => {
  const { id } = req.params;
  const destino = urls[id]?.url;
  if (destino) res.redirect(destino);
  else res.status(404).send('QR no encontrado');
});

// 🔹 Servir QR generados
app.use('/qrs', express.static(qrDir));

app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en puerto ${port}`);
});
