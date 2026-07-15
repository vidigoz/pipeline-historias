// netlify/functions/estructurista.js
//
// Disparado por Notion Automation: "cuando Estado cambie a 'Semilla'".
// Notion manda el webhook con el ID de la página en el payload.
//
// La lógica vive en ejecutarEstructurista(pageId), exportada para que también
// la pueda invocar ejecutar-paso.js desde el dashboard.

const { getPage, updatePage, getReferenciasProgramado, plain } = require('./lib/notion');
const { llamarClaude, bloqueEjemplos } = require('./lib/claude');
const { getPrompt } = require('./lib/prompts');

async function ejecutarEstructurista(pageId) {
  const systemPrompt = await getPrompt('PROMPT_ESTRUCTURISTA');
  const page = await getPage(pageId);
  const premisa = plain(page.properties['Detalles']);

  const ejemplos = await getReferenciasProgramado('Historia', 4);
  const contexto = bloqueEjemplos(ejemplos, 'estructuras de historias ya publicadas');

  const estructura = await llamarClaude(
    systemPrompt + contexto,
    `Premisa: ${premisa}`,
    800
  );

  await updatePage(pageId, { historia: estructura, estado: 'Estructura' });
}

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const pageId = body.data?.id || body.page_id;
    if (!pageId) return { statusCode: 400, body: 'Falta page_id en el payload' };

    await ejecutarEstructurista(pageId);

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};

exports.ejecutarEstructurista = ejecutarEstructurista;
