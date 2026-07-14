// netlify/functions/editor-final.js
//
// Disparado por Notion Automation: "cuando Estado cambie a 'Pulido'".
// Después de este agente, el Estado queda en "Revision" y el pipeline
// automático se detiene: ahí entras tú a analizar, crear la imagen en
// Midjourney, llenar los campos faltantes, y cambiar a "Listo" a mano.

const { getPage, updatePage, getReferenciasProgramado, plain } = require('./lib/notion');
const { llamarClaude, bloqueEjemplos } = require('./lib/claude');
const { PROMPT_EDITOR_FINAL } = require('./lib/prompts');

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const pageId = body.data?.id || body.page_id;
    if (!pageId) return { statusCode: 400, body: 'Falta page_id en el payload' };

    const page = await getPage(pageId);
    const pulido = plain(page.properties['Historia']);

    const ejemplos = await getReferenciasProgramado('Historia', 4);
    const contexto = bloqueEjemplos(ejemplos, 'historias finales ya publicadas, como benchmark de calidad');

    const final = await llamarClaude(
      PROMPT_EDITOR_FINAL + contexto,
      `Texto a editar en su última pasada:\n${pulido}`,
      2000
    );

    await updatePage(pageId, { historia: final, estado: 'Revision' });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
