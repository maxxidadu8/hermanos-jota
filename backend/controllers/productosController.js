const mongoose = require("mongoose");
const Product = require("../models/Product");

async function listarProductos(req, res, next) {
  try {
    const productos = await Product.find();
    res.json(productos);
  } catch (error) {
    next(error);
  }
}

async function obtenerProductoPorId(req, res, next) {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    const error = new Error("ID de producto inválido");
    error.status = 400;
    return next(error);
  }

  try {
    const producto = await Product.findById(req.params.id);

    if (!producto) {
      const error = new Error("Producto no encontrado");
      error.status = 404;
      return next(error);
    }

    res.json(producto);
  } catch (error) {
    next(error);
  }
}

async function crearProducto(req, res, next) {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    const error = new Error("El cuerpo debe ser un objeto JSON de producto");
    error.status = 400;
    return next(error);
  }

  const { nombre, descripcion, precio, stock, imagenUrl } = req.body;

  try {
    const producto = await Product.create({ nombre, descripcion, precio, stock, imagenUrl });
    res.status(201).json(producto);
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      error.status = 400;
      error.message = "Datos de producto inválidos. Revisá nombre, precio y los tipos de los campos enviados.";
    }
    next(error);
  }
}

async function actualizarProducto(req, res, next) {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    const error = new Error("ID de producto inválido");
    error.status = 400;
    return next(error);
  }

  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    const error = new Error("El cuerpo debe ser un objeto JSON de producto");
    error.status = 400;
    return next(error);
  }

  const cambios = {};
  for (const campo of ["nombre", "descripcion", "precio", "stock", "imagenUrl"]) {
    if (Object.hasOwn(req.body, campo)) cambios[campo] = req.body[campo];
  }

  if (Object.keys(cambios).length === 0) {
    const error = new Error("Enviá al menos un campo del producto para actualizar");
    error.status = 400;
    return next(error);
  }

  try {
    const producto = await Product.findById(req.params.id);
    if (!producto) {
      const error = new Error("Producto no encontrado");
      error.status = 404;
      return next(error);
    }

    producto.set(cambios);
    await producto.save();
    res.json(producto);
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      error.status = 400;
      error.message = "Datos de producto inválidos. Revisá nombre, precio y los tipos de los campos enviados.";
    }
    next(error);
  }
}

module.exports = { listarProductos, obtenerProductoPorId, crearProducto, actualizarProducto };
