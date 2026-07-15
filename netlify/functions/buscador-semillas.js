// netlify/functions/buscador-semillas.js
//
// Corre por HORARIO (scheduled function), no por webhook, porque su trabajo
// es crear páginas nuevas — todavía no existe un Estado que disparar.
// Configurado más abajo para correr una vez al día, 7am hora Pacífico
// (14:00 UTC; no ajusta con el cambio de horario de invierno/verano).
//
// La lógica principal vive en generarSemillas() (exportada y reutilizable),
// para que también la pueda invocar el endpoint HTTP trigger-semillas.js
// desde el botón del dashboard, sin duplicar código.

const { createPage, getReferenciasProgramado } = require('./lib/notion');
const { llamarClaude, bloqueEjemplos } = require('./lib/claude');
const { getPrompt } = require('./lib/prompts');
const { ejecutarEstructurista } = require('./estructurista');

const HISTORIAS_POR_CORRIDA = 1; // bajado de 5 para no exceder el timeout de 10s de Netlify Functions en el plan Personal

// Lógica reutilizable: genera N semillas nuevas y las crea en vidiclip_db.
// Devuelve el array de { titulo, id } de las historias creadas.
async function generarSemillas(cantidad = HISTORIAS_POR_CORRIDA) {
  const systemPrompt = await getPrompt('PROMPT_BUSCADOR_SEMILLAS');
  const ejemplos = await getReferenciasProgramado('Historia', 5);
  const contexto = bloqueEjemplos(ejemplos);
  const creadas = [];

  for (let i = 0; i < cantidad; i++) {
    const salida = await llamarClaude(
      systemPrompt + contexto,
      `Propón una premisa nueva, distinta a las anteriores generadas en esta misma corrida: ${JSON.stringify(creadas.map((c) => c.titulo))}`,
      400
    );

    const titulo = (salida.match(/TITULO:\s*(.+)/)?.[1] || `Historia sin título ${i + 1}`).trim();
    const premisa = (salida.match(/PREMISA:\s*([\s\S]+)/)?.[1] || salida).trim();

    const pagina = await createPage({ titulo, detalles: premisa, estado: 'Semilla' });
    await ejecutarEstructurista(pagina.id);
    creadas.push({ titulo, id: pagina.id });
  }

  return creadas;
}

exports.handler = async () => {
  try {
    const creadas = await generarSemillas();
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, creadas }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};

exports.generarSemillas = generarSemillas;

// Netlify Scheduled Functions requieren este export adicional con el cron:
exports.config = {
  schedule: '0 14 * * *', // 7am hora Pacífico (14:00 UTC), todos los días
};
