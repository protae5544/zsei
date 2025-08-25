/**
 * Netlify Function: glm-proxy
 * Acts as a proxy to GLM-4.5 API to avoid exposing API keys in frontend.
 * Expects POST with JSON body:
 * {
 *   "prompt": "...",
 *   "model": "glm-4.5",
 *   "temperature": 0.7,
 *   "max_tokens": 2000,
 *   "stream": true|false
 * }
 * Uses environment variables:
 * - GLM_BASE_URL
 * - GLM_API_KEY
 * - GLM_MODEL (default glm-4.5)
 * - GLM_ENDPOINT (e.g. /glm/v1/chat/completions)
 */
exports.handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const prompt = body.prompt;
    const model = body.model || process.env.GLM_MODEL || 'glm-4.5';
    const temperature = typeof body.temperature === 'number' ? body.temperature : parseFloat(process.env.GLM_TEMPERATURE) || 0.7;
    const max_tokens = typeof body.max_tokens === 'number' ? body.max_tokens : parseInt(process.env.GLM_MAX_TOKENS) || 2000;
    const stream = !!body.stream;

    const baseUrl = (process.env.GLM_BASE_URL || '').replace(/\/+$/, '');
    const endpoint = (process.env.GLM_ENDPOINT || '/glm/v1/chat/completions');
    const url = baseUrl + endpoint;

    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'prompt is required' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Build payload adaptable to GLM-4.5 expected format
    // Try common formats: messages array or single 'prompt'
    let payload = {
      model,
      temperature,
      max_tokens,
      stream
    };

    // If GLM expects a "messages" array, we wrap accordingly
    // Here we provide both options to maximize compatibility
    if (Array.isArray(payload.messages) || (body.messages && Array.isArray(body.messages))) {
      payload.messages = body.messages || [];
    } else {
      payload.prompt = prompt;
    }

    // If GLM requires an explicit "timeout" or other fields, they can be added via env or body in future
    const headers = {
      'Content-Type': 'application/json',
    };
    if (process.env.GLM_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.GLM_API_KEY}`;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    // Normalize response to extract a textual reply
    let reply = '';
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        // Try common shapes
        if (data?.choices?.[0]?.delta?.content) {
          reply = data.choices[0].delta.content;
        } else if (data?.choices?.[0]?.message?.content) {
          reply = data.choices[0].message.content;
        } else if (data?.choices?.[0]?.text) {
          reply = data.choices[0].text;
        } else {
          // fallback: stringify
          reply = JSON.stringify(data);
        }
      } else {
        // If it's text/event-stream or plain text, collect
        const text = await res.text();
        reply = text;
      }
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply })
      };
    } else {
      const errText = await res.text();
      return {
        statusCode: res.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: errText || res.statusText })
      };
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err?.message || 'Unknown error' })
    };
  }
};
