const express = require("express");
const autenticar = require("../middlewares/autenticar");
const { crearPedido, listarMisPedidos } = require("../controllers/pedidosController");

const router = express.Router();
router.use(autenticar);
router.post("/", crearPedido);
router.get("/", listarMisPedidos);

module.exports = router;
