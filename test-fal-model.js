const { fal } = require('@fal-ai/client');
async function test() {
  try {
    const result = await fal.subscribe('fal-ai/stable-video-diffusion', {
      input: { image_url: "https://fal.media/files/monkey/9uS6nU-Q6-Z3u-n-u-Q6-Z.png" }
    });
    console.log("SVD working:", !!result);
  } catch (e) {
    console.log("SVD failed:", e.message);
  }
}
test();
