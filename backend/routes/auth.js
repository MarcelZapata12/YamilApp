const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const {
  sendVerificationEmail,
  sendPasswordResetEmail
} = require('../utils/emailService');

const SECRET = process.env.JWT_SECRET;
const EMAIL_VERIFICATION_HOURS = 24;
const PASSWORD_RESET_MINUTES = 60;

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
    createdAt: user.createdAt,
    emailVerified: user.emailVerified !== false
  };
}

function createPlainToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function addHours(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function addMinutes(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function isEmailVerified(user) {
  return user.emailVerified !== false;
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
    const verificationToken = createPlainToken();

    const user = new User({
      email,
      password: hash,
      role: 'usuario',
      emailVerified: false,
      emailVerificationToken: hashToken(verificationToken),
      emailVerificationExpires: addHours(EMAIL_VERIFICATION_HOURS)
    });

    await user.save();
    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({
      message:
        'Cuenta creada. Revisa tu correo para verificarla antes de iniciar sesion.'
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    res.status(500).json({ error: err.message });
  }
});

// =======================
// REENVIAR VERIFICACION
// =======================
router.post('/resend-verification', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({ error: 'Debes indicar el correo' });
    }

    const user = await User.findOne({ email });

    if (!user || isEmailVerified(user)) {
      return res.json({
        message:
          'Si la cuenta existe y esta pendiente, se enviara un nuevo enlace de verificacion.'
      });
    }

    const verificationToken = createPlainToken();
    user.emailVerificationToken = hashToken(verificationToken);
    user.emailVerificationExpires = addHours(EMAIL_VERIFICATION_HOURS);
    await user.save();

    await sendVerificationEmail(email, verificationToken);

    res.json({
      message: 'Te enviamos un nuevo enlace de verificacion.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// VERIFICAR CORREO
// =======================
router.get('/verify-email', async (req, res) => {
  try {
    const token = String(req.query.token || '');

    if (!token) {
      return res.status(400).json({ error: 'Falta el token de verificacion' });
    }

    const user = await User.findOne({
      emailVerificationToken: hashToken(token),
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        error: 'El enlace de verificacion no es valido o ya vencio'
      });
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    res.json({ message: 'Correo verificado correctamente' });
  } catch (err) {
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

    if (!isEmailVerified(user)) {
      return res.status(403).json({
        error: 'Debes verificar tu correo antes de iniciar sesion'
      });
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
// OLVIDO DE CONTRASENA
// =======================
router.post('/forgot-password', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({ error: 'Debes indicar el correo' });
    }

    const user = await User.findOne({ email });

    if (user) {
      const resetToken = createPlainToken();
      user.passwordResetToken = hashToken(resetToken);
      user.passwordResetExpires = addMinutes(PASSWORD_RESET_MINUTES);
      await user.save();

      await sendPasswordResetEmail(email, resetToken);
    }

    res.json({
      message:
        'Si el correo existe, recibiras un enlace para restablecer la contrasena.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// RESTABLECER CONTRASENA
// =======================
router.post('/reset-password', async (req, res) => {
  try {
    const token = String(req.body.token || '');
    const { password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Faltan datos' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        error: 'La contrasena debe tener al menos 6 caracteres'
      });
    }

    const user = await User.findOne({
      passwordResetToken: hashToken(token),
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        error: 'El enlace para restablecer la contrasena no es valido o ya vencio'
      });
    }

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    res.json({ message: 'Contrasena actualizada correctamente' });
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
