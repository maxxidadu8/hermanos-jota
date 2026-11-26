const { test } = require("node:test");
const assert = require("node:assert/strict");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { crearPedido, listarMisPedidos } = require("../controllers/pedidosController");

const usuario = "507f1f77bcf86cd799439011";
const otroUsuario = "507f191e810c19729de860ea";
const id = "af42d37d95c98624f3f62bf3";
const otroId = "57877098ab995b2d1d7a9566";
const mesa = { _id: id, nombre: "Mesa", precio: 10.1, stock: 5, imagenUrl: "/mesa.png" };

async function ejecutar(handler, body) {
  const resultado = { status: 200 };
  const res = {
    set: (nombre, valor) => { resultado[nombre] = valor; return res; },
    status: valor => { resultado.status = valor; return res; },
    json: valor => { resultado.body = valor; },
  };
  await handler({ body, usuario: { _id: usuario }, query: { usuario: otroUsuario } }, res, error => { resultado.error = error; });
  return resultado;
}

test("crea el pedido con el usuario autenticado, precios del servidor y snapshots del producto", async t => {
  const consulta = t.mock.method(Product, "find", () => ({ lean: async () => [mesa] }));
  const guardar = t.mock.method(Order, "create", async datos => {
    const pedido = new Order(datos);
    await pedido.validate();
    return pedido;
  });
  const resultado = await ejecutar(crearPedido, {
    usuario: otroUsuario, total: 0.01, estado: "pagado", moneda: "USD",
    items: [{ productoId: id, cantidad: 3, precio: 0.01, nombre: "Nombre falso", subtotal: 0.01 }],
  });
  assert.equal(resultado.status, 201);
  assert.equal(resultado.error, undefined);
  assert.equal(resultado["Cache-Control"], "no-store");
  assert.deepEqual(consulta.mock.calls[0].arguments, [{ _id: { $in: [id] } }]);
  const datos = guardar.mock.calls[0].arguments[0];
  assert.equal(datos.usuario, usuario);
  assert.equal(datos.total, 30.3);
  assert.deepEqual(datos.items, [{ producto: id, nombre: "Mesa", imagenUrl: "/mesa.png", precio: 10.1, cantidad: 3, subtotal: 30.3 }]);
  assert.equal(resultado.body.moneda, "ARS");
  assert.equal(resultado.body.estado, "pendiente");
  assert.equal(resultado.body.items[0].nombre, "Mesa");
});

test("suma productos repetidos y normaliza sus IDs antes de verificar disponibilidad", async t => {
  t.mock.method(Product, "find", () => ({ lean: async () => [mesa] }));
  const guardar = t.mock.method(Order, "create", async datos => datos);
  const resultado = await ejecutar(crearPedido, { items: [{ productoId: id.toUpperCase(), cantidad: 2 }, { productoId: id, cantidad: 3 }] });
  assert.equal(resultado.status, 201);
  assert.equal(resultado.body.items.length, 1);
  assert.equal(resultado.body.items[0].cantidad, 5);
  assert.equal(resultado.body.total, 50.5);
  assert.equal(guardar.mock.calls.length, 1);
});

test("rechaza cantidades agregadas que exceden el stock sin guardar el pedido", async t => {
  t.mock.method(Product, "find", () => ({ lean: async () => [mesa] }));
  const guardar = t.mock.method(Order, "create", async () => null);
  const resultado = await ejecutar(crearPedido, { items: [{ productoId: id, cantidad: 3 }, { productoId: id, cantidad: 3 }] });
  assert.equal(resultado.error.status, 409);
  assert.equal(guardar.mock.calls.length, 0);
});

test("rechaza carritos vacíos, mal formados, excesivos y cantidades inválidas antes de consultar", async t => {
  const consulta = t.mock.method(Product, "find", () => { throw new Error("No debería consultar"); });
  const guardar = t.mock.method(Order, "create", async () => null);
  const cuerpos = [undefined, [], {}, { items: [] }, { items: Array(101).fill({ productoId: id, cantidad: 1 }) }];
  for (const cantidad of [0, -1, 1.5, "2", null, Number.MAX_SAFE_INTEGER + 1]) cuerpos.push({ items: [{ productoId: id, cantidad }] });
  cuerpos.push({ items: [{ productoId: "invalido", cantidad: 1 }] });
  cuerpos.push({ items: [null] });
  cuerpos.push({ items: [{ productoId: id, cantidad: Number.MAX_SAFE_INTEGER }, { productoId: id, cantidad: 1 }] });
  for (const body of cuerpos) assert.equal((await ejecutar(crearPedido, body)).error.status, 400);
  assert.equal(consulta.mock.calls.length, 0);
  assert.equal(guardar.mock.calls.length, 0);
});

