import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { generateBRoll } from '@/lib/falGenerator';
import { createBroadcast, pollVideo, uploadAudio } from '@/lib/heygenRenderer';
import { generateSpeech } from '@/lib/elevenlabs';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    // 1. Claude writes the broadcast script for this query
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ 
        role: 'user', 
        content: `You are ARIA from AXIS News. Generate a live news broadcast about: "${query}".
        Return JSON only: { 
          "headline": "string", 
          "section": "world|business|politics|stocks|crypto|tech|sports|entertainment", 
          "lead": "string", 
          "stories": [{ "title": "string", "src": "string", "time": "string", "tag": "string", "views": "string", "hasClip": boolean }],
          "dataSources": ["string"], 
          "fal_prompt": "string", 
          "scriptText": "string" 
        }` 
      }]
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
    const script = JSON.parse(text.replace(/```json|```/g, '').trim());

    // 2. Generate B-roll
    const brollUrl = await generateBRoll(script.fal_prompt);
    const scriptText = script.scriptText || script.lead;

    // 3. Optional: ElevenLabs Voice Pipeline
    let audioAssetId: string | undefined;
    if (process.env.ELEVENLABS_API_KEY) {
      try {
        console.log('[AXIS] Generating ElevenLabs audio...');
        const audioBuffer = await generateSpeech(scriptText);
        console.log('[AXIS] Uploading audio to HeyGen...');
        audioAssetId = await uploadAudio(audioBuffer);
      } catch (err) {
        console.error('[AXIS] ElevenLabs/Upload failed, falling back to native TTS:', err);
      }
    }

    // 4. Render video using HeyGen
    const videoId  = await createBroadcast(scriptText, brollUrl, audioAssetId);
    const videoUrl = await pollVideo(videoId);

    return NextResponse.json({ ...script, videoUrl, brollUrl });
  } catch (error: any) {
    console.error('[AXIS SEARCH API] Generation failed:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
