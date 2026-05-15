const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Basic .env parser
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) acc[key.trim()] = value.split('#')[0].trim();
  return acc;
}, {});

async function testHeyGenV2() {
  console.log("Testing HeyGen API V2 Authorization...");
  try {
    const res = await axios.get('https://api.heygen.com/v2/avatars', {
      headers: { 
        'X-Api-Key': env.HEYGEN_API_KEY,
        'accept': 'application/json'
      }
    });
    console.log("HeyGen V2 Authorization: VALID ✅");
    console.log("Status:", res.status);
    console.log("Avatar Count:", res.data.data?.avatars?.length);
  } catch (err) {
    console.error("HeyGen V2 Authorization: FAILED ❌");
    console.error("Status:", err.response?.status);
    console.error("Message:", err.response?.data || err.message);
  }
}

testHeyGenV2();