test("si falta cualquiera de los productos no guarda un pedido parcial", async t => {
  t.mock.method(Product, "find", () => ({ lean: async () => [mesa] }));
  const guardar = t.mock.method(Order, "create", async () => null);
  const resultado = await ejecutar(crearPedido, { items: [{ productoId: id, cantidad: 1 }, { productoId: otroId, cantidad: 1 }] });
  assert.equal(resultado.error.status, 404);
  assert.equal(guardar.mock.calls.length, 0);
});

test("no permite productos sin stock o con precios inválidos", async t => {
  const guardar = t.mock.method(Order, "create", async () => null);
  for (const cambios of [{ stock: 0 }, { precio: -1 }, { precio: Infinity }]) {
    const consulta = t.mock.method(Product, "find", () => ({ lean: async () => [{ ...mesa, ...cambios }] }));
    assert.equal((await ejecutar(crearPedido, { items: [{ productoId: id, cantidad: 1 }] })).error.status, 409);
    consulta.mock.restore();
  }
  assert.equal(guardar.mock.calls.length, 0);
});

test("permite precio cero y stock sin especificar, y conserva importes con dos decimales", async t => {
  const consulta = t.mock.method(Product, "find", () => ({ lean: async () => [{ ...mesa, precio: 0, stock: null }] }));
  t.mock.method(Order, "create", async datos => datos);
  const gratis = await ejecutar(crearPedido, { items: [{ productoId: id, cantidad: 2 }] });
  assert.equal(gratis.body.total, 0);
  consulta.mock.restore();
  t.mock.method(Product, "find", () => ({ lean: async () => [{ ...mesa, precio: 0.1 }, { ...mesa, _id: otroId, precio: 0.2 }] }));
  const centavos = await ejecutar(crearPedido, { items: [{ productoId: id, cantidad: 1 }, { productoId: otroId, cantidad: 1 }] });
  assert.equal(centavos.body.total, 0.3);
});

test("rechaza importes que exceden la precisión segura sin guardar", async t => {
  t.mock.method(Product, "find", () => ({ lean: async () => [{ ...mesa, precio: Number.MAX_SAFE_INTEGER }] }));
  const guardar = t.mock.method(Order, "create", async () => null);
  const resultado = await ejecutar(crearPedido, { items: [{ productoId: id, cantidad: 1 }] });
  assert.equal(resultado.error.status, 400);
  assert.equal(guardar.mock.calls.length, 0);
});

test("mis pedidos filtra por JWT, ignora usuario en query y ordena por fecha", async t => {
  let orden;
  const pedidos = [{ usuario, total: 100 }];
  const consulta = t.mock.method(Order, "find", () => ({ sort: async valor => { orden = valor; return pedidos; } }));
  const resultado = await ejecutar(listarMisPedidos);
  assert.deepEqual(consulta.mock.calls[0].arguments, [{ usuario }]);
  assert.deepEqual(orden, { createdAt: -1, _id: -1 });
  assert.equal(resultado["Cache-Control"], "no-store");
  assert.deepEqual(resultado.body, pedidos);
});

test("un usuario sin pedidos obtiene un array vacío", async t => {
  t.mock.method(Order, "find", () => ({ sort: async () => [] }));
  assert.deepEqual((await ejecutar(listarMisPedidos)).body, []);
});

test("los fallos de base no revelan los datos internos del pedido", async t => {
  const consulta = t.mock.method(Product, "find", () => ({ lean: async () => { throw new Error("detalle privado"); } }));
  const body = { items: [{ productoId: id, cantidad: 1 }] };
  assert.equal((await ejecutar(crearPedido, body)).error.status, 500);
  consulta.mock.restore();
  t.mock.method(Product, "find", () => ({ lean: async () => [mesa] }));
  t.mock.method(Order, "create", async () => { throw new Error("detalle privado"); });
  const fallo = await ejecutar(crearPedido, body);
  assert.equal(fallo.error.status, 500);
  assert.ok(!fallo.error.message.includes("detalle privado"));
  t.mock.method(Order, "find", () => ({ sort: async () => { throw new Error("detalle privado"); } }));
  assert.equal((await ejecutar(listarMisPedidos)).error.status, 500);
});

test("el modelo rechaza pedidos sin usuario, sin líneas o con cantidades fraccionarias", async () => {
  const item = { producto: id, nombre: "Mesa", precio: 10, cantidad: 1, subtotal: 10 };
  for (const datos of [
    { items: [item], total: 10 },
    { usuario, items: [], total: 0 },
    { usuario, items: [{ ...item, cantidad: 1.5 }], total: 10 },
    { usuario, items: [item], total: -1 },
  ]) await assert.rejects(new Order(datos).validate(), { name: "ValidationError" });
});
