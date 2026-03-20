// netlify/functions/claude-proxy.js
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: { message: "Method Not Allowed" } }) };

  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) return {
    statusCode: 500, headers: CORS,
    body: JSON.stringify({ error: { message: "ANTHROPIC_API_KEY mancante su Netlify. Vai su: Site settings → Environment variables → Add variable → ANTHROPIC_API_KEY. Poi Deploys → Trigger deploy." } })
  };

  if (!event.body) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: { message: "Request body vuoto" } }) };

  let body;
  try { body = JSON.parse(event.body); }
  catch (e) { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: { message: "Body non è JSON: " + e.message } }) }; }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); }
    catch { return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: { message: "Risposta non-JSON da Anthropic (HTTP " + res.status + "): " + text.slice(0, 200) } }) }; }

    return { statusCode: res.status, headers: CORS, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: { message: "Fetch error: " + err.message } }) };
  }
};
