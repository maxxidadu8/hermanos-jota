const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

function ocultarPassword(doc, resultado) {
  delete resultado.password;
  return resultado;
}

const userSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    type: String,
    required: true,
    select: false,
    validate: {
      validator(valor) {
        if (!this.isModified("password")) return true;
        return typeof valor === "string" && valor.length >= 8 && Buffer.byteLength(valor, "utf8") <= 72;
      },
      message: "La contraseña debe tener al menos 8 caracteres y no superar los 72 bytes.",
    },
  },
}, {
  timestamps: true,
  toJSON: { transform: ocultarPassword },
  toObject: { transform: ocultarPassword },
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.compararPassword = async function (valor) {
  if (typeof valor !== "string" || Buffer.byteLength(valor, "utf8") > 72 || !this.password) {
    return false;
  }
  return bcrypt.compare(valor, this.password);
};

module.exports = mongoose.model("User", userSchema);
