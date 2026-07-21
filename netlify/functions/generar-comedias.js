// netlify/functions/generar-comedias.js
//
// Agente autocontenido: en una sola llamada a Claude genera 3 historias
// medievales de tipo COMEDIA (spec completa en
// agentes/agente_historias_medievales_v3.md) y las publica directo en
// vidiclip_db con todos los campos llenos, en Estado "Revision". No hay
// pasos intermedios ni cascada — de aquí en más el flujo es 100% manual
// (el usuario revisa, sube imagen, pasa a "Listo").
//
// Bajado de 5 a 3 historias por corrida: generar 5 historias completas en
// una sola llamada a Claude superaba el límite de 10s de Netlify Functions
// (plan Personal, sin Background Functions) y daba 504.

const { requireAuth } = require('./lib/auth');
const { leerContenidoPagina, crearHistoriaCompleta } = require('./lib/notion');
const { llamarClaude } = require('./lib/claude');

// ID de la página de Notion "Top 10 historia", usada como fuente de
// inspiración de estilo (no una fila de vidiclip_db).
const PAGE_ID_FUENTE = '31cd33622b91805eb346e9d2066efa72';
const CATEGORY = 'Comedia';

const SYSTEM_PROMPT = `Eres el Agente de Historias Medievales del canal VidiGozTV — v3 (Comedias).
Generas 3 historias medievales de tipo COMEDIA, con final positivo o
irónico, nunca trágico.

## FUENTE DE INSPIRACIÓN

Se te da como referencia el contenido de "Top 10 historia" en Notion.
Analiza las historias y extrae patrones repetidos, por ejemplo:
- Sopas y comida como símbolo recurrente
- Esposas con características físicas particulares
- Oficios antiguos o moralmente cuestionados
- Personas que, aun con un oficio considerado malo, lo hacen bien y parecen
  bendecidas

Antes de escribir: lee las historias, identifica los patrones que más se
repiten, y úsalos como guías creativas para las 3 historias nuevas.

## REGLAS PARA VARIAR LOS OFICIOS (MUY IMPORTANTE)

- Usa 3 oficios distintos, uno por historia. No los repitas entre sí.
- Prefiere oficios menos obvios además de los típicos (verdugo, médico,
  inquisidor, etc.).
- El oficio debe estar completamente integrado en la historia: herramientas,
  riesgos, clientela, pagos, jerarquías (gremio, abadía, conde), y un
  detalle material (sopa, grasa, vinagre, cuero, sal, hierro, etc.).

## BANCO DE OFICIOS MEDIEVALES (elige y mezcla)

Alimentación: panadero, molinero, carnicero, cervecero, quesero, salador de
carnes, cocinero de abadía.
Textiles y cuero: curtidor, zapatero, tejedor, tintorero, pellejero,
guarnicionero.
Construcción y madera: cantero, carpintero, techador, albañil, tonelero,
leñador, aserrador.
Metal y fuego: herrero, armero, calderero, campanero, fundidor, acuñador.
Transporte y comercio: carretero, barquero, arriero, mercader itinerante,
cambista.
Salud y cuidados: boticario, barbero-cirujano, partera, sangrador.
Campo y animales: pastor, porquero, halconero, apicultor, quesero de campo,
esquilador.
Religión y manuscritos: amanuense, iluminador, encuadernador, campanero,
sacristán.
Oficios marginales: sepulturero, desollador, cazarratas, ladrón de tumbas,
recaudador de diezmos, verdugo (usar con moderación).

Puedes inventar variantes plausibles siempre que se sientan medievales y
creíbles.

## FORMATO DE CADA HISTORIA

Cada historia debe cumplir exactamente:
- Inicio obligatorio (primera línea exacta): "Es el año <Año>, en <Lugar>…"
  Ejemplo: "Es el año 1344, en Brujas…"
- Longitud: entre 140 y 150 palabras.
- La historia debe comenzar con esa línea y continuar inmediatamente.
- Tono: segunda persona, gratitud irónica, detalles físicos, sopa al final,
  cierre religioso. El personaje prospera o sobrevive pese a las
  circunstancias adversas. Final positivo o irónico, nunca trágico.

## REGLA DE LA SOPA

Cada historia debe incluir una sopa específica y concreta, mencionada por
nombre o ingredientes. Aparece siempre en la sección del hogar, servida por
la esposa, como símbolo de recompensa y vida cotidiana. En el campo "sopa"
del JSON de salida escribe solo el nombre de la sopa (ej. "sopa de nabos
con tocino").

## FORMATO DEL PROMPT DE MIDJOURNEY

- Debe iniciar exactamente con: mediaval art image of:
- Debe describir escena, personajes, ambiente, época, iluminación, estilo y
  detalles visuales.
- Debe estar en una sola línea, sin saltos de línea.

## CAMPO "detalles"

Deja el campo "detalles" como cadena vacía ("").`;

// Parsea la respuesta de Claude: un array JSON de 3 objetos historia.
function parseHistorias(salida) {
  const jsonTxt = (salida.match(/\[[\s\S]*\]/) || [])[0];
  if (!jsonTxt) throw new Error('Claude no devolvió un array JSON reconocible.');
  const arr = JSON.parse(jsonTxt);
  if (!Array.isArray(arr) || !arr.length) throw new Error('El JSON no contiene historias.');
  return arr;
}

async function generarComedias() {
  const inspiracion = await leerContenidoPagina(PAGE_ID_FUENTE);

  const userMsg = `Fuente de inspiración (Top 10 historia, para calibrar tono y patrones narrativos):
${inspiracion}

Genera 3 historias siguiendo exactamente las reglas del system prompt. No
repitas oficio entre las 3. Responde ÚNICAMENTE con un array JSON válido,
sin texto adicional ni markdown, con este esquema exacto por historia:
[{"titulo":"","historia":"","promptImagen":"","oficio":"","anio":1234,"lugar":"","sopa":"","detalles":""}]`;

  const salida = await llamarClaude(SYSTEM_PROMPT, userMsg, 4000);
  const historias = parseHistorias(salida);

  const creadas = [];
  const errores = [];
  for (const h of historias) {
    try {
      const pagina = await crearHistoriaCompleta({
        titulo: h.titulo,
        historia: h.historia,
        promptImagen: h.promptImagen,
        category: CATEGORY,
        oficio: h.oficio,
        anio: h.anio,
        lugar: h.lugar,
        sopa: h.sopa,
        detalles: h.detalles,
        estado: 'Revision',
      });
      creadas.push({ titulo: h.titulo, id: pagina.id });
    } catch (err) {
      errores.push({ titulo: h.titulo || '(sin título)', error: err.message });
    }
  }
  return { creadas, errores };
}

exports.handler = async (event) => {
  const fail = requireAuth(event);
  if (fail) return fail;

  try {
    const resultado = await generarComedias();
    const statusCode = resultado.errores.length ? 207 : 200;
    return { statusCode, body: JSON.stringify({ ok: true, ...resultado }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};

exports.generarComedias = generarComedias;
