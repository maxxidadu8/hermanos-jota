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

module.exports = { listarProductos, obtenerProductoPorId };
