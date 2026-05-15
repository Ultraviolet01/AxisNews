const axios = require('axios');
const fs = require('fs');

// Basic .env parser
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) acc[key.trim()] = value.split('#')[0].trim();
  return acc;
}, {});

const HEYGEN_BASE = 'https://api.heygen.com';
const headers = { 
  'X-Api-Key': env.HEYGEN_API_KEY, 
  'Content-Type': 'application/json' 
};

async function testGeneration() {
  console.log("🚀 Starting Test HeyGen Video Generation...");
  console.log("Using Avatar:", env.HEYGEN_AVATAR_ID || 'Aria_in_a_suit_front');
  
  const payload = {
    video_inputs: [{
      character: {
        type: 'avatar',
        avatar_id: env.HEYGEN_AVATAR_ID || 'Aria_in_a_suit_front',
        avatar_style: 'normal'
      },
      voice: { 
        type: 'text', 
        voice_id: env.HEYGEN_VOICE_ID || '21m00Tcm4TlvDq8ikWAM',
        input_text: "Hello! This is a test broadcast to verify that the HeyGen API is working correctly after funding. Everything seems to be looking good."
      }
    }],
    dimension: { width: 1280, height: 720 }
  };

  try {
    const { data } = await axios.post(`${HEYGEN_BASE}/v2/video/generate`, payload, { headers });
    const videoId = data.data.video_id;
    console.log("✅ Success! Video ID created:", videoId);
    console.log("Waiting for rendering... (this may take a minute)");

    // Polling
    let attempts = 0;
    while (attempts < 20) {
      const statusRes = await axios.get(`${HEYGEN_BASE}/v1/video_status.get?video_id=${videoId}`, { headers });
      const status = statusRes.data.data.status;
      console.log(`[${new Date().toLocaleTimeString()}] Status: ${status}`);
      
      if (status === 'completed') {
        console.log("🎉 Video is READY!");
        console.log("URL:", statusRes.data.data.video_url);
        return;
      }
      if (status === 'failed') {
        console.error("❌ Rendering failed!");
        return;
      }
      
      attempts++;
      await new Promise(r => setTimeout(r, 10000)); // Wait 10s
    }
    console.log("⏰ Polling timed out, but the video is likely still rendering. Check your HeyGen dashboard.");
  } catch (err) {
    console.error("❌ Error generating video:", err.response?.data || err.message);
  }
}

testGeneration();
