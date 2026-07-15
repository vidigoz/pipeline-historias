// lib/auth.js
// Protección básica por contraseña para los endpoints del dashboard.
//
// El dashboard manda la contraseña en el header 'x-dashboard-password' en cada
// request. Aquí la comparamos contra la variable de entorno DASHBOARD_PASSWORD.
//
// Esto NO es cifrado ni auth real: es una barrera simple para que el panel
// interno de un solo usuario no quede abierto al público. Suficiente para
// este caso, no lo uses para nada sensible.

// Comparación en tiempo constante para no filtrar la contraseña por timing.
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// Devuelve null si la auth es válida, o un objeto de respuesta HTTP si falla.
// Uso: const fail = requireAuth(event); if (fail) return fail;
function requireAuth(event) {
  const esperado = process.env.DASHBOARD_PASSWORD;

  if (!esperado) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: 'DASHBOARD_PASSWORD no está configurada en el entorno.',
      }),
    };
  }

  const headers = event.headers || {};
  // Los headers en Netlify llegan en minúsculas, pero por si acaso probamos ambos.
  const recibido = headers['x-dashboard-password'] || headers['X-Dashboard-Password'];

  if (!safeEqual(recibido || '', esperado)) {
    return {
      statusCode: 401,
      body: JSON.stringify({ ok: false, error: 'Contraseña incorrecta.' }),
    };
  }

  return null;
}

module.exports = { requireAuth };
