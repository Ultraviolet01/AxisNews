async function check(name, url) {
  const start = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    console.log(`[PASS] ${name.padEnd(12)} | Status: ${res.status} | Latency: ${Date.now() - start}ms`);
    return true;
  } catch (err) {
    console.log(`[FAIL] ${name.padEnd(12)} | Error: ${err.name} | Latency: ${Date.now() - start}ms`);
    return false;
  }
}

async function run() {
  console.log("Checking API Connectivity...");
  console.log("--------------------------");
  await check("NewsAPI", "https://newsapi.org/v2/top-headlines?apiKey=test");
  await check("Anthropic", "https://api.anthropic.com/v1/messages");
  await check("fal.ai", "https://fal.run");
  await check("ElevenLabs", "https://api.elevenlabs.io");
  await check("HeyGen", "https://api.heygen.com");
  console.log("--------------------------");
}
run();
