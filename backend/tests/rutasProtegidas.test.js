const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const jwt = require("jsonwebtoken");
const app = require("../app");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const obtenerConfigJWT = require("../config/auth");

const anterior = process.env.JWT_SECRET;
process.env.JWT_SECRET = randomBytes(48).toString("hex");
const idUsuario = "507f1f77bcf86cd799439011";
const idProducto = "507f191e810c19729de860ea";
let servidor;
let base;

before(async () => {
  servidor = await new Promise((resolve, reject) => {
    const http = app.listen(0, "127.0.0.1", () => resolve(http));
    http.once("error", reject);
  });
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  if (servidor) {
    servidor.closeAllConnections();
    await new Promise(resolve => servidor.close(resolve));
  }
  if (anterior === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = anterior;
});

function token(subject = idUsuario) {
  const { secret, ...opciones } = obtenerConfigJWT();
  return jwt.sign({}, secret, { ...opciones, subject });
}

test("GET del catálogo sigue siendo público", async t => {
  t.mock.method(Product, "find", async () => []);
  const respuesta = await fetch(base + "/api/productos");
  assert.equal(respuesta.status, 200);
  assert.deepEqual(await respuesta.json(), []);
});

test("perfil y escrituras de productos rechazan HTTP sin token antes de tocar la base", async t => {
  const usuarios = t.mock.method(User, "findById", () => { throw new Error("No debería consultar"); });
  const crear = t.mock.method(Product, "create", () => { throw new Error("No debería escribir"); });
  const buscar = t.mock.method(Product, "findById", () => { throw new Error("No debería consultar"); });
  const borrar = t.mock.method(Product, "findByIdAndDelete", () => { throw new Error("No debería borrar"); });
  const crearPedido = t.mock.method(Order, "create", () => { throw new Error("No debería guardar pedidos"); });
  const listarPedidos = t.mock.method(Order, "find", () => { throw new Error("No debería consultar pedidos"); });
  for (const [metodo, ruta] of [
    ["GET", "/api/auth/perfil"],
    ["POST", "/api/productos"],
    ["PUT", `/api/productos/${idProducto}`],
    ["DELETE", `/api/productos/${idProducto}`],
    ["POST", "/api/pedidos"],
    ["GET", "/api/pedidos"],
  ]) {
    const respuesta = await fetch(base + ruta, { method: metodo });
    assert.equal(respuesta.status, 401);
    assert.equal(typeof (await respuesta.json()).error, "string");
  }
  for (const funcion of [usuarios, crear, buscar, borrar, crearPedido, listarPedidos]) assert.equal(funcion.mock.calls.length, 0);
});

test("HTTP crea pedidos a nombre del JWT y otro usuario no puede consultarlos", async t => {
  const otroUsuario = "af42d37d95c98624f3f62bf3";
  t.mock.method(User, "findById", id => ({ select: async () => ({ _id: id, nombre: "Cliente", email: "cliente@ejemplo.com" }) }));
  t.mock.method(Product, "find", () => ({ lean: async () => [{ _id: idProducto, nombre: "Mesa", precio: 10, stock: 5 }] }));
  let pedidoGuardado;
  t.mock.method(Order, "create", async datos => {
    const pedido = new Order(datos);
    await pedido.validate();
    pedidoGuardado = pedido.toObject();
    return pedido;
  });
  t.mock.method(Order, "find", filtro => ({ sort: async () => String(filtro.usuario) === String(pedidoGuardado.usuario) ? [pedidoGuardado] : [] }));
  const alta = await fetch(base + "/api/pedidos", {
    method: "POST",
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ usuario: otroUsuario, total: 0, items: [{ productoId: idProducto, cantidad: 2, precio: 0 }] }),
  });
  assert.equal(alta.status, 201);
  const creado = await alta.json();
  assert.equal(creado.usuario, idUsuario);
  assert.equal(creado.total, 20);
  const propios = await fetch(base + "/api/pedidos?usuario=" + otroUsuario, { headers: { Authorization: `Bearer ${token()}` } });
  assert.equal(propios.status, 200);
  assert.equal((await propios.json()).length, 1);
  const ajenos = await fetch(base + "/api/pedidos?usuario=" + idUsuario, { headers: { Authorization: `Bearer ${token(otroUsuario)}` } });
  assert.equal(ajenos.status, 200);
  assert.deepEqual(await ajenos.json(), []);
});

test("perfil HTTP usa el usuario autenticado y no devuelve contraseña", async t => {
  t.mock.method(User, "findById", () => ({ select: async () => ({ _id: idUsuario, nombre: "Ana", email: "ana@ejemplo.com", password: "hash-privado" }) }));
  const respuesta = await fetch(base + "/api/auth/perfil", { headers: { Authorization: `Bearer ${token()}` } });
  assert.equal(respuesta.status, 200);
  assert.equal(respuesta.headers.get("cache-control"), "no-store");
  assert.deepEqual(await respuesta.json(), { usuario: { _id: idUsuario, nombre: "Ana", email: "ana@ejemplo.com" } });
});

test("un Bearer válido permite POST, PUT y DELETE de productos", async t => {
  t.mock.method(User, "findById", () => ({ select: async () => ({ _id: idUsuario, nombre: "Ana", email: "ana@ejemplo.com" }) }));
  const producto = new Product({ _id: idProducto, nombre: "Mesa", precio: 100 });
  const crear = t.mock.method(Product, "create", async () => producto);
  t.mock.method(Product, "findById", async () => producto);
  t.mock.method(producto, "save", async () => { await producto.validate(); return producto; });
  const borrar = t.mock.method(Product, "findByIdAndDelete", async () => producto);
  const headers = { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" };
  const alta = await fetch(base + "/api/productos", { method: "POST", headers, body: JSON.stringify({ nombre: "Mesa", precio: 100 }) });
  assert.equal(alta.status, 201);
  assert.equal(crear.mock.calls.length, 1);
  await alta.json();
  const cambio = await fetch(base + `/api/productos/${idProducto}`, { method: "PUT", headers, body: JSON.stringify({ precio: 200 }) });
  assert.equal(cambio.status, 200);
  assert.equal((await cambio.json()).precio, 200);
  const baja = await fetch(base + `/api/productos/${idProducto}`, { method: "DELETE", headers });
  assert.equal(baja.status, 204);
  assert.equal(await baja.text(), "");
  assert.equal(borrar.mock.calls.length, 1);
});
