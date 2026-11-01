const { createHash } = require("node:crypto");
const productosOriginales = require("./productos");

// Valores ficticios en pesos argentinos, únicamente para demostrar la aplicación.
const ejemplos = {
  "aparador-uspallata": { precio: 450000, stock: 4 },
  "biblioteca-recoleta": { precio: 320000, stock: 3 },
  "butaca-mendoza": { precio: 185000, stock: 6 },
  "sillon-copacabana": { precio: 275000, stock: 0 },
  "mesa-centro-araucaria": { precio: 210000, stock: 5 },
  "mesa-noche-aconcagua": { precio: 85000, stock: 8 },
  "sofa-patagonia": { precio: 650000, stock: 2 },
  "mesa-comedor-pampa": { precio: 390000, stock: 4 },
  "sillas-cordoba": { precio: 240000, stock: 5 },
  "escritorio-costa": { precio: 195000, stock: 3 },
  "silla-trabajo-belgrano": { precio: 145000, stock: 7 },
};

module.exports = productosOriginales.map(producto => ({
  // ID estable: renombrar o editar una pieza no hace que la carga la duplique.
  _id: createHash("sha256").update(`hermanos-jota:${producto.id}`).digest("hex").slice(0, 24),
  nombre: producto.nombre,
  descripcion: producto.descripcion,
  imagenUrl: `/${producto.imagen}`,
  ...ejemplos[producto.id],
}));
