// netlify/functions/generar-tragedias.js
//
// Agente autocontenido: en una sola llamada a Claude genera 3 historias
// medievales de tipo TRAGEDIA (spec completa en
// agentes/agente_tragedias_medievales_v1.md) y las publica directo en
// vidiclip_db con todos los campos llenos, en Estado "Revision". No hay
// pasos intermedios ni cascada — de aquí en más el flujo es 100% manual
// (el usuario revisa, sube imagen, pasa a "Listo").
//
// Bajado de 5 a 3 historias por corrida, y la fuente de inspiración de
// estilo ya no se lee en vivo de Notion (sumaba latencia de red variable):
// se embebió como texto fijo en lib/referencias.js. Ambos cambios buscan
// evitar el 504 por el límite de 10s de Netlify Functions (plan Personal,
// sin Background Functions).

const { requireAuth } = require('./lib/auth');
const { crearHistoriaCompleta } = require('./lib/notion');
const { llamarClaude } = require('./lib/claude');
const { HISTORIAS_REFERENCIA } = require('./lib/referencias');

const CATEGORY = 'Tragedia';

const SYSTEM_PROMPT = `Eres el Agente de Tragedias Medievales del canal VidiGozTV — Leyes de Greene v1.
Generas 3 historias medievales de tipo TRAGEDIA donde el personaje principal
viola una ley del poder o la naturaleza humana y sufre consecuencias fatales
o devastadoras.

## FUENTE DE INSPIRACIÓN

Se te dan como referencia historias del canal ya publicadas. Analiza los
patrones antes de escribir:
- Segunda persona singular, tono irónico y cotidiano
- Oficio medieval integrado con herramientas, riesgos y jerarquías
- Gratitud por daño menor como señal de buena fortuna
- Esposa con rasgo físico concreto y rol práctico
- Sopa específica como recompensa nocturna
- Cierre con ironía religiosa o filosófica

## LEYES A VIOLAR

Elige una ley distinta para cada una de las 3 historias. No repitas leyes
entre las 3.

Las 48 Leyes del Poder — Robert Greene:
Ley 1: Nunca opaques al maestro
Ley 2: No confíes demasiado en los amigos, aprende a usar a los enemigos
Ley 3: Oculta tus intenciones
Ley 4: Di siempre menos de lo necesario
Ley 7: Haz que otros hagan el trabajo por ti, llévate el crédito
Ley 11: Aprende a mantener a la gente dependiente de ti
Ley 14: Hazte pasar por amigo, actúa como espía
Ley 17: Cultiva un aire de imprevisibilidad
Ley 19: Sabe con quién estás tratando, no ofendas a la persona equivocada
Ley 21: Hazte más tonto que tu víctima
Ley 32: Juega con las fantasías de la gente
Ley 46: Nunca parezcas demasiado perfecto
Ley 48: Sé un camaleón, asume la forma que necesites

Las Leyes de la Naturaleza Humana — Robert Greene:
La Ley de la Irracionalidad: las emociones nublan el juicio cuando más importa
La Ley del Narcisismo: ver el mundo solo desde tu propia perspectiva
La Ley de la Envidia: exhibir el éxito entre quienes no lo tienen
La Ley del Conformismo: desafiar las creencias del grupo abiertamente
La Ley de la Negación: ignorar las señales de advertencia evidentes
La Ley de la Impulsividad: actuar antes de pensar las consecuencias
La Ley de la Represión: lo que niegas de ti mismo te destruye desde adentro
La Ley de la Actitud: tu carácter es tu destino

## BANCO DE OFICIOS MEDIEVALES

Usa 3 oficios distintos, uno por historia.

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
Oficios marginales: sepulturero, desollador, cazarratas, recaudador de
diezmos, verdugo.

## ESTRUCTURA NARRATIVA DE CADA HISTORIA

Cada historia debe tener entre 140 y 150 palabras y seguir este arco:

1. APERTURA — primera línea obligatoria con formato exacto:
   "Es el año <Año>, en <Lugar>…"
   Seguida de gratitud irónica por un daño menor de la semana.
2. EL OFICIO — descripción integrada: herramientas, riesgos, clientela,
   jerarquía, detalle material concreto.
3. EL ASCENSO O LA ACCIÓN — el personaje actúa o prospera. El error que
   comete parece razonable desde su perspectiva. No lo sabe todavía.
4. LA ADVERTENCIA IGNORADA — esposa, vecino, señal obvia. Siempre hay una.
   Siempre se ignora.
5. LA CONSECUENCIA TRÁGICA — muerte, ruina o perdición directamente
   conectada a la ley violada. La ironía entre el error y el castigo debe
   ser evidente. Puede ser física, social o económica según la historia.
6. SENTENCIA FINAL — 1 o 2 líneas que destilan la ley sin nombrar a Greene.
   Tono de refrán antiguo. Sin explicaciones. Solo la verdad.

## REGLA DE LA SOPA

Cada historia debe incluir una sopa específica y concreta, mencionada por
nombre o ingredientes. Aparece siempre en la sección del hogar, servida por
la esposa, como símbolo de la vida normal que el personaje está a punto de
perder. En el campo "sopa" del JSON de salida escribe solo el nombre de la
sopa (ej. "sopa de lentejas con romero y vinagre").

## FORMATO DEL PROMPT DE MIDJOURNEY

- Iniciar exactamente con: mediaval art image of:
- Describir escena, personajes, ambiente, época, iluminación, estilo y
  detalles visuales.
- Preferir el momento justo antes del colapso, o la ironía visual de la
  tragedia.
- Una sola línea, sin saltos de línea.

## CAMPO "detalles"

En el campo "detalles" escribe la ley violada + una descripción breve de
cómo la viola el personaje.`;

