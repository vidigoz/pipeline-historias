// netlify/functions/ejecutar-paso.js
//
// Dispara desde el dashboard el siguiente tramo del pipeline según el Estado
// actual de la historia. Cada click corre UN SOLO agente (una sola llamada a
// Claude) para no acercarse al timeout de 10s de Netlify Functions —
// encadenar los 4 agentes (Redactor -> Verificador -> Cazador -> Editor
// Final) en una misma invocación causaba 504 y dejaba la historia varada a
// mitad de camino, sin botón para reintentar. Ahora cada estado transitorio
// tiene su propio botón "Continuar" en el dashboard.
//
// Solo "Revision" es una parada real sin botón (revisas, creas la imagen y
// cambias a mano a "Listo"). El tramo "Semilla" -> "Estructura" ya corre solo
// desde buscador-semillas.js.
//
// Body esperado: { "page_id": "...", "estado": "Estructura" }

const { requireAuth } = require('./lib/auth');
const { updatePage } = require('./lib/notion');
const { ejecutarRedactor } = require('./redactor');
const { ejecutarVerificador } = require('./verificador-historico');
const { ejecutarCazador } = require('./cazador-ia');
const { ejecutarEditorFinal } = require('./editor-final');

// "Aprobar" en Estructura: marca el Estado como "Proceso" (tu aprobación
// queda registrada en Notion) y corre el primer agente de la cadena.
async function aprobarYContinuar(pageId) {
  await updatePage(pageId, { estado: 'Proceso' });
  await ejecutarRedactor(pageId);
}

// Estado actual de la historia -> { agente a correr, deja el estado en }
// "Semilla" no aparece aquí: el Buscador de Semillas ya encadena el
// Estructurista solo y deja la historia en "Estructura".
const PASOS = {
  Estructura: { fn: aprobarYContinuar, agente: 'Redactor', dejaEn: 'Redactado' },
  Redactado: { fn: ejecutarVerificador, agente: 'Verificador Histórico', dejaEn: 'Verificado' },
  Verificado: { fn: ejecutarCazador, agente: 'Cazador de IA', dejaEn: 'Pulido' },
  Pulido: { fn: ejecutarEditorFinal, agente: 'Editor Final', dejaEn: 'Revision' },
};

// Estados que existen pero NO disparan nada: esperan una acción manual tuya.
const ESPERA_MANUAL = {
  Revision: 'El pipeline terminó. Revisa, crea la imagen y cambia el Estado a "Listo" a mano.',
};

exports.handler = async (event) => {
  const fail = requireAuth(event);
  if (fail) return fail;

  try {
    const body = JSON.parse(event.body || '{}');
    const pageId = body.page_id;
    const estado = body.estado;

    if (!pageId) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Falta page_id.' }) };
    }
    if (!estado) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Falta estado.' }) };
    }

    if (ESPERA_MANUAL[estado]) {
      return {
        statusCode: 409,
        body: JSON.stringify({ ok: false, error: ESPERA_MANUAL[estado], esperaManual: true }),
      };
    }

    const paso = PASOS[estado];
    if (!paso) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          ok: false,
          error: `El estado "${estado}" no tiene un siguiente paso automático.`,
        }),
      };
    }

    await paso.fn(pageId);

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, agente: paso.agente, nuevoEstado: paso.dejaEn }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
