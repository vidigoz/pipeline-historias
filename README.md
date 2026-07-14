# Pipeline Editorial — Historias VidiGozTV

Seis agentes que corren sobre la base de Notion `vidiclip_db`, con dos paradas
manuales tuyas (después de `Estructura` y después de `Revision`).

## Mapa de estados

```
Programado  ─────────────────────────────────────────────┐  (banco de referencia,
                                                            historias ya publicadas)
                                                            │
[Buscador de Semillas]  ← corre por horario, no por webhook │ usado como
        │                                                   │ ejemplo por
        ▼ crea página nueva                                 │ los agentes
     Semilla                                                │ 1, 2, 3, 5, 6
        │
[Estructurista] ← usa Programado como referencia
        │
        ▼
     Estructura  ────────► TÚ revisas y apruebas
        │
        ▼ (cambias el estado a mano)
     Proceso
        │
[Redactor] ← usa Programado como referencia
        │
        ▼
     Redactado
        │
[Verificador Histórico] ← NO usa Programado, solo revisa exactitud
        │
        ▼
     Verificado
        │
[Cazador de IA] ← usa Programado como referencia
        │
        ▼
     Pulido
        │
[Editor Final] ← usa Programado como referencia
        │
        ▼
     Revision  ────────► TÚ analizas, creas imagen en Midjourney,
        │                llenas campos faltantes
        ▼ (cambias el estado a mano)
     Listo ──► videoclip ──► Cloudflare ──► Buffer ──► Canal
```

## 1. Variables de entorno en Netlify

En tu proyecto de Netlify → Site settings → Environment variables:

- `NOTION_API_KEY` — el token de tu integración interna de Notion
- `NOTION_VIDICLIP_DB_ID` — el ID de la data source `vidiclip_db`:
  `33ed3362-2b91-80c9-a00a-000b9ebc5f17`
- `ANTHROPIC_API_KEY` — tu clave de la API de Anthropic

## 2. Dar acceso a la integración de Notion

En Notion, abre `vidiclip_db` → `···` → Connections → agrega tu integración
interna (la misma que usa `NOTION_API_KEY`), si no la tiene ya.

## 3. Configurar las Notion Automations

Dentro de `vidiclip_db`, botón de rayo (⚡ Automations) → crear una automation
por cada transición. Cada una dispara un webhook hacia la URL de la función
correspondiente en Netlify:

| Cuando Estado cambia a... | Dispara el webhook a... |
|---|---|
| `Semilla` | `https://TU-SITIO.netlify.app/.netlify/functions/estructurista` |
| `Proceso` | `https://TU-SITIO.netlify.app/.netlify/functions/redactor` |
| `Redactado` | `https://TU-SITIO.netlify.app/.netlify/functions/verificador-historico` |
| `Verificado` | `https://TU-SITIO.netlify.app/.netlify/functions/cazador-ia` |
| `Pulido` | `https://TU-SITIO.netlify.app/.netlify/functions/editor-final` |

`Revision` y `Listo` NO llevan automation — son las dos paradas donde entras tú.

Notion manda el ID de la página en el payload del webhook (`data.id`). Todas
las funciones ya están preparadas para leerlo así.

## 4. El Buscador de Semillas corre solo, por horario

No necesita Automation de Notion. Netlify lo dispara según el `schedule` que
está declarado dentro del propio archivo (`@weekly` por defecto — ajústalo a
tu ritmo real, por ejemplo un cron exacto para el día que armas tu batch).

## 5. Antes de dejarlo correr solo

Los prompts en `lib/prompts.js` son un punto de partida, no la versión final.
Cada uno hay que probarlo contigo, historia por historia, y ajustar la voz
hasta que realmente suene a VidiGozTV. Recomiendo correr el pipeline manual
(invocando cada función a mano desde el navegador o con `curl`) sobre 2-3
historias antes de confiar en las Automations disparándolo todo solo.

## Instalar y desplegar

```bash
npm install -g netlify-cli
netlify init
netlify deploy --prod
```
