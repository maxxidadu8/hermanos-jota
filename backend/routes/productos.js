const express = require("express");
const productos = require("../data/productos");

const router = express.Router();

// GET /api/productos: devuelve el catálogo completo como JSON.
router.get("/", (req, res) => {
  res.json(productos);
});

// GET /api/productos/:id: devuelve una pieza o un error 404 si no existe.
router.get("/:id", (req, res, next) => {
  const producto = productos.find((p) => p.id === req.params.id);

  if (!producto) {
    const error = new Error("Producto no encontrado");
    error.status = 404;
    return next(error);
  }

  res.json(producto);
});

module.exports = router;
