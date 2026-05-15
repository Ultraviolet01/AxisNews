const { fetchSection } = require('./src/lib/newsFetcher');
require('dotenv').config();

async function test() {
  console.log("Testing news fetcher...");
  try {
    const data = await fetchSection('business');
    console.log("Headline:", data.headline);
    console.log("Lead:", data.lead);
    console.log("Stories:");
    data.stories.forEach((s, i) => {
      console.log(`${i+1}. ${s.title} (${s.src}) - ${s.time}`);
    });
  } catch (e) {
    console.error("Test failed:", e);
  }
}

test();
