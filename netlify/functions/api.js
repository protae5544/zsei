// netlify/functions/api.js
exports.handler = async (event) => {
  const { message } = JSON.parse(event.body);
  const API_KEY = '129f747ce9fd44c28a3358a73dbb0173.1TQiPjq06MUytu5P'; // API key ซ่อนที่นี่ (ปลอดภัย)

  try {
    const response = await fetch('https://api.z.ai/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en-US,en',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'glm-4.5',
        messages: [{ role: 'user', content: message }],
        max_tokens: 4096,
        temperature: 0.6
      })
    });

    const data = await response.json();
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (error) {
    return { statusCode: 500, body: error.message };
  }
};
