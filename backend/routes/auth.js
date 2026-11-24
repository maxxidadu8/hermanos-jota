const express = require("express");
const { registrar, login, obtenerPerfil } = require("../controllers/authController");
const autenticar = require("../middlewares/autenticar");

const router = express.Router();
router.post("/registro", registrar);
router.post("/login", login);
router.get("/perfil", autenticar, obtenerPerfil);

module.exports = router;
