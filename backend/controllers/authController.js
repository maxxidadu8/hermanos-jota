const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const obtenerConfigJWT = require("../config/auth");

function errorHTTP(status, mensaje) {
  const error = new Error(mensaje);
  error.status = status;
  return error;
}

function validarCredenciales(body, registro = false) {
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      typeof body.email !== "string" || typeof body.password !== "string" ||
      (registro && typeof body.nombre !== "string")) {
    throw errorHTTP(400, "Enviá email y contraseña como texto, y nombre para registrarte.");
  }
  const email = body.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !body.password ||
      Buffer.byteLength(body.password, "utf8") > 72) {
    throw errorHTTP(400, "Revisá el email y la contraseña enviados.");
  }
  if (registro && (!body.nombre.trim() || body.password.length < 8)) {
    throw errorHTTP(400, "El nombre es obligatorio y la contraseña debe tener al menos 8 caracteres.");
  }
  return { email, password: body.password, ...(registro ? { nombre: body.nombre.trim() } : {}) };
}

function responderSesion(res, status, usuario, config) {
  const { secret, ...opciones } = config;
  const token = jwt.sign({}, secret, { ...opciones, subject: String(usuario._id) });
  res.set("Cache-Control", "no-store");
  res.status(status).json({
    token,
    usuario: { _id: usuario._id, nombre: usuario.nombre, email: usuario.email },
  });
}

async function registrar(req, res, next) {
  try {
    const datos = validarCredenciales(req.body, true);
    const config = obtenerConfigJWT();
    if (await User.exists({ email: datos.email })) {
      throw errorHTTP(409, "Ya existe una cuenta con ese email.");
    }
    const usuario = await User.create(datos);
    responderSesion(res, 201, usuario, config);
  } catch (error) {
    if (error.code === 11000) return next(errorHTTP(409, "Ya existe una cuenta con ese email."));
    if (error instanceof mongoose.Error.ValidationError) {
      return next(errorHTTP(400, "Datos de registro inválidos. Revisá nombre, email y contraseña."));
    }
    // No propagar errores del driver que puedan contener el documento de usuario.
    next(error.status ? error : errorHTTP(500, "No se pudo registrar el usuario."));
  }
}

async function login(req, res, next) {
  try {
    const datos = validarCredenciales(req.body);
    const config = obtenerConfigJWT();
    const usuario = await User.findOne({ email: datos.email }).select("+password");
    if (!usuario || !(await usuario.compararPassword(datos.password))) {
      throw errorHTTP(401, "Email o contraseña incorrectos.");
    }
    responderSesion(res, 200, usuario, config);
  } catch (error) {
    next(error.status ? error : errorHTTP(500, "No se pudo iniciar sesión."));
  }
}

module.exports = { registrar, login };
