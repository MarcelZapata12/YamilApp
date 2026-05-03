const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

const SECRET = process.env.JWT_SECRET;

function normalizeEmail(value = '') {
  return value.trim().toLowerCase();
}

function getTokenFromHeader(authHeader = '') {
  return authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : authHeader;
}

function buildPublicUser(user) {
  return {
    _id: user._id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  };
}

// =======================
// TEST
// =======================
router.get('/test', (req, res) => {
  res.send('AUTH FUNCIONANDO');
});

// =======================
// REGISTER
// =======================
router.post('/register', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Faltan datos' });
    }

    const existe = await User.findOne({ email });
    if (existe) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hash,
      role: 'usuario'
    });

    await user.save();

    res.status(201).json({ message: 'Usuario creado correctamente' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    res.status(500).json({ error: err.message });
  }
});

// =======================
// LISTAR USUARIOS (ADMIN)
// =======================
router.get('/users', auth, role('admin'), async (req, res) => {
  try {
    const users = await User.find()
      .select('email role createdAt')
      .sort({ createdAt: -1, email: 1 });

    res.json(users.map(buildPublicUser));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// LOGIN
// =======================
router.post('/login', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Usuario no existe' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: 'Contrasena incorrecta' });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      role: user.role,
      email: user.email
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// GET USER (VALIDAR TOKEN)
// =======================
router.get('/me', async (req, res) => {
  try {
    const token = getTokenFromHeader(req.header('Authorization'));

    if (!token) {
      return res.status(401).json({ error: 'No token' });
    }

    const decoded = jwt.verify(token, SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'Usuario no existe' });
    }

    res.json(buildPublicUser(user));
  } catch (err) {
    res.status(401).json({ error: 'Token invalido' });
  }
});

module.exports = router;
