// netlify/functions/verificador-historico.js
//
// Disparado por Notion Automation: "cuando Estado cambie a 'Redactado'".
// Este agente NO usa historias de "Programado" como referencia — su trabajo
// es exactitud histórica, no calibrar tono.

const { getPage, updatePage, plain } = require('./lib/notion');
const { llamarClaude } = require('./lib/claude');
const { PROMPT_VERIFICADOR_HISTORICO } = require('./lib/prompts');

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const pageId = body.data?.id || body.page_id;
    if (!pageId) return { statusCode: 400, body: 'Falta page_id en el payload' };

    const page = await getPage(pageId);
    const borrador = plain(page.properties['Historia']);
    const anio = page.properties['Año']?.number;
    const lugar = plain(page.properties['Lugar']);
    const oficio = plain(page.properties['Oficio']);

    const contextoDatos = `Año declarado: ${anio || 'no especificado'}\nLugar: ${lugar || 'no especificado'}\nOficio: ${oficio || 'no especificado'}\n\nTexto a verificar:\n${borrador}`;

    const verificado = await llamarClaude(PROMPT_VERIFICADOR_HISTORICO, contextoDatos, 2000);

    await updatePage(pageId, { historia: verificado, estado: 'Verificado' });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
