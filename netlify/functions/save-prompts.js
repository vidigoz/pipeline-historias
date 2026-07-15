// netlify/functions/save-prompts.js
//
// Guarda uno o varios prompts editados en Netlify Blobs. El dashboard tiene un
// botón "Guardar" por agente, así que normalmente llega un solo prompt, pero
// acepta varios de golpe también.
//
// Body esperado:
//   { "prompts": { "PROMPT_REDACTOR": "nuevo texto...", ... } }

const { requireAuth } = require('./lib/auth');
const { NOMBRES_VALIDOS, writeAllPrompts } = require('./lib/blobs');

exports.handler = async (event) => {
  const fail = requireAuth(event);
  if (fail) return fail;

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'Usa POST.' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const prompts = body.prompts;

    if (!prompts || typeof prompts !== 'object') {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: 'Falta el objeto "prompts".' }),
      };
    }

    // Rechaza nombres desconocidos en vez de ignorarlos en silencio.
    const desconocidos = Object.keys(prompts).filter((n) => !NOMBRES_VALIDOS.includes(n));
    if (desconocidos.length) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: `Prompts desconocidos: ${desconocidos.join(', ')}` }),
      };
    }

    const guardados = await writeAllPrompts(prompts);
    return { statusCode: 200, body: JSON.stringify({ ok: true, guardados }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
