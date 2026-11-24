const mongoose = require("mongoose");

const importe = { type: Number, required: true, min: 0, validate: Number.isFinite };
const itemSchema = new mongoose.Schema({
  producto: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  nombre: { type: String, required: true },
  imagenUrl: String,
  precio: importe,
  cantidad: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
  subtotal: importe,
}, { _id: false });

const orderSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
  items: {
    type: [itemSchema],
    required: true,
    validate: { validator: items => items.length > 0, message: "El pedido debe contener productos." },
  },
  total: importe,
  moneda: { type: String, enum: ["ARS"], default: "ARS" },
  estado: { type: String, enum: ["pendiente"], default: "pendiente" },
}, { timestamps: true });

orderSchema.index({ usuario: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
