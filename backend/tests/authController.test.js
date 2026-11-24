const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("../models/User");
const { registrar, login } = require("../controllers/authController");
const obtenerConfigJWT = require("../config/auth");

const anterior = process.env.JWT_SECRET;
process.env.JWT_SECRET = randomBytes(48).toString("hex");
after(() => {
  if (anterior === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = anterior;
});

const id = "507f1f77bcf86cd799439011";
const datos = { nombre: "Ana", email: "ana@ejemplo.com", password: "ClaveDePrueba123" };

async function ejecutar(handler, body) {
  const resultado = {};
  const res = {
    set: (nombre, valor) => { resultado[nombre] = valor; return res; },
    status: status => { resultado.status = status; return res; },
    json: body => { resultado.body = body; },
  };
  await handler({ body }, res, error => { resultado.error = error; });
  return resultado;
}

function verificarToken(token) {
  const { secret, algorithm, issuer, audience } = obtenerConfigJWT();
  return jwt.verify(token, secret, { algorithms: [algorithm], issuer, audience });
}

test("registro normaliza datos, descarta campos ajenos y devuelve 201 con JWT válido", async t => {
  t.mock.method(User, "exists", async () => null);
  const crear = t.mock.method(User, "create", async valores => ({ ...valores, _id: id }));
  const resultado = await ejecutar(registrar, { ...datos, nombre: " Ana ", email: " ANA@EJEMPLO.COM ", rol: "admin", _id: "otro" });
  assert.equal(resultado.status, 201);
  assert.deepEqual(crear.mock.calls[0].arguments, [datos]);
  assert.deepEqual(resultado.body.usuario, { _id: id, nombre: datos.nombre, email: datos.email });
  assert.equal(resultado.body.usuario.password, undefined);
  assert.ok(!JSON.stringify(resultado.body).includes(datos.password));
  assert.equal(resultado["Cache-Control"], "no-store");
  const payload = verificarToken(resultado.body.token);
  assert.equal(payload.sub, id);
  assert.equal(payload.exp - payload.iat, 3600);
  assert.equal(payload.password, undefined);
  assert.equal(payload.rol, undefined);
  const { secret, algorithm, issuer, audience } = obtenerConfigJWT();
  assert.throws(() => jwt.verify(resultado.body.token, secret, { algorithms: [algorithm], issuer, audience, clockTimestamp: payload.exp + 1 }), { name: "TokenExpiredError" });
  assert.throws(() => jwt.verify(resultado.body.token, randomBytes(48).toString("hex")));
});

test("registro devuelve 409 si ya existe el email, incluso ante una carrera de inserción", async t => {
  const existe = t.mock.method(User, "exists", async () => ({ _id: id }));
  const crear = t.mock.method(User, "create", async () => { throw Object.assign(new Error("datos privados"), { code: 11000 }); });
  const primero = await ejecutar(registrar, datos);
  assert.equal(primero.error.status, 409);
  assert.equal(crear.mock.calls.length, 0);
  existe.mock.restore();
  t.mock.method(User, "exists", async () => null);
  const carrera = await ejecutar(registrar, datos);
  assert.equal(carrera.error.status, 409);
  assert.ok(!carrera.error.message.includes("datos privados"));
});

test("registro rechaza cuerpos y campos inválidos sin consultar ni escribir usuarios", async t => {
  const existe = t.mock.method(User, "exists", async () => null);
  const crear = t.mock.method(User, "create", async () => null);
  for (const body of [undefined, [], {}, { ...datos, email: { $ne: null } }, { ...datos, nombre: "  " }, { ...datos, password: 12345678 }, { ...datos, password: "corta" }, { ...datos, password: "á".repeat(37) }]) {
    const resultado = await ejecutar(registrar, body);
    assert.equal(resultado.error.status, 400);
    assert.equal(resultado.body, undefined);
  }
  assert.equal(existe.mock.calls.length, 0);
  assert.equal(crear.mock.calls.length, 0);
});

test("registro oculta los documentos en errores de validación o de base", async t => {
  t.mock.method(User, "exists", async () => null);
  const validacion = new mongoose.Error.ValidationError();
  const crear = t.mock.method(User, "create", async () => { throw validacion; });
  assert.equal((await ejecutar(registrar, datos)).error.status, 400);
  crear.mock.restore();
  t.mock.method(User, "create", async () => { throw new Error(datos.password); });
  const resultado = await ejecutar(registrar, datos);
  assert.equal(resultado.error.status, 500);
  assert.ok(!resultado.error.message.includes(datos.password));
});

test("login verifica bcrypt, selecciona password y devuelve JWT sin exponer el hash", async t => {
  const hash = await bcrypt.hash(datos.password, 12);
  const usuario = new User({ ...datos, _id: id, password: hash });
  let seleccion;
  const consulta = t.mock.method(User, "findOne", () => ({ select: async campo => { seleccion = campo; return usuario; } }));
  const resultado = await ejecutar(login, { email: " ANA@EJEMPLO.COM ", password: datos.password });
  assert.equal(resultado.status, 200);
  assert.deepEqual(consulta.mock.calls[0].arguments, [{ email: datos.email }]);
  assert.equal(seleccion, "+password");
  assert.equal(verificarToken(resultado.body.token).sub, id);
  assert.equal(resultado.body.usuario.password, undefined);
  assert.ok(!JSON.stringify(resultado.body).includes(hash));
  assert.equal(resultado["Cache-Control"], "no-store");
});

test("login da el mismo 401 para usuario inexistente y contraseña incorrecta", async t => {
  const consulta = t.mock.method(User, "findOne", () => ({ select: async () => null }));
  const inexistente = await ejecutar(login, datos);
  consulta.mock.restore();
  t.mock.method(User, "findOne", () => ({ select: async () => ({ compararPassword: async () => false }) }));
  const incorrecta = await ejecutar(login, datos);
  assert.equal(inexistente.error.status, 401);
  assert.equal(incorrecta.error.status, 401);
  assert.equal(inexistente.error.message, incorrecta.error.message);
  assert.equal(incorrecta.body, undefined);
});

test("login rechaza inyección y datos mal formados sin consultar la base", async t => {
  const consulta = t.mock.method(User, "findOne", () => { throw new Error("No debería consultar"); });
  for (const body of [undefined, [], {}, { email: { $ne: null }, password: datos.password }, { email: datos.email, password: { $ne: null } }, { email: datos.email, password: "a".repeat(73) }]) {
    assert.equal((await ejecutar(login, body)).error.status, 400);
  }
  assert.equal(consulta.mock.calls.length, 0);
});

test("login no expone errores de la base", async t => {
  t.mock.method(User, "findOne", () => ({ select: async () => { throw new Error(datos.password); } }));
  const resultado = await ejecutar(login, datos);
  assert.equal(resultado.error.status, 500);
  assert.ok(!resultado.error.message.includes(datos.password));
});

test("sin JWT_SECRET válido no se crea la cuenta ni se emiten tokens", async t => {
  const secret = process.env.JWT_SECRET;
  const crear = t.mock.method(User, "create", async () => null);
  try {
    delete process.env.JWT_SECRET;
    assert.throws(obtenerConfigJWT, /JWT_SECRET/);
    assert.equal((await ejecutar(registrar, datos)).error.status, 500);
    process.env.JWT_SECRET = "corta";
    assert.throws(obtenerConfigJWT, /JWT_SECRET/);
    assert.equal((await ejecutar(login, datos)).error.status, 500);
    assert.equal(crear.mock.calls.length, 0);
  } finally { process.env.JWT_SECRET = secret; }
});
