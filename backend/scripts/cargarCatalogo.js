const path = require("node:path");
const mongoose = require("mongoose");
const conectarDB = require("../config/db");
const Product = require("../models/Product");
const productos = require("../data/productosIniciales");

async function cargarCatalogo() {
  // Validar todo el catálogo antes de comenzar a escribir en la base.
  for (const datos of productos) {
    await new Product(datos).validate();
  }

  let creados = 0;
  for (const datos of productos) {
    const { _id, ...campos } = datos;
    const resultado = await Product.updateOne(
      { _id },
      { $setOnInsert: campos },
      { upsert: true, runValidators: true },
    );
    creados += resultado.upsertedCount;
  }

  return { creados, existentes: productos.length - creados };
}

async function ejecutar() {
  require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });
  try {
    await conectarDB();
    const resultado = await cargarCatalogo();
    console.log(`Catálogo: ${resultado.creados} productos creados, ${resultado.existentes} existentes conservados.`);
  } catch {
    // Evitar imprimir errores del driver que puedan incluir credenciales.
    console.error("No se pudo completar la carga. Revisá la conexión y los datos. Podés reintentar sin duplicar productos.");
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) ejecutar();

module.exports = cargarCatalogo;
