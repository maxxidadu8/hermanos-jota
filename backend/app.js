const express = require("express");
const logger = require("./middlewares/logger");
const productosRouter = require("./routes/productos");

const app = express();

// Se ejecuta en todas las peticiones, antes de las rutas.
app.use(logger);

// Convierte los cuerpos JSON de las peticiones en req.body.
app.use(express.json());

app.use("/api/productos", productosRouter);

module.exports = app;
