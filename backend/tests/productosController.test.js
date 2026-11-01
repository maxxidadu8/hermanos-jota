const { test } = require("node:test");
const assert = require("node:assert/strict");
const Product = require("../models/Product");
const { listarProductos, obtenerProductoPorId, crearProducto, actualizarProducto, eliminarProducto } = require("../controllers/productosController");

const id = "507f1f77bcf86cd799439011";

test("PUT guarda cambios, conserva los campos omitidos y protege el _id", async (t) => {
  const producto = new Product({ _id: id, nombre: "Mesa", precio: 1000, stock: 2 });
  const consulta = t.mock.method(Product, "findById", async () => producto);
  const guardar = t.mock.method(producto, "save", async () => { await producto.validate(); return producto; });
  const resultado = await ejecutar(actualizarProducto, { id }, { precio: 1500, stock: 0, _id: "507f191e810c19729de860ea", extra: true });
  assert.equal(resultado.error, undefined);
  assert.equal(resultado.body, producto);
  assert.equal(producto.precio, 1500);
  assert.equal(producto.stock, 0);
  assert.equal(producto.nombre, "Mesa");
  assert.equal(String(producto._id), id);
  assert.equal(producto.get("extra"), undefined);
  assert.equal(guardar.mock.calls.length, 1);
  assert.deepEqual(consulta.mock.calls[0].arguments, [id]);
});

test("PUT rechaza ID inválido y cuerpos vacíos o sin campos permitidos", async (t) => {
  const consulta = t.mock.method(Product, "findById", async () => null);
  const invalido = await ejecutar(actualizarProducto, { id: "no-existe" }, { precio: 1 });
  assert.equal(invalido.error.status, 400);
  for (const body of [undefined, null, [], "texto", {}, { _id: id }, { $set: { precio: 1 } }]) {
    const resultado = await ejecutar(actualizarProducto, { id }, body);
    assert.equal(resultado.error.status, 400);
    assert.equal(resultado.body, undefined);
  }
  assert.equal(consulta.mock.calls.length, 0);
});

test("PUT devuelve 404 cuando el producto no existe", async (t) => {
  t.mock.method(Product, "findById", async () => null);
  const resultado = await ejecutar(actualizarProducto, { id }, { precio: 1 });
  assert.equal(resultado.error.status, 404);
  assert.equal(resultado.body, undefined);
});

test("PUT valida campos obligatorios y numéricos antes de guardar", async (t) => {
  let cambiosGuardados = 0;
  t.mock.method(Product, "findById", async () => {
    const producto = new Product({ _id: id, nombre: "Mesa", precio: 1000, stock: 2 });
    t.mock.method(producto, "save", async () => {
      await producto.validate();
      cambiosGuardados++;
      return producto;
    });
    return producto;
  });
  for (const body of [{ nombre: "" }, { nombre: null }, { precio: null }, { precio: "abc" }, { stock: "abc" }]) {
    const resultado = await ejecutar(actualizarProducto, { id }, body);
    assert.equal(resultado.error.status, 400);
    assert.equal(resultado.body, undefined);
  }
  assert.equal(cambiosGuardados, 0);
});

test("PUT delega fallos al consultar y al guardar como errores internos", async (t) => {
  const error = new Error("Base no disponible");
  const consulta = t.mock.method(Product, "findById", async () => { throw error; });
  const falloConsulta = await ejecutar(actualizarProducto, { id }, { precio: 2 });
  assert.equal(falloConsulta.error, error);
  consulta.mock.restore();
  const producto = new Product({ nombre: "Mesa", precio: 1 });
  t.mock.method(Product, "findById", async () => producto);
  t.mock.method(producto, "save", async () => { throw error; });
  const falloGuardado = await ejecutar(actualizarProducto, { id }, { precio: 2 });
  assert.equal(falloGuardado.error, error);
  assert.equal(falloGuardado.body, undefined);
});

async function ejecutar(handler, params = {}, body) {
  const resultado = {};
  const res = {
    status: (status) => { resultado.status = status; return res; },
    json: (body) => { resultado.body = body; },
    end: () => { resultado.finalizado = true; },
  };
  await handler(
    { params, body },
    res,
    (error) => { resultado.error = error; },
  );
  return resultado;
}

