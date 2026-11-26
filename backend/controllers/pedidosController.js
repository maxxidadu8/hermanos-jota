const mongoose = require("mongoose");
const Product = require("../models/Product");
const Order = require("../models/Order");

function errorHTTP(status, mensaje) {
  const error = new Error(mensaje);
  error.status = status;
  return error;
}

function validarItems(body) {
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      !Array.isArray(body.items) || body.items.length === 0 || body.items.length > 100) {
    throw errorHTTP(400, "El pedido debe contener entre 1 y 100 líneas de productos.");
  }
  const cantidades = new Map();
  for (const item of body.items) {
    if (!item || typeof item !== "object" || Array.isArray(item) ||
        typeof item.productoId !== "string" || !mongoose.isObjectIdOrHexString(item.productoId) ||
        !Number.isSafeInteger(item.cantidad) || item.cantidad <= 0) {
      throw errorHTTP(400, "Cada producto necesita un productoId válido y una cantidad entera positiva.");
    }
    const id = item.productoId.toLowerCase();
    const cantidad = (cantidades.get(id) ?? 0) + item.cantidad;
    if (!Number.isSafeInteger(cantidad)) throw errorHTTP(400, "La cantidad solicitada es demasiado grande.");
    cantidades.set(id, cantidad);
  }
  return cantidades;
}

async function crearPedido(req, res, next) {
  try {
    const cantidades = validarItems(req.body);
    const productos = await Product.find({ _id: { $in: [...cantidades.keys()] } }).lean();
    const catalogo = new Map(productos.map(producto => [String(producto._id), producto]));
    const items = [];
    let totalCentavos = 0;

    for (const [id, cantidad] of cantidades) {
      const producto = catalogo.get(id);
      if (!producto) throw errorHTTP(404, "Uno de los productos del carrito ya no existe. Revisá el catálogo.");
      if (Number.isFinite(producto.stock) && producto.stock < cantidad) {
        throw errorHTTP(409, `No hay stock suficiente de ${producto.nombre}.`);
      }
      if (!Number.isFinite(producto.precio) || producto.precio < 0) {
        throw errorHTTP(409, "Uno de los productos no tiene un precio válido para realizar el pedido.");
      }
      const precioCentavos = Math.round((producto.precio + Number.EPSILON) * 100);
      const subtotalCentavos = precioCentavos * cantidad;
      totalCentavos += subtotalCentavos;
      if (!Number.isSafeInteger(precioCentavos) || !Number.isSafeInteger(subtotalCentavos) || !Number.isSafeInteger(totalCentavos)) {
        throw errorHTTP(400, "El importe del pedido es demasiado grande.");
      }
      items.push({
        producto: producto._id,
        nombre: producto.nombre,
        imagenUrl: producto.imagenUrl,
        precio: precioCentavos / 100,
        cantidad,
        subtotal: subtotalCentavos / 100,
      });
    }

    const pedido = await Order.create({ usuario: req.usuario._id, items, total: totalCentavos / 100 });
    res.set("Cache-Control", "no-store");
    res.status(201).json(pedido);
  } catch (error) {
    next(error.status ? error : errorHTTP(500, "No se pudo guardar el pedido."));
  }
}

async function listarMisPedidos(req, res, next) {
  try {
    const pedidos = await Order.find({ usuario: req.usuario._id }).sort({ createdAt: -1, _id: -1 });
    res.set("Cache-Control", "no-store");
    res.json(pedidos);
  } catch {
    next(errorHTTP(500, "No se pudieron consultar los pedidos."));
  }
}

module.exports = { crearPedido, listarMisPedidos };
