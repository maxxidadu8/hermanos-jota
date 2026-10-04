import { useState } from "react";

const formularioVacio = { nombre: "", email: "", mensaje: "" };

function ContactForm() {
  const [datos, setDatos] = useState(formularioVacio);
  const [aviso, setAviso] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDatos((actual) => ({ ...actual, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!e.target.checkValidity()) {
      setAviso("Completá los campos requeridos con datos válidos.");
      e.target.reportValidity();
      return;
    }
    // El backend todavía no tiene una ruta POST: por ahora el envío es simulado.
    console.log("Consulta enviada:", datos);
    setAviso("Gracias por escribirnos. Tu consulta fue enviada.");
    setDatos(formularioVacio);
  };

  return (
    <main id="contenido" className="section contact">
      <div>
        <p className="eyebrow">Hablemos</p>
        <h1>Tu próxima historia empieza acá.</h1>
        <p>Escribinos para consultar por una pieza o visitar nuestra casa taller.</p>
        <address>
          Av. San Juan 2847<br />
          C1232AAB · San Cristóbal<br />
          Ciudad Autónoma de Buenos Aires<br />
          <br />
          Lunes a viernes: 10:00 - 19:00<br />
          Sábados: 10:00 - 14:00<br />
          <br />
          <a href="mailto:ventas@hermanosjota.com.ar">ventas@hermanosjota.com.ar</a><br />
          <a href="tel:+541145678900">+54 11 4567-8900</a>
        </address>
      </div>
      <form className="contact-form" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            name="nombre"
            required
            autoComplete="name"
            value={datos.nombre}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={datos.email}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="mensaje">Mensaje</label>
          <textarea
            id="mensaje"
            name="mensaje"
            rows="5"
            required
            value={datos.mensaje}
            onChange={handleChange}
          />
        </div>
        <button className="button" type="submit">Enviar consulta</button>
        <p className="form-message" aria-live="polite">{aviso}</p>
      </form>
    </main>
  );
}

export default ContactForm;
