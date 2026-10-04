const express = require("express");
const {
  listarProductos,
  obtenerProductoPorId,
} = require("../controllers/productosController");

const router = express.Router();

// GET /api/productos: devuelve el catálogo completo como JSON.
router.get("/", listarProductos);

// GET /api/productos/:id: devuelve una pieza o un error 404 si no existe.
router.get("/:id", obtenerProductoPorId);

module.exports = router;
