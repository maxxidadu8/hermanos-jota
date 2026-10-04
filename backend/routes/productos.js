const express = require("express");
const productos = require("../data/productos");

const router = express.Router();

// GET /api/productos: devuelve el catálogo completo como JSON.
router.get("/", (req, res) => {
  res.json(productos);
});

// GET /api/productos/:id: devuelve una pieza o un error 404 si no existe.
router.get("/:id", (req, res) => {
  const producto = productos.find((p) => p.id === req.params.id);

  if (!producto) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }

  res.json(producto);
});

module.exports = router;
