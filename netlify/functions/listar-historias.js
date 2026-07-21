// netlify/functions/listar-historias.js
//
// Devuelve la lista de historias de vidiclip_db para la tabla del dashboard:
// título, estado y fecha de creación. El dashboard solo muestra las que
// están en "Revision", esperando que el usuario suba la imagen y pase el
// Estado a "Listo" a mano.

const { requireAuth } = require('./lib/auth');
const { listarHistorias } = require('./lib/notion');

exports.handler = async (event) => {
  const fail = requireAuth(event);
  if (fail) return fail;

  try {
    const historias = await listarHistorias(50);
    return { statusCode: 200, body: JSON.stringify({ ok: true, historias }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
