import axios from 'axios';

const HEYGEN_BASE = 'https://api.heygen.com';
const headers = { 
  'X-Api-Key': process.env.HEYGEN_API_KEY || '', 
  'Content-Type': 'application/json' 
};

/**
 * Creates a video using the HeyGen V3 Direct Video API.
 * This API provides maximum control over the avatar, engine, and backgrounds.
 */
export async function createBroadcast(promptOrScript: string, brollUrl: string, audioAssetId?: string): Promise<string> {
  try {
    const avatarId = process.env.HEYGEN_AVATAR_ID || 'Aria_in_a_suit_front';
    const engineType = process.env.HEYGEN_ENGINE || 'avatar_iv'; // 'avatar_v' for high quality
    const captionStyle = process.env.HEYGEN_CAPTION_STYLE || 'default';

    const payload: any = {
      type: 'avatar',
      avatar_id: avatarId,
      // If we have pre-recorded audio (from ElevenLabs), use it. 
      // Otherwise, we fallback to text-to-speech script.
      ...(audioAssetId ? { audio_asset_id: audioAssetId } : { script: promptOrScript }),
      
      background: brollUrl ? {
        type: 'video',
        url: brollUrl,
        play_style: 'fit_to_scene'
      } : {
        type: 'color',
        value: '#001529', // Deep news blue fallback
      },
      
      // Professional news captions
      caption: {
        style: captionStyle
      },

      // Engine configuration
      engine: {
        type: engineType
      },

      aspect_ratio: '16:9',
      resolution: '1080p'
    };

    console.log(`[AXIS] Submitting V3 Video request with engine: ${engineType}...`);
    const { data } = await axios.post(`${HEYGEN_BASE}/v3/videos`, payload, { headers });
    
    // Direct Video returns a video_id immediately
    return data.data.video_id;
  } catch (err: any) {
    console.error(`[AXIS] HeyGen V3 Video error:`, err.response?.data || err.message || err);
    return 'mock_video_id';
  }
}

/**
 * Polls for the status of a Video.
 */
export async function pollVideo(videoId: string): Promise<string> {
  if (videoId === 'mock_video_id') {
    return 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  }

  let attempts = 0;
  while (attempts < 60) { // Max 10 minutes (60 * 10s)
    try {
      const { data } = await axios.get(`${HEYGEN_BASE}/v3/videos/${videoId}`, { headers });
      const status = data.data.status;
      
      if (status === 'completed') {
         console.log(`[AXIS] Video ${videoId} is READY!`);
         return data.data.video_url;
      }
      
      if (status === 'failed') {
        const error = data.data.failure_message || 'Unknown error';
        throw new Error(`HeyGen rendering failed: ${error}`);
      }
      
      console.log(`[AXIS] Video ${videoId} status: ${status}...`);
    } catch (err: any) {
      console.warn('[AXIS] Video polling warning:', err.message);
      if (err.message.includes('failed')) throw err;
    }
    
    attempts++;
    await new Promise(r => setTimeout(r, 10000));
  }
  
  throw new Error('Video polling timed out');
}

/**
 * Uploads an audio buffer to HeyGen assets.
 */
export async function uploadAudio(audioBuffer: Buffer): Promise<string> {
  try {
    const { data } = await axios.post(`${HEYGEN_BASE}/v3/assets`, audioBuffer, {
      headers: {
        ...headers,
        'Content-Type': 'audio/mpeg'
      }
    });
    return data.data.asset_id;
  } catch (err: any) {
    console.error(`[AXIS] HeyGen audio upload error:`, err.response?.data || err.message || err);
    throw err;
  }
}
