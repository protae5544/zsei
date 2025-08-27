const fetch = require("node-fetch");

exports.handler = async function(event, context) {
  const { messages } = JSON.parse(event.body);

  // ใช้ API Key จาก Environment Variable ของ Netlify (ตั้งในหน้า Deploy settings)
  const API_KEY = process.env.API_KEY;
  const ENDPOINT = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + API_KEY
      },
      body: JSON.stringify({
        model: "glm-4.5",
        messages,
        temperature: 0.8,
        stream: false
      })
    });
    const result = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({error: err.message})
    };
  }
};
