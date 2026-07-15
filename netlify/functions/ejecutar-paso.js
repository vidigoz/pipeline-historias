// netlify/functions/ejecutar-paso.js
//
// Dispara manualmente el agente que corresponde al Estado actual de una
// historia, pasándole el page_id. Útil para probar un agente sin depender del
// webhook de Notion.
//
// El mapa respeta la cadena real del pipeline, incluyendo el hueco de
// aprobación manual: el estructurista deja el estado en "Estructura", pero
// Victor lo revisa y lo cambia a "Proceso" a mano antes de que corra el
// redactor. Por eso "Estructura" NO dispara nada automáticamente.
//
// Body esperado: { "page_id": "...", "estado": "Semilla" }

const { requireAuth } = require('./lib/auth');
const { ejecutarEstructurista } = require('./estructurista');
const { ejecutarRedactor } = require('./redactor');
const { ejecutarVerificador } = require('./verificador-historico');
const { ejecutarCazador } = require('./cazador-ia');
const { ejecutarEditorFinal } = require('./editor-final');

// Estado actual de la historia -> { agente a correr, deja el estado en }
const PASOS = {
  Semilla: { fn: ejecutarEstructurista, agente: 'Estructurista', dejaEn: 'Estructura' },
  Proceso: { fn: ejecutarRedactor, agente: 'Redactor', dejaEn: 'Redactado' },
  Redactado: { fn: ejecutarVerificador, agente: 'Verificador Histórico', dejaEn: 'Verificado' },
  Verificado: { fn: ejecutarCazador, agente: 'Cazador de IA', dejaEn: 'Pulido' },
  Pulido: { fn: ejecutarEditorFinal, agente: 'Editor Final', dejaEn: 'Revision' },
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
