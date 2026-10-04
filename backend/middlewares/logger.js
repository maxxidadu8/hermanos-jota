// Registra cada petición y permite continuar hacia las rutas.
function logger(req, res, next) {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
}

module.exports = logger;
