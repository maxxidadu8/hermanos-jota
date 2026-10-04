const productos = require("../data/productos");

function listarProductos(req, res) {
  res.json(productos);
}

function obtenerProductoPorId(req, res, next) {
  const producto = productos.find((p) => p.id === req.params.id);

  if (!producto) {
    const error = new Error("Producto no encontrado");
    error.status = 404;
    return next(error);
  }

  res.json(producto);
}

module.exports = { listarProductos, obtenerProductoPorId };
