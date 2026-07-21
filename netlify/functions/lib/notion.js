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

// Lee una página completa por su ID
async function getPage(pageId) {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Notion getPage falló: ${res.status} ${await res.text()}`);
  return res.json();
}

// Actualiza propiedades de texto + Estado de una página
async function updatePage(pageId, { historia, detalles, estado, sopa, lugar, anio, oficio, promptImagen }) {
  const properties = {};
  if (historia !== undefined) {
    properties['Historia'] = { rich_text: [{ text: { content: historia.slice(0, 2000) } }] };
  }
  if (detalles !== undefined) {
    properties['Detalles'] = { rich_text: [{ text: { content: detalles.slice(0, 2000) } }] };
  }
  if (estado !== undefined) {
    properties['Estado'] = { status: { name: estado } };
  }
  if (sopa !== undefined) {
    properties['Sopa'] = { rich_text: [{ text: { content: sopa.slice(0, 2000) } }] };
  }
  if (lugar !== undefined) {
    properties['Lugar'] = { rich_text: [{ text: { content: lugar.slice(0, 2000) } }] };
  }
  if (oficio !== undefined) {
    properties['Oficio'] = { rich_text: [{ text: { content: oficio.slice(0, 2000) } }] };
  }
  if (anio !== undefined) {
    properties['Año'] = { number: anio };
  }
  if (promptImagen !== undefined) {
    properties['Prompt de Imagen'] = { rich_text: [{ text: { content: promptImagen.slice(0, 2000) } }] };
  }

  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ properties }),
  });
  if (!res.ok) throw new Error(`Notion updatePage falló: ${res.status} ${await res.text()}`);
  return res.json();
}

// Crea una página nueva en vidiclip_db (la usa el Buscador de Semillas)
async function createPage({ titulo, detalles, estado }) {
  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      parent: { database_id: DB_ID },
      properties: {
        Titulo: { title: [{ text: { content: titulo } }] },
        Detalles: { rich_text: [{ text: { content: detalles } }] },
        Estado: { status: { name: estado } },
      },
    }),
  });
  if (!res.ok) throw new Error(`Notion createPage falló: ${res.status} ${await res.text()}`);
  return res.json();
}

// Trae N historias en estado "Programado" (el banco de referencia de estilo)
// campo: 'Historia' (texto final publicado) o 'Detalles' (la premisa original)
async function getReferenciasProgramado(campo = 'Historia', n = 4) {
  const res = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      filter: { property: 'Estado', status: { equals: 'Programado' } },
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
      page_size: n,
    }),
  });
  if (!res.ok) throw new Error(`Notion query falló: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.results
    .map((page) => plain(page.properties[campo]))
    .filter(Boolean);
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

module.exports = { getPage, updatePage, createPage, getReferenciasProgramado, listarHistorias, plain };
