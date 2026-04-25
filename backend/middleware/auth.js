const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const authHeader = req.header('Authorization');

  //  No hay token
  if (!authHeader) {
    return res.status(401).json({ msg: 'Acceso denegado. No hay token.' });
  }

  try {
    //  IMPORTANTE: formato "Bearer TOKEN"
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : authHeader;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // { id, role, ... }
    next();

  } catch (err) {
    return res.status(401).json({ msg: 'Token inválido' });
  }
};