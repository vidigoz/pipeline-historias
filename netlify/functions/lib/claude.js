// lib/claude.js
// Wrapper simple para llamar a la API de Claude desde cualquier agente.

async function llamarClaude(systemPrompt, userMessage, maxTokens = 1500) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Claude API falló: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
}

// Arma el bloque de ejemplos de referencia que se agrega a cada system prompt
function bloqueEjemplos(ejemplos, etiqueta = 'historias ya publicadas y probadas con la audiencia') {
  if (!ejemplos.length) return '';
  return `\n\nAquí tienes ejemplos de ${etiqueta}, úsalos para calibrar tono, ritmo y fórmula (no los copies, son referencia de estilo):\n\n` +
    ejemplos.map((e, i) => `--- Ejemplo ${i + 1} ---\n${e}`).join('\n\n');
}

module.exports = { llamarClaude, bloqueEjemplos };
