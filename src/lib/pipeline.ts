import { fetchSection } from './newsFetcher';
import { writeScript } from './scriptWriter';
import { generateBRoll } from './falGenerator';
import { createBroadcast, pollVideo } from './heygenRenderer';
import { captureEvent } from './posthog';
import fs from 'fs/promises';
import path from 'path';

export async function runEdition(edition: 'morning' | 'night') {
  const SECTIONS = ['world','business','politics','stocks','crypto','tech','sports','entertainment'];
  const results: Record<string, any> = {};

  for (const section of SECTIONS) {
    try {
      console.log(`[AXIS] Generating ${edition} ${section}...`);

      // 1. Fetch live news
      const { stories, headline, lead } = await fetchSection(section);
      console.log(`[AXIS] Articles fetched: ${stories.length}`);

      // 2. Write anchor script
      const script = await writeScript(section, stories, edition, headline, lead);
      console.log(`[AXIS] Script written: ${script.headline}`);

      // 3. Generate B-roll via fal.ai
      const brollUrl = await generateBRoll(script.falPrompt);
      console.log(`[AXIS] B-roll generated: ${brollUrl}`);

      // 4. Create HeyGen Broadcast using internal TTS
      console.log(`[AXIS] Creating HeyGen broadcast for ${section}...`);
      const scriptText = Array.isArray(script.talkingPoints) 
        ? `${script.lead} ${script.talkingPoints.join(' ')}`
        : script.lead;

      const videoId = await createBroadcast(scriptText, brollUrl);
      console.log(`[AXIS] Video rendering started: ${videoId}`);
      const videoUrl = await pollVideo(videoId);
      console.log(`[AXIS] Video rendered: ${videoUrl}`);

      results[section] = { ...script, videoUrl, brollUrl, generatedAt: new Date().toISOString() };

      // 7. Track generation event in PostHog
      captureEvent('broadcast_generated', { section, edition, videoUrl });

    } catch (err) {
      console.error(`[AXIS] Failed ${section}:`, err);
      if (err instanceof Error) {
        console.error(err.stack);
      }
    }
  }

  // Cache results
  await cacheEdition(edition, results);
  return results;
}

async function cacheEdition(edition: string, data: any) {
  try {
    const cacheDir = path.join(process.cwd(), 'cache');
    await fs.mkdir(cacheDir, { recursive: true });
    await fs.writeFile(
      path.join(cacheDir, `${edition}.json`),
      JSON.stringify(data, null, 2)
    );
  } catch (error) {
    console.error(`[AXIS] Cache failed for ${edition}:`, error);
  }
}
