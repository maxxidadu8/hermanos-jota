const express = require("express");
const logger = require("./middlewares/logger");
const productosRouter = require("./routes/productos");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// Se ejecuta en todas las peticiones, antes de las rutas.
app.use(logger);

// Convierte los cuerpos JSON de las peticiones en req.body.
app.use(express.json());

app.use("/api/productos", productosRouter);

// Después de las rutas: primero el 404 y, al final, los errores.
app.use(notFound);
app.use(errorHandler);

module.exports = app;
