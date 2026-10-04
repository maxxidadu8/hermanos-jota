// Express reconoce los manejadores de errores por sus cuatro parámetros.
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const status = Number.isInteger(err.status) && err.status >= 400 && err.status <= 599
    ? err.status
    : 500;

  let message;
  if (status >= 500) {
    console.error(err);
    message = "Error interno del servidor";
  } else if (err.type === "entity.parse.failed") {
    message = "JSON inválido en el cuerpo de la petición";
  } else {
    message = err.message || "Solicitud inválida";
  }

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
