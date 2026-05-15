import { fal } from '@fal-ai/client';

fal.config({ credentials: process.env.FAL_KEY });

export async function generateBRoll(prompt: string): Promise<string> {
  try {
    const result = await fal.subscribe('fal-ai/stable-video', {
      input: { 
        image_url: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000&auto=format&fit=crop" 
      },
      logs: true,
    });

    return (result as any).data?.video?.url ?? (result as any).video?.url ?? '';
  } catch (err: any) {
    console.error(`[AXIS] fal.ai error:`, err.message || err);
    console.warn('[AXIS] fal.ai blocked or failed, using mock B-roll');
    return 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4';
  }
}

// Also used for section thumbnails via FLUX
export async function generateThumbnail(section: string): Promise<string> {
  try {
    const prompts: Record<string, string> = {
      crypto:  'abstract blockchain nodes glowing cyan on dark background',
      stocks:  'trading floor screens green candlestick charts dramatic lighting',
      sports:  'stadium lights dramatic crowd cinematic evening',
      politics:'government building pillars dramatic evening lighting',
      tech:    'futuristic microprocessor glowing circuit lines',
      business:'high-end boardroom view over cityscape at night',
      world:   'stylized globe with digital connections glowing lines',
      entertainment: 'red carpet premier stage lights cinematic atmosphere'
    };

    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt: `Cinematic professional news background for ${section} section: ${prompts[section] || prompts.world}. Ultra high definition, 8k, photorealistic.`,
      }
    });

    return (result as any).data?.images?.[0]?.url ?? (result as any).images?.[0]?.url ?? '';
  } catch (err) {
    return `https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000&auto=format&fit=crop`; // Generic news photo
  }
}
