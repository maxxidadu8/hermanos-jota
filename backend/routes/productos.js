const express = require("express");
const {
  listarProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
} = require("../controllers/productosController");

const router = express.Router();

// GET /api/productos: devuelve el catálogo completo como JSON.
router.get("/", listarProductos);

// GET /api/productos/:id: devuelve una pieza o un error 404 si no existe.
router.get("/:id", obtenerProductoPorId);

// POST /api/productos: guarda un producto y devuelve 201.
router.post("/", crearProducto);

// PUT /api/productos/:id: valida y guarda los cambios de un producto existente.
router.put("/:id", actualizarProducto);

module.exports = router;
