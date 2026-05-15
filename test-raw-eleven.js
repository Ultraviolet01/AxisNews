const axios = require('axios');
async function testRaw() {
  const key = process.env.ELEVENLABS_API_KEY;
  const voice = '21m00Tcm4TlvDq8ikWAM';
  try {
    const res = await axios.post(`https://api.elevenlabs.io/v1/text-to-speech/${voice}/stream`, {
      text: "Hello world",
      model_id: 'eleven_turbo_v2_5'
    }, {
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      responseType: 'arraybuffer'
    });
    console.log("Raw Success! ✅");
  } catch (err) {
    console.log("Raw Failed! ❌");
    if (err.response) {
      console.log("Status:", err.response.status);
      console.log("Data:", Buffer.from(err.response.data).toString());
    } else {
      console.log("Error:", err.message);
    }
  }
}
testRaw();
