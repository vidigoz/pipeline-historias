// netlify/functions/redactor.js
//
// Disparado por Notion Automation: "cuando Estado cambie a 'Proceso'".
// En este punto TÚ ya aprobaste la estructura y cambiaste el estado a mano.

const { getPage, updatePage, getReferenciasProgramado, plain } = require('./lib/notion');
const { llamarClaude, bloqueEjemplos } = require('./lib/claude');
const { PROMPT_REDACTOR } = require('./lib/prompts');

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const pageId = body.data?.id || body.page_id;
    if (!pageId) return { statusCode: 400, body: 'Falta page_id en el payload' };

    const page = await getPage(pageId);
    const estructuraAprobada = plain(page.properties['Historia']);
    const premisa = plain(page.properties['Detalles']);

    const ejemplos = await getReferenciasProgramado('Historia', 4);
    const contexto = bloqueEjemplos(ejemplos);

    const borrador = await llamarClaude(
      PROMPT_REDACTOR + contexto,
      `Premisa: ${premisa}\n\nEstructura aprobada:\n${estructuraAprobada}`,
      2000
    );

    await updatePage(pageId, { historia: borrador, estado: 'Redactado' });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
