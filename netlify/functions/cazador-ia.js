// netlify/functions/cazador-ia.js
//
// Disparado por Notion Automation: "cuando Estado cambie a 'Verificado'".

const { getPage, updatePage, getReferenciasProgramado, plain } = require('./lib/notion');
const { llamarClaude, bloqueEjemplos } = require('./lib/claude');
const { PROMPT_CAZADOR_IA } = require('./lib/prompts');

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const pageId = body.data?.id || body.page_id;
    if (!pageId) return { statusCode: 400, body: 'Falta page_id en el payload' };

    const page = await getPage(pageId);
    const verificado = plain(page.properties['Historia']);

    const ejemplos = await getReferenciasProgramado('Historia', 4);
    const contexto = bloqueEjemplos(ejemplos, 'historias con voz humana ya probada');

    const pulido = await llamarClaude(
      PROMPT_CAZADOR_IA + contexto,
      `Texto a pulir:\n${verificado}`,
      2000
    );

    await updatePage(pageId, { historia: pulido, estado: 'Pulido' });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
