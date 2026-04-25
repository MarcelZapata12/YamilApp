module.exports = function (roles = []) {

  // Permitir string o array
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    try {

      // No autenticado
      if (!req.user) {
        return res.status(401).json({ msg: 'No autenticado' });
      }

      // No tiene rol requerido
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ msg: 'No autorizado' });
      }

      next();

    } catch (error) {
      console.error('Error en middleware role:', error);
      res.status(500).json({ msg: 'Error del servidor' });
    }
  };
};