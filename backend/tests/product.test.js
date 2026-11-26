const { test } = require("node:test");
const assert = require("node:assert/strict");
const Product = require("../models/Product");

test("Product acepta precio y stock cero, stock omitido y stock null", async () => {
  for (const stock of [0, 2, undefined, null]) {
    await new Product({ nombre: "Mesa", precio: 0, stock }).validate();
  }
});

test("Product rechaza precios negativos y no finitos sin pasar por el controller", async () => {
  for (const precio of [-1, Infinity, -Infinity, NaN]) {
    await assert.rejects(new Product({ nombre: "Mesa", precio }).validate(), error => Boolean(error.errors.precio));
  }
});

test("Product rechaza stock negativo, fraccionario y no finito a nivel de modelo", async () => {
  for (const stock of [-1, 0.5, Infinity, -Infinity, NaN]) {
    await assert.rejects(new Product({ nombre: "Mesa", precio: 100, stock }).validate(), error => Boolean(error.errors.stock));
  }
});

test("save no intenta insertar productos inválidos en la colección", async t => {
  const insertar = t.mock.method(Product.collection, "insertOne", async () => { throw new Error("No debe escribir"); });
  for (const datos of [{ precio: -1 }, { precio: Infinity }, { precio: 10, stock: -2 }, { precio: 10, stock: 0.5 }]) {
    await assert.rejects(new Product({ nombre: "Mesa", ...datos }).save(), { name: "ValidationError" });
  }
  assert.equal(insertar.mock.calls.length, 0);
});
