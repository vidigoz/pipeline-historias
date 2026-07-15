// lib/blobs.js
// Persistencia de los prompts editables en Netlify Blobs (key-value nativo).
//
// Los prompts viven aquí (no en el código) para que se puedan editar desde el
// dashboard sin redeploy. Un solo store "prompts", una key por agente.
//
// Contrato:
//   - readPrompt(nombre)         -> string guardado, o null si nunca se guardó
//   - readAllPrompts()           -> { [nombre]: string } solo con lo que exista en Blobs
//   - writePrompt(nombre, texto) -> guarda un prompt
//   - writeAllPrompts(objeto)    -> guarda varios de golpe

const { getStore } = require('@netlify/blobs');

const STORE = 'prompts';

// Nombres válidos de prompt = los mismos que exporta lib/prompts.js
const NOMBRES_VALIDOS = [
  'PROMPT_BUSCADOR_SEMILLAS',
  'PROMPT_ESTRUCTURISTA',
  'PROMPT_REDACTOR',
  'PROMPT_VERIFICADOR_HISTORICO',
  'PROMPT_CAZADOR_IA',
  'PROMPT_EDITOR_FINAL',
];

function store() {
  return getStore(STORE);
}

async function readPrompt(nombre) {
  const valor = await store().get(nombre, { type: 'text' });
  return valor ?? null; // null = nunca se guardó, el caller usa el default
}

// Si Blobs no está disponible (p. ej. netlify dev en modo estático sin
// contexto de blobs local), devuelve {} en vez de tirar: el caller cae a los
// defaults, igual que hace getPrompt() para uso agente por agente.
async function readAllPrompts() {
  const resultado = {};
  try {
    await Promise.all(
      NOMBRES_VALIDOS.map(async (nombre) => {
        const valor = await store().get(nombre, { type: 'text' });
        if (valor != null) resultado[nombre] = valor;
      })
    );
  } catch (err) {
    console.error('readAllPrompts: Blobs no disponible, usando solo defaults:', err.message);
  }
  return resultado;
}

async function writePrompt(nombre, texto) {
  if (!NOMBRES_VALIDOS.includes(nombre)) {
    throw new Error(`Nombre de prompt inválido: ${nombre}`);
  }
  await store().set(nombre, String(texto ?? ''));
}

async function writeAllPrompts(objeto) {
  const entradas = Object.entries(objeto || {}).filter(([n]) =>
    NOMBRES_VALIDOS.includes(n)
  );
  await Promise.all(entradas.map(([n, texto]) => writePrompt(n, texto)));
  return entradas.map(([n]) => n);
}

module.exports = {
  NOMBRES_VALIDOS,
  readPrompt,
  readAllPrompts,
  writePrompt,
  writeAllPrompts,
};
