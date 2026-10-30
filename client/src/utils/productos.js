const moneda = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
});

export function formatearPrecio(precio) {
  return Number.isFinite(precio) ? moneda.format(precio) : "Precio a consultar";
}

export function describirStock(stock) {
  if (!Number.isFinite(stock)) return "Stock a consultar";
  if (stock <= 0) return "Sin stock";
  return `${stock} ${stock === 1 ? "unidad disponible" : "unidades disponibles"}`;
}
