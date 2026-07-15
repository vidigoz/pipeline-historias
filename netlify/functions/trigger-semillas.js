// netlify/functions/trigger-semillas.js
//
// Endpoint HTTP normal para disparar el Buscador de Semillas a mano desde el
// botón del dashboard, sin esperar al cron semanal. Reutiliza la misma lógica
// (generarSemillas) que la scheduled function; el cron original queda intacto.

const { requireAuth } = require('./lib/auth');
const { generarSemillas } = require('./buscador-semillas');

exports.handler = async (event) => {
  const fail = requireAuth(event);
  if (fail) return fail;

  try {
    // Permite pedir una cantidad distinta desde el body; por defecto usa el batch estándar.
    let cantidad;
    if (event.body) {
      const body = JSON.parse(event.body);
      if (Number.isInteger(body.cantidad) && body.cantidad > 0 && body.cantidad <= 10) {
        cantidad = body.cantidad;
      }
    }

    const creadas = await generarSemillas(cantidad);
    return { statusCode: 200, body: JSON.stringify({ ok: true, creadas }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
