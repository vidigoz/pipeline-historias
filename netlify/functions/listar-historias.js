// netlify/functions/listar-historias.js
//
// Devuelve la lista de historias de vidiclip_db para la tabla del dashboard:
// título, estado, categoría, antigüedad y fecha de creación. El dashboard
// muestra por separado las que están en "Revision" (esperando que el
// usuario suba la imagen y pase el Estado a "Listo" a mano) y las que ya
// quedaron en "Listo". También devuelve las opciones reales de Categoria/
// Antiguedad configuradas en Notion, para poblar los filtros del panel.

const { requireAuth } = require('./lib/auth');
const { listarHistorias, opcionesFiltro } = require('./lib/notion');

exports.handler = async (event) => {
  const fail = requireAuth(event);
  if (fail) return fail;

  try {
    const [historias, opciones] = await Promise.all([listarHistorias(), opcionesFiltro()]);
    return { statusCode: 200, body: JSON.stringify({ ok: true, historias, opciones }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
