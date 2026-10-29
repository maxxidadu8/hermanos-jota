const { test } = require("node:test");
const assert = require("node:assert/strict");
const Product = require("../models/Product");
const { listarProductos, obtenerProductoPorId } = require("../controllers/productosController");

const id = "507f1f77bcf86cd799439011";

async function ejecutar(handler, params = {}) {
  const resultado = {};
  await handler(
    { params },
    { json: (body) => { resultado.body = body; } },
    (error) => { resultado.error = error; },
  );
  return resultado;
}

test("lista los productos devueltos por MongoDB, incluido el catálogo vacío", async (t) => {
  for (const productos of [[], [{ _id: id, nombre: "Mesa", precio: 100 }]]) {
    const consulta = t.mock.method(Product, "find", async () => productos);
    const resultado = await ejecutar(listarProductos);
    assert.deepEqual(resultado.body, productos);
    assert.equal(resultado.error, undefined);
    assert.equal(consulta.mock.calls.length, 1);
    consulta.mock.restore();
  }
});

test("obtiene un producto por su _id", async (t) => {
  const producto = { _id: id, nombre: "Mesa", precio: 100 };
  const consulta = t.mock.method(Product, "findById", async () => producto);
  const resultado = await ejecutar(obtenerProductoPorId, { id });
  assert.deepEqual(resultado.body, producto);
  assert.equal(resultado.error, undefined);
  assert.deepEqual(consulta.mock.calls[0].arguments, [id]);
});

test("rechaza IDs inválidos con 400 sin consultar la base", async (t) => {
  const consulta = t.mock.method(Product, "findById", async () => null);
  for (const valor of ["butaca-mendoza", "123", "z".repeat(24)]) {
    const resultado = await ejecutar(obtenerProductoPorId, { id: valor });
    assert.equal(resultado.error.status, 400);
    assert.equal(resultado.body, undefined);
  }
  assert.equal(consulta.mock.calls.length, 0);
});

test("un ID válido sin producto produce 404", async (t) => {
  t.mock.method(Product, "findById", async () => null);
  const resultado = await ejecutar(obtenerProductoPorId, { id });
  assert.equal(resultado.error.status, 404);
  assert.equal(resultado.error.message, "Producto no encontrado");
  assert.equal(resultado.body, undefined);
});

test("ambos GET envían los errores de MongoDB al middleware", async (t) => {
  const error = new Error("Error de consulta");
  t.mock.method(Product, "find", async () => { throw error; });
  t.mock.method(Product, "findById", async () => { throw error; });
  for (const handler of [listarProductos, obtenerProductoPorId]) {
    const resultado = await ejecutar(handler, { id });
    assert.equal(resultado.error, error);
    assert.equal(resultado.body, undefined);
  }
});
