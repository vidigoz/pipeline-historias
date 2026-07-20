// netlify/functions/editor-final.js
//
// Disparado por Notion Automation: "cuando Estado cambie a 'Pulido'".
// Además de la última pasada del texto, este agente extrae Año, Lugar, Sopa
// y Prompt de imagen y los deja llenos en Notion. Después de este agente, el
// Estado queda en "Revision" y el pipeline automático se detiene: ahí entras
// tú a revisar, generar la imagen con el prompt ya listo, pegarla, y cambiar
// el Estado a "Listo" a mano.
//
// La lógica vive en ejecutarEditorFinal(pageId), exportada para que también la
// pueda invocar ejecutar-paso.js desde el dashboard.

const { getPage, updatePage, getReferenciasProgramado, plain } = require('./lib/notion');
const { llamarClaude, bloqueEjemplos } = require('./lib/claude');
const { getPrompt } = require('./lib/prompts');

// Parsea la salida estructurada del Editor Final:
// HISTORIA:\n<texto>\nAÑO: ..\nLUGAR: ..\nSOPA: ..\nPROMPT_IMAGEN: ..
function parseSalida(salida) {
  const historia = (salida.match(/HISTORIA:\s*([\s\S]*?)\s*AÑO:/)?.[1] || salida).trim();
  const anioTexto = salida.match(/AÑO:\s*(\d+)/)?.[1];
  const lugar = salida.match(/LUGAR:\s*(.+)/)?.[1]?.trim() || '';
  const sopa = salida.match(/SOPA:\s*([\s\S]*?)\s*PROMPT_IMAGEN:/)?.[1]?.trim() || '';
  const promptImagen = salida.match(/PROMPT_IMAGEN:\s*([\s\S]+)/)?.[1]?.trim() || '';

  return {
    historia,
    anio: anioTexto ? Number(anioTexto) : undefined,
    lugar,
    sopa,
    promptImagen,
  };
}

async function ejecutarEditorFinal(pageId) {
  const systemPrompt = await getPrompt('PROMPT_EDITOR_FINAL');
  const page = await getPage(pageId);
  const pulido = plain(page.properties['Historia']);

  const ejemplos = await getReferenciasProgramado('Historia', 4);
  const contexto = bloqueEjemplos(ejemplos, 'historias finales ya publicadas, como benchmark de calidad');

  const salida = await llamarClaude(
    systemPrompt + contexto,
    `Texto a editar en su última pasada:\n${pulido}`,
    2000
  );

  const { historia, anio, lugar, sopa, promptImagen } = parseSalida(salida);

  await updatePage(pageId, {
    historia,
    estado: 'Revision',
    anio,
    lugar,
    sopa,
    promptImagen,
  });
}

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const pageId = body.data?.id || body.page_id;
    if (!pageId) return { statusCode: 400, body: 'Falta page_id en el payload' };

    await ejecutarEditorFinal(pageId);

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};

exports.ejecutarEditorFinal = ejecutarEditorFinal;
