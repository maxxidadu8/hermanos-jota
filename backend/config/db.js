const mongoose = require("mongoose");

async function conectarDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri || !uri.trim()) {
    throw new Error("Falta configurar MONGODB_URI en backend/.env");
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log("Conexión a MongoDB establecida");
}

module.exports = conectarDB;
