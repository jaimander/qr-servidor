const express = require('express');
const QRCode = require('qrcode');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// 🔹 Servir archivos estáticos desde la carpeta public
app.use(express.static('public'));

// 🔹 Fallback para la raíz "/"
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// 🔹 Cargar URLs previas desde urls.json
let urls = {};
const jsonPath = 'urls.json';
if (fs.existsSync(jsonPath)) {
  urls = JSON.parse(fs.readFileSync(jsonPath));
}

// 🔹 Endpoint para generar QR
app.post('/api/generar', async (req, res) => {
  let { url, customId } = req.body;

  if (!url) return res.status(400).json({ error: 'Falta la URL' });

  // Si no se da un ID personalizado, generar uno automático
  let id = customId ? customId.trim() : Date.now().toString(36);

  // Verificar que el ID no exista ya
  if (urls[id]) {
    return res.status(400).json({ error: 'El ID ya existe, elige otro' });
  }

  urls[id] = url;

  // Guardar en urls.json
  fs.writeFileSync(jsonPath, JSON.stringify(urls, null, 2));

  // 🔹 Generar el QR apuntando al servidor
  const baseURL = 'https://qr.dentrodelacaja.com'; // tu dominio
  const qrlink = new URL(`/r/${id}`, baseURL).toString();

  try {
    const qrDataUrl = await QRCode.toDataURL(qrlink, {
      width: 800,               // más grande
      margin: 2,                // espacio alrededor
      errorCorrectionLevel: 'H' // alta redundancia
    });

    res.json({ id, qrDataUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar el QR' });
  }
});

// 🔹 Endpoint de redirección
app.get('/r/:id', (req, res) => {
  const { id } = req.params;
  const destino = urls[id];
  if (destino) res.redirect(destino);
  else res.status(404).send('QR no encontrado');
});

// 🔹 Arrancar servidor
app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});
