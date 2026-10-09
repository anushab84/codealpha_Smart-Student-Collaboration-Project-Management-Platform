async function generateAssistantText({ system, user }) {
  const endpoint = process.env.AI_API_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;
  if (!endpoint || !apiKey || !model) {
    const error = new Error('AI assistant is not configured. Set AI_API_URL, AI_API_KEY, and AI_MODEL on the backend.');
    error.status = 503;
    throw error;
  }
  let url;
  try { url = new URL(endpoint); } catch { const error = new Error('AI_API_URL must be a valid HTTPS URL'); error.status = 500; throw error; }
  if (url.protocol !== 'https:' && process.env.NODE_ENV === 'production') { const error = new Error('AI_API_URL must use HTTPS in production'); error.status = 500; throw error; }
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], temperature: 0.4 }),
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) { const error = new Error(`AI provider returned HTTP ${response.status}`); error.status = 502; throw error; }
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) { const error = new Error('AI provider returned no assistant text'); error.status = 502; throw error; }
  return content.trim().slice(0, 12000);
}

module.exports = { generateAssistantText };
