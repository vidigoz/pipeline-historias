// netlify/functions/buscador-semillas.js
//
// Corre por HORARIO (scheduled function), no por webhook, porque su trabajo
// es crear páginas nuevas — todavía no existe un Estado que disparar.
// Configurado en netlify.toml para correr, por ejemplo, una vez por semana.

const { createPage, getReferenciasProgramado } = require('./lib/notion');
const { llamarClaude, bloqueEjemplos } = require('./lib/claude');
const { PROMPT_BUSCADOR_SEMILLAS } = require('./lib/prompts');

const HISTORIAS_POR_CORRIDA = 5; // tu patrón actual de batch semanal

exports.handler = async () => {
  try {
    const ejemplos = await getReferenciasProgramado('Historia', 5);
    const contexto = bloqueEjemplos(ejemplos);
    const creadas = [];

    for (let i = 0; i < HISTORIAS_POR_CORRIDA; i++) {
      const salida = await llamarClaude(
        PROMPT_BUSCADOR_SEMILLAS + contexto,
        `Propón una premisa nueva, distinta a las anteriores generadas en esta misma corrida: ${JSON.stringify(creadas.map((c) => c.titulo))}`,
        400
      );

      const titulo = (salida.match(/TITULO:\s*(.+)/)?.[1] || `Historia sin título ${i + 1}`).trim();
      const premisa = (salida.match(/PREMISA:\s*([\s\S]+)/)?.[1] || salida).trim();

      const pagina = await createPage({ titulo, detalles: premisa, estado: 'Semilla' });
      creadas.push({ titulo, id: pagina.id });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, creadas }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};

// Netlify Scheduled Functions requieren este export adicional con el cron:
exports.config = {
  schedule: '@weekly', // ajusta a tu ritmo real, por ejemplo '0 14 * * 1' (lunes 8am hora CDMX)
};
