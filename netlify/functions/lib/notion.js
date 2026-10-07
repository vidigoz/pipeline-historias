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

// Estados que le interesan al dashboard (Cancelado/Previo no se muestran
// nunca). Además de estos, la lista también incluye cualquier historia con
// alguno de los checkboxes "Carrusel" o "Lista para carrusel" palomeado,
// aunque su Estado no esté aquí: las columnas Carrusel y Listas para carrusel
// del panel filtran por esos checkboxes, no por Estado.
const ESTADOS_DASHBOARD = ['Revision', 'Listo', 'Programado'];

// Lista historias de vidiclip_db para el dashboard: título, estado,
// categoría, antigüedad, checkboxes Carrusel / Lista para carrusel, la fecha
// de publicación/programación (propiedad date de Notion) y la fecha de
// creación (created_time nativo de Notion).
//
// Filtramos en Notion (en vez de traer un top-N y filtrar en el cliente)
// porque la base tiene cientos de historias en estados que no se muestran
// (Cancelado, Previo); sin este filtro, un límite fijo de página podía dejar
// fuera historias recientes de Revision/Listo/Programado simplemente porque
// había muchas de otros estados por delante en el orden de creación. Se
// pagina hasta traer todas las que matchean, así el filtro de
// Antigüedad/Categoria en el frontend siempre tiene el conjunto completo
// disponible.
async function listarHistorias() {
  const historias = [];
  let cursor;
  do {
    const res = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        filter: {
          or: [
            ...ESTADOS_DASHBOARD.map((estado) => ({ property: 'Estado', status: { equals: estado } })),
            // Las columnas Carrusel y Listas para carrusel del panel filtran
            // por sus checkboxes, no por Estado: traemos también las
            // palomeadas cuyo Estado no esté en ESTADOS_DASHBOARD para que
            // igual aparezcan en esas columnas.
            { property: 'Carrusel', checkbox: { equals: true } },
            { property: 'Lista para carrusel', checkbox: { equals: true } },
          ],
        },
        sorts: [{ timestamp: 'created_time', direction: 'descending' }],
        page_size: 100,
        start_cursor: cursor,
      }),
    });
    if (!res.ok) throw new Error(`Notion listarHistorias falló: ${res.status} ${await res.text()}`);
    const data = await res.json();
    for (const page of data.results) {
      historias.push({
        id: page.id,
        url: page.url,
        titulo: plain(page.properties['Titulo']) || '(sin título)',
        estado: page.properties['Estado']?.status?.name || '(sin estado)',
        categoria: page.properties['Category']?.select?.name || null,
        antiguedad: page.properties['Antiguedad']?.select?.name || null,
        carrusel: !!page.properties['Carrusel']?.checkbox,
        listaCarrusel: !!page.properties['Lista para carrusel']?.checkbox,
        creado: page.created_time,
        fechaPublicacion: page.properties['Fecha de Publicacion']?.date?.start || null,
      });
    }
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return historias;
}

// Trae las opciones reales configuradas en Notion para los selects de
// Category y Antiguedad, para que los filtros del dashboard siempre
// reflejen lo que existe en la base (sin hardcodear valores que se
// desactualizan cada vez que se agrega una categoría nueva en Notion).
async function opcionesFiltro() {
  const res = await fetch(`https://api.notion.com/v1/databases/${DB_ID}`, { headers: headers() });
  if (!res.ok) throw new Error(`Notion opcionesFiltro falló: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const props = data.properties || {};
  return {
    categorias: (props['Category']?.select?.options || []).map((o) => o.name),
    antiguedades: (props['Antiguedad']?.select?.options || []).map((o) => o.name),
  };
}

module.exports = { crearHistoriaCompleta, listarHistorias, opcionesFiltro, plain };
