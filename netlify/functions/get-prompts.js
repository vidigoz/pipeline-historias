// netlify/functions/get-prompts.js
//
// Devuelve los 6 prompts EFECTIVOS para el editor del dashboard: la versión
// guardada en Blobs si existe, o el default hardcodeado de lib/prompts.js.
// Para cada prompt indica si viene de Blobs (editado) o del default.

const { requireAuth } = require('./lib/auth');
const { DEFAULTS } = require('./lib/prompts');
const { NOMBRES_VALIDOS, readAllPrompts } = require('./lib/blobs');

exports.handler = async (event) => {
  const fail = requireAuth(event);
  if (fail) return fail;

  try {
    const guardados = await readAllPrompts();

    const prompts = NOMBRES_VALIDOS.map((nombre) => {
      const editado = Object.prototype.hasOwnProperty.call(guardados, nombre);
      return {
        nombre,
        texto: editado ? guardados[nombre] : DEFAULTS[nombre],
        fuente: editado ? 'blobs' : 'default',
      };
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true, prompts }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
