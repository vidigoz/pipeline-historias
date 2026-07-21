// lib/notion.js
// Helpers compartidos para hablar con la base "vidiclip_db" en Notion.

const NOTION_VERSION = '2022-06-28';
const DB_ID = process.env.NOTION_VIDICLIP_DB_ID; // el ID de la data source vidiclip_db

function headers() {
  return {
    Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  };
}

// Trae el texto plano de una propiedad tipo "rich_text"
function plain(prop) {
  if (!prop) return '';
  if (prop.rich_text) return prop.rich_text.map((t) => t.plain_text).join('');
  if (prop.title) return prop.title.map((t) => t.plain_text).join('');
  return '';
}

// Crea una historia completa en vidiclip_db con todos sus campos ya llenos
// (la usan los agentes de Tragedias/Comedias, que generan la historia entera
// de un jalón, sin pasos intermedios).
async function crearHistoriaCompleta({ titulo, historia, promptImagen, category, oficio, anio, lugar, sopa, detalles, estado }) {
  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      parent: { database_id: DB_ID },
      properties: {
        Titulo: { title: [{ text: { content: titulo } }] },
        Historia: { rich_text: [{ text: { content: (historia || '').slice(0, 2000) } }] },
        'Prompt de Imagen': { rich_text: [{ text: { content: (promptImagen || '').slice(0, 2000) } }] },
        Category: { select: { name: category } },
        Oficio: { rich_text: [{ text: { content: (oficio || '').slice(0, 2000) } }] },
        Año: { number: anio ?? null },
        Lugar: { rich_text: [{ text: { content: (lugar || '').slice(0, 2000) } }] },
        Sopa: { rich_text: [{ text: { content: (sopa || '').slice(0, 2000) } }] },
        Detalles: { rich_text: [{ text: { content: (detalles || '').slice(0, 2000) } }] },
        Estado: { status: { name: estado } },
      },
    }),
  });
  if (!res.ok) throw new Error(`Notion crearHistoriaCompleta falló: ${res.status} ${await res.text()}`);
  return res.json();
}

// Lee el texto plano de todos los bloques hijos de una página normal de
// Notion (no una fila de base de datos) — se usa como fuente de inspiración
// de estilo para los agentes de Tragedias/Comedias.
async function leerContenidoPagina(pageId) {
  let cursor;
  const textos = [];
  do {
    const url = new URL(`https://api.notion.com/v1/blocks/${pageId}/children`);
    url.searchParams.set('page_size', '100');
    if (cursor) url.searchParams.set('start_cursor', cursor);
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) throw new Error(`Notion leerContenidoPagina falló: ${res.status} ${await res.text()}`);
    const data = await res.json();
    for (const block of data.results) {
      const rich = block[block.type]?.rich_text;
      if (Array.isArray(rich)) textos.push(rich.map((t) => t.plain_text).join(''));
    }
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);
  return textos.filter(Boolean).join('\n');
}

// Lista historias de vidiclip_db para el dashboard: título, estado, fecha de
// creación (created_time nativo de Notion, no requiere propiedad extra) y el id.
async function listarHistorias(n = 50) {
  const res = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
      page_size: n,
    }),
  });
  if (!res.ok) throw new Error(`Notion listarHistorias falló: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.results.map((page) => ({
    id: page.id,
    url: page.url,
    titulo: plain(page.properties['Titulo']) || '(sin título)',
    estado: page.properties['Estado']?.status?.name || '(sin estado)',
    creado: page.created_time,
  }));
}

module.exports = { crearHistoriaCompleta, leerContenidoPagina, listarHistorias, plain };
