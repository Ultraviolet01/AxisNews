const { fal } = require('@fal-ai/client');
const axios = require('axios');

async function testKeys() {
  console.log("Validating API Keys...");
  
  // 1. NewsAPI
  try {
    const res = await fetch(`https://newsapi.org/v2/top-headlines?country=us&apiKey=${process.env.NEWS_API_KEY}`);
    const data = await res.json();
    console.log("NewsAPI: ", data.status === 'ok' ? "VALID ✅" : `INVALID ❌ (${data.message})`);
  } catch (e) { console.log("NewsAPI: ERROR ❌", e.message); }

  // 2. Anthropic
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 10, messages: [{role:"user", content:"hi"}] })
    });
    const data = await res.json();
    console.log("Anthropic: ", res.status === 200 ? "VALID ✅" : `INVALID ❌ (${data.error?.message || 'Unknown'})`);
  } catch (e) { console.log("Anthropic: ERROR ❌", e.message); }

  // 3. ElevenLabs
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY }
    });
    console.log("ElevenLabs: ", res.status === 200 ? "VALID ✅" : `INVALID ❌ (${res.status})`);
  } catch (e) { console.log("ElevenLabs: ERROR ❌", e.message); }

  // 4. fal.ai
  try {
    const res = await fetch("https://fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: { "Authorization": `Key ${process.env.FAL_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "test" })
    });
    console.log("fal.ai: ", res.status === 200 ? "VALID ✅" : `INVALID ❌ (${res.status})`);
  } catch (e) { console.log("fal.ai: ERROR ❌", e.message); }

  // 5. HeyGen
  try {
    const res = await fetch("https://api.heygen.com/v1/video_status.get?video_id=test", {
      headers: { "X-Api-Key": process.env.HEYGEN_API_KEY }
    });
    console.log("HeyGen: ", (res.status === 200 || res.status === 400) ? "VALID ✅" : `INVALID ❌ (${res.status})`);
  } catch (e) { console.log("HeyGen: ERROR ❌", e.message); }
}

testKeys();
