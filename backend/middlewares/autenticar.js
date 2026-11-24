const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const obtenerConfigJWT = require("../config/auth");

function errorHTTP(status, mensaje) {
  const error = new Error(mensaje);
  error.status = status;
  return error;
}

async function autenticar(req, res, next) {
  const authorization = req.get("Authorization");
  const coincidencia = typeof authorization === "string"
    ? /^Bearer\s+(\S+)$/i.exec(authorization.trim())
    : null;

  if (!coincidencia) {
    return next(errorHTTP(401, "Necesitás iniciar sesión para acceder."));
  }

  let config;
  try {
    config = obtenerConfigJWT();
  } catch {
    return next(errorHTTP(500, "No se pudo verificar la sesión."));
  }

  let payload;
  try {
    payload = jwt.verify(coincidencia[1], config.secret, {
      algorithms: [config.algorithm],
      issuer: config.issuer,
      audience: config.audience,
    });
    if (!payload || typeof payload !== "object" ||
        !mongoose.isObjectIdOrHexString(payload.sub) || !Number.isInteger(payload.exp)) {
      throw new Error("Claims de sesión inválidos");
    }
  } catch {
    return next(errorHTTP(401, "La sesión es inválida o venció. Iniciá sesión nuevamente."));
  }

  try {
    const usuario = await User.findById(payload.sub).select("_id nombre email");
    if (!usuario) {
      return next(errorHTTP(401, "La sesión es inválida o venció. Iniciá sesión nuevamente."));
    }
    // La identidad se obtiene del token verificado y de la base, nunca del body.
    req.usuario = { _id: usuario._id, nombre: usuario.nombre, email: usuario.email };
    next();
  } catch {
    // Una caída de MongoDB es un error de servicio, no una credencial incorrecta.
    next(errorHTTP(500, "No se pudo verificar la sesión."));
  }
}

module.exports = autenticar;
