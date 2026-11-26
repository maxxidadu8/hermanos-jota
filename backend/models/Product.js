const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: String,
  precio: { type: Number, required: true, min: 0, validate: Number.isFinite },
  stock: {
    type: Number,
    min: 0,
    validate: {
      validator: valor => valor == null || Number.isSafeInteger(valor),
      message: "El stock debe ser un entero no negativo o quedar sin especificar.",
    },
  },
  imagenUrl: String,
});

module.exports = mongoose.model("Product", productSchema);
