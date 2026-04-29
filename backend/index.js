require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const PORT = Number(process.env.PORT) || 5000;
const allowedOrigins = FRONTEND_URL.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  return (
    allowedOrigins.includes(origin) ||
    origin === 'http://localhost:3000' ||
    origin.endsWith('.vercel.app')
  );
}

// ================= VALIDAR VARIABLES DE ENTORNO =================
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error(' Faltan variables de entorno (MONGO_URI o JWT_SECRET)');
  process.exit(1);
}

// ================= MIDDLEWARES =================
app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origen no permitido por CORS'));
    },
    credentials: true
  })
);

app.use(express.json());

// ================= RUTAS =================
app.use('/api/articulos', require('./routes/articulos'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/eventos', require('./routes/eventos'));
app.use('/api/libros', require('./routes/libros'));
app.use('/api/configuracion-sitio', require('./routes/configuracionSitio'));

// ================= TEST =================
app.get('/api/auth/test', (req, res) => {
  res.send(' API funcionando correctamente');
});

// ================= DB =================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log(' MongoDB conectado'))
  .catch((err) => {
    console.error(' Error de MongoDB:', err.message);
    process.exit(1);
  });

mongoose.connection.once('open', () => {
  console.log(' Conexion real a Mongo establecida');
});

// ================= MANEJO GLOBAL DE ERRORES =================
app.use((err, req, res, next) => {
  console.error(' ERROR:', err.message);

  res.status(500).json({
    error: 'Error interno del servidor'
  });
});

// ================= SERVER =================
app.listen(PORT, () => {
  console.log(` Servidor corriendo en http://localhost:${PORT}`);
});
