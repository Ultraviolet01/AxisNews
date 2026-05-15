const { ElevenLabsClient } = require('elevenlabs');
async function testGen() {
  const key = process.env.ELEVENLABS_API_KEY;
  const voice = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
  console.log(`Testing Gen with Key: ${key.substring(0,6)}... and Voice: ${voice}`);
  const client = new ElevenLabsClient({ apiKey: key });
  try {
    const audio = await client.generate({
      voice: voice,
      text: "Hello world",
      model_id: 'eleven_turbo_v2_5'
    });
    console.log("Generation Success! ✅");
  } catch (err) {
    console.log("Generation Failed! ❌");
    console.log("Error:", err.message);
    if (err.response) console.log("Response:", JSON.stringify(err.response.data));
  }
}
testGen();
