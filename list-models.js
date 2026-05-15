async function listModels() {
  try {
    const res = await fetch("https://api.anthropic.com/v1/models", {
      headers: { 
        "x-api-key": process.env.ANTHROPIC_API_KEY, 
        "anthropic-version": "2023-06-01" 
      }
    });
    const data = await res.json();
    console.log("Available Models:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error listing models:", e.message);
  }
}
listModels();
