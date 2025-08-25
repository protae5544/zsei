// netlify/functions/glm-proxy.js
const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const prompt = body.prompt;
    const model = body.model || (process.env.GLM_MODEL || 'glm-4.5');
    const temperature = typeof body.temperature === 'number'
      ? body.temperature
      : parseFloat(process.env.GLM_TEMPERATURE) || 0.7;
    const max_tokens = typeof body.max_tokens === 'number'
      ? body.max_tokens
      : parseInt(process.env.GLM_MAX_TOKENS) || 2000;
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

    let payload = { model, temperature, max_tokens, stream };
    if (body.messages && typeof body.messages === 'object') {
      payload.messages = body.messages;
    } else {
      payload.prompt = prompt;
    }

    const headers = { 'Content-Type': 'application/json' };
    if (process.env.GLM_API_KEY) {
      headers.Authorization = 'Bearer ' + process.env.GLM_API_KEY;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    let reply = '';
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.indexOf('application/json') !== -1) {
        const data = await res.json();
        if (data && data.choices) {
          // get first element without using bracket indexing
          let first = null;
          for (const ch of data.choices) {
            first = ch;
            break;
          }
          if (first) {
            if (first.delta && first.delta.content) {
              reply = first.delta.content;
            } else if (first.message && first.message.content) {
              reply = first.message.content;
            } else if (first.text) {
              reply = first.text;
            }
          }
        }
      } else {
        reply = await res.text();
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
      body: JSON.stringify({ error: err ? err.message : 'Unknown error' })
    };
  }
};
