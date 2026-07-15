// netlify/functions/ejecutar-paso.js
//
// Dispara desde el dashboard el siguiente tramo del pipeline según el Estado
// actual de la historia. Solo hay dos paradas reales que requieren tu
// intervención: "Estructura" (apruebas y cambias a mano a "Proceso") y
// "Revision" (revisas, creas la imagen y cambias a mano a "Listo"). El tramo
// "Semilla" -> "Estructura" ya corre solo desde buscador-semillas.js.
//
// Body esperado: { "page_id": "...", "estado": "Proceso" }

const { requireAuth } = require('./lib/auth');
const { ejecutarRedactor } = require('./redactor');
const { ejecutarVerificador } = require('./verificador-historico');
const { ejecutarCazador } = require('./cazador-ia');
const { ejecutarEditorFinal } = require('./editor-final');

// Desde "Proceso" (tu aprobación de la estructura) el pipeline corre solo
// hasta "Revision": Redactor -> Verificador -> Cazador de IA -> Editor Final,
// sin pararse a pedir click entre cada uno.
async function ejecutarHastaRevision(pageId) {
  await ejecutarRedactor(pageId);
  await ejecutarVerificador(pageId);
  await ejecutarCazador(pageId);
  await ejecutarEditorFinal(pageId);
}

// Estado actual de la historia -> { agente a correr, deja el estado en }
// "Semilla" no aparece aquí: el Buscador de Semillas ya encadena el
// Estructurista solo y deja la historia en "Estructura".
const PASOS = {
  Proceso: { fn: ejecutarHastaRevision, agente: 'Redactor → Verificador → Cazador de IA → Editor Final', dejaEn: 'Revision' },
};

// Estados que existen pero NO disparan nada: esperan una acción manual tuya.
const ESPERA_MANUAL = {
  Estructura: 'Revisa y aprueba la estructura, luego cambia el Estado a "Proceso" a mano.',
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
