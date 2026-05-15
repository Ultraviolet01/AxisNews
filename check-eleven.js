async function checkElevenLabs() {
  const key = process.env.ELEVENLABS_API_KEY;
  console.log(`Checking ElevenLabs Key: ${key.substring(0, 6)}...`);
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/user/subscription", {
      headers: { "xi-api-key": key }
    });
    const data = await res.json();
    if (res.status === 200) {
      console.log("Subscription Status: VALID ✅");
      console.log(`Character Limit: ${data.character_limit}`);
      console.log(`Character Count: ${data.character_count}`);
      console.log(`Remaining: ${data.character_limit - data.character_count}`);
    } else {
      console.log(`Subscription Status: INVALID ❌ (${res.status})`);
      console.log("Response:", JSON.stringify(data));
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}
checkElevenLabs();
