const { test } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcrypt");
const User = require("../models/User");

test("valida los obligatorios y normaliza nombre y email", async () => {
  const vacio = new User({});
  await assert.rejects(vacio.validate(), error => {
    assert.deepEqual(Object.keys(error.errors).sort(), ["email", "nombre", "password"]);
    return true;
  });
  const usuario = new User({ nombre: "  Ana  ", email: "  ANA@EJEMPLO.COM  ", password: "ClaveDePrueba123" });
  await usuario.validate();
  assert.equal(usuario.nombre, "Ana");
  assert.equal(usuario.email, "ana@ejemplo.com");
});

test("rechaza email inválido, contraseñas cortas y contraseñas mayores a 72 bytes", async () => {
  for (const datos of [
    { email: "sin-email" },
    { password: "corta" },
    { password: "a".repeat(73) },
    { password: "á".repeat(37) },
  ]) {
    const usuario = new User({ nombre: "Ana", email: "ana@ejemplo.com", password: "ClaveDePrueba123", ...datos });
    await assert.rejects(usuario.validate(), { name: "ValidationError" });
  }
});

test("save guarda un hash verificable y no vuelve a hashear al editar otro campo", async (t) => {
  let guardado;
  t.mock.method(User.collection, "insertOne", async documento => {
    guardado = { ...documento };
    return { acknowledged: true, insertedId: documento._id };
  });
  t.mock.method(User.collection, "updateOne", async () => ({ acknowledged: true, matchedCount: 1, modifiedCount: 1 }));
  const password = "ClaveDePrueba123";
  const usuario = new User({ nombre: "Ana", email: "ana@ejemplo.com", password });
  await usuario.save();
  assert.notEqual(guardado.password, password);
  assert.equal(bcrypt.getRounds(guardado.password), 12);
  assert.equal(await bcrypt.compare(password, guardado.password), true);
  assert.equal(await usuario.compararPassword(password), true);
  assert.equal(await usuario.compararPassword("otra-clave"), false);
  const hash = usuario.password;
  usuario.nombre = "Ana Pérez";
  await usuario.save();
  assert.equal(usuario.password, hash);
  usuario.password = "NuevaClaveDePrueba123";
  await usuario.save();
  assert.notEqual(usuario.password, hash);
  assert.equal(await usuario.compararPassword("NuevaClaveDePrueba123"), true);
  assert.equal(await usuario.compararPassword(password), false);
});

test("omite la contraseña al serializar y al convertir el usuario a objeto", () => {
  const usuario = new User({ nombre: "Ana", email: "ana@ejemplo.com", password: "ClaveDePrueba123" });
  assert.equal(usuario.toJSON().password, undefined);
  assert.equal(usuario.toObject().password, undefined);
  assert.ok(!JSON.stringify(usuario).includes("ClaveDePrueba123"));
  assert.equal(User.schema.path("password").options.select, false);
  assert.ok(User.schema.indexes().some(([campos, opciones]) => campos.email === 1 && opciones.unique));
});

test("no acepta contraseñas que bcrypt truncaría ni valores que no sean texto", async () => {
  const usuario = new User({ nombre: "Ana", email: "ana@ejemplo.com" });
  usuario.password = await bcrypt.hash("a".repeat(72), 12);
  assert.equal(await usuario.compararPassword("a".repeat(72) + "extra"), false);
  assert.equal(await usuario.compararPassword(undefined), false);
  assert.equal(await usuario.compararPassword({ password: "texto" }), false);
});