// Claude a veces devuelve saltos de línea/tabs crudos (sin escapar) dentro
// del texto de la historia, lo que rompe JSON.parse. Recorre el string
// carácter por carácter y escapa esos controles SOLO cuando están dentro de
// un string JSON (fuera de un string se dejan intactos, son el formato del
// propio JSON).
function repararControlesEnStrings(jsonTxt) {
  let out = '';
  let dentroDeString = false;
  let escapando = false;
  for (const ch of jsonTxt) {
    if (escapando) {
      out += ch;
      escapando = false;
      continue;
    }
    if (ch === '\\' && dentroDeString) {
      out += ch;
      escapando = true;
      continue;
    }
    if (ch === '"') {
      dentroDeString = !dentroDeString;
      out += ch;
      continue;
    }
    if (dentroDeString && ch === '\n') { out += '\\n'; continue; }
    if (dentroDeString && ch === '\r') { out += '\\r'; continue; }
    if (dentroDeString && ch === '\t') { out += '\\t'; continue; }
    out += ch;
  }
  return out;
}

// Parsea la respuesta de Claude: un array JSON de 3 objetos historia. Si el
// parseo directo falla (Claude no escapó bien saltos de línea/tabs dentro de
// un string), reintenta una vez con el texto reparado antes de rendirse.
function parseHistorias(salida) {
  const jsonTxt = (salida.match(/\[[\s\S]*\]/) || [])[0];
  if (!jsonTxt) throw new Error('Claude no devolvió un array JSON reconocible.');

  let arr;
  try {
    arr = JSON.parse(jsonTxt);
  } catch (err) {
    try {
      arr = JSON.parse(repararControlesEnStrings(jsonTxt));
    } catch (_) {
      throw new Error(`Claude devolvió JSON inválido: ${err.message}`);
    }
  }

  if (!Array.isArray(arr) || !arr.length) throw new Error('El JSON no contiene historias.');
  return arr;
}

async function generarTragedias() {
  const userMsg = `Fuente de inspiración (historias ya publicadas, para calibrar tono y patrones narrativos):
${HISTORIAS_REFERENCIA}

Genera 3 historias siguiendo exactamente las reglas del system prompt. No
repitas ley ni oficio entre las 3. Responde ÚNICAMENTE con un array JSON
válido, sin texto adicional ni markdown, con este esquema exacto por
historia:
[{"titulo":"","historia":"","promptImagen":"","oficio":"","anio":1234,"lugar":"","sopa":"","detalles":""}]

Importante sobre el formato JSON: el campo "historia" es texto largo en
prosa — escápalo correctamente como un string JSON de una sola línea,
usando \\n para cualquier salto de línea y \\" para comillas dobles
internas. No devuelvas saltos de línea reales (sin escapar) dentro de
ningún valor de texto.`;

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
    const resultado = await generarTragedias();
    const statusCode = resultado.errores.length ? 207 : 200;
    return { statusCode, body: JSON.stringify({ ok: true, ...resultado }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};

exports.generarTragedias = generarTragedias;
