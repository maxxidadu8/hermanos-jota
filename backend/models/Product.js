const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: String,
  precio: { type: Number, required: true },
  stock: Number,
  imagenUrl: String,
});

module.exports = mongoose.model("Product", productSchema);