test("DELETE elimina por _id y responde 204 sin cuerpo", async (t) => {
  const consulta = t.mock.method(Product, "findByIdAndDelete", async () => ({ _id: id }));
  const resultado = await ejecutar(eliminarProducto, { id });
  assert.deepEqual(consulta.mock.calls[0].arguments, [id]);
  assert.equal(consulta.mock.calls.length, 1);
  assert.equal(resultado.status, 204);
  assert.equal(resultado.finalizado, true);
  assert.equal(resultado.body, undefined);
  assert.equal(resultado.error, undefined);
});

test("DELETE rechaza IDs inválidos sin consultar MongoDB", async (t) => {
  const consulta = t.mock.method(Product, "findByIdAndDelete", async () => null);
  for (const valor of ["no-existe", "123", "z".repeat(24)]) {
    const resultado = await ejecutar(eliminarProducto, { id: valor });
    assert.equal(resultado.error.status, 400);
    assert.equal(resultado.finalizado, undefined);
  }
  assert.equal(consulta.mock.calls.length, 0);
});

test("DELETE responde 404 si el producto no existe o ya fue eliminado", async (t) => {
  t.mock.method(Product, "findByIdAndDelete", async () => null);
  const resultado = await ejecutar(eliminarProducto, { id });
  assert.equal(resultado.error.status, 404);
  assert.equal(resultado.error.message, "Producto no encontrado");
  assert.equal(resultado.finalizado, undefined);
});

test("DELETE delega errores de MongoDB sin confirmar la eliminación", async (t) => {
  const error = new Error("Base no disponible");
  t.mock.method(Product, "findByIdAndDelete", async () => { throw error; });
  const resultado = await ejecutar(eliminarProducto, { id });
  assert.equal(resultado.error, error);
  assert.equal(resultado.status, undefined);
  assert.equal(resultado.finalizado, undefined);
});

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

test("crea un producto con 201 sin aceptar _id ni campos ajenos al modelo", async (t) => {
  const datos = { nombre: "Mesa", descripcion: "Madera", precio: 0, stock: 2, imagenUrl: "/mesa.png" };
  const guardado = { ...datos, _id: id };
  const consulta = t.mock.method(Product, "create", async () => guardado);
  const resultado = await ejecutar(crearProducto, {}, { ...datos, _id: "otro", extra: true });
  assert.deepEqual(consulta.mock.calls[0].arguments, [datos]);
  assert.equal(resultado.status, 201);
  assert.deepEqual(resultado.body, guardado);
  assert.equal(resultado.error, undefined);
});

test("rechaza cuerpos ausentes o que no sean objetos de producto", async (t) => {
  const consulta = t.mock.method(Product, "create", async () => ({}));
  for (const body of [undefined, null, [], "texto", 1]) {
    const resultado = await ejecutar(crearProducto, {}, body);
    assert.equal(resultado.error.status, 400);
    assert.equal(resultado.body, undefined);
  }
  assert.equal(consulta.mock.calls.length, 0);
});

test("responde 400 si faltan obligatorios o los números son inválidos", async (t) => {
  t.mock.method(Product, "create", async (datos) => {
    const producto = new Product(datos);
    await producto.validate();
    throw new Error("No se esperaba guardar datos válidos en esta prueba");
  });
  for (const body of [{}, { nombre: "Mesa" }, { precio: 100 }, { nombre: "Mesa", precio: "abc" }, { nombre: "Mesa", precio: 10, stock: "abc" }]) {
    const resultado = await ejecutar(crearProducto, {}, body);
    assert.equal(resultado.error.status, 400);
    assert.equal(resultado.body, undefined);
  }
});

test("un fallo de base al crear se delega como error interno", async (t) => {
  const error = new Error("Base no disponible");
  t.mock.method(Product, "create", async () => { throw error; });
  const resultado = await ejecutar(crearProducto, {}, { nombre: "Mesa", precio: 100 });
  assert.equal(resultado.error, error);
  assert.equal(resultado.error.status, undefined);
  assert.equal(resultado.body, undefined);
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
