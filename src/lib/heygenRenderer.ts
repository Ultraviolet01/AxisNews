import axios from 'axios';

const HEYGEN_BASE = 'https://api.heygen.com';
const headers = { 'X-Api-Key': process.env.HEYGEN_API_KEY || '', 'Content-Type': 'application/json' };

/**
 * Creates a video using the HeyGen V3 Video Agent API or Direct Video API.
 * Now supports passing an audioAssetId for ElevenLabs integration.
 */
export async function createBroadcast(promptOrScript: string, brollUrl: string, audioAssetId?: string): Promise<string> {
  try {
    const avatarId = process.env.HEYGEN_AVATAR_ID || 'Aria_in_a_suit_front'; 

    // If we have an audioAssetId, we MUST use the Direct Video API (/v3/videos)
    // because Video Agents currently generate their own audio from prompt.
    if (audioAssetId) {
      const payload: any = {
        type: 'avatar',
        avatar_id: avatarId,
        audio_asset_id: audioAssetId,
        background: brollUrl ? {
          type: 'video',
          url: brollUrl,
          play_style: 'fit_to_scene'
        } : {
          type: 'image',
          url: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&q=80&w=2070',
        }
      };

      const { data } = await axios.post(`${HEYGEN_BASE}/v3/videos`, payload, { headers });
      return data.data.video_id;
    }

    // Default to Video Agent for prompt-based generation (if no ElevenLabs)
    const payload = {
      prompt: `A professional news broadcast about: ${promptOrScript}. The anchor should be a professional news presenter. ${brollUrl ? `Use this visual style: ${brollUrl}` : ''}`,
      mode: 'generate',
    };

    const { data } = await axios.post(`${HEYGEN_BASE}/v3/video-agents`, payload, { headers });
    
    // Video Agent returns a session_id
    return data.data.session_id;
  } catch (err: any) {
    console.error(`[AXIS] HeyGen Video Agent error:`, err.response?.data || err.message || err);
    return 'mock_video_id';
  }
}

/**
 * Polls for the status of a Video Agent session.
 */
export async function pollVideo(sessionId: string): Promise<string> {
  if (sessionId === 'mock_video_id') {
    return 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  }

  while (true) {
    try {
      const { data } = await axios.get(`${HEYGEN_BASE}/v3/video-agents/${sessionId}`, { headers });
      const status = data.data.status;
      
      // If the agent has produced a video_id, we can return that or wait for completion
      if (status === 'completed' && data.data.video_id) {
         // Get the final video URL
         const videoRes = await axios.get(`${HEYGEN_BASE}/v3/videos/${data.data.video_id}`, { headers });
         return videoRes.data.data.video_url;
      }
      
      if (status === 'failed') throw new Error('Video Agent session failed');
      
      console.log(`[AXIS] Video Agent status: ${status}...`);
    } catch (err: any) {
      console.warn('[AXIS] Video Agent polling failed:', err.message);
    }
    await new Promise(r => setTimeout(r, 5000));
  }
}

export async function uploadAudio(audioBuffer: Buffer): Promise<string> {
  try {
    const { data } = await axios.post(`${HEYGEN_BASE}/v1/asset.upload`, audioBuffer, {
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



async function pollVideoLegacy(videoId: string): Promise<string> {
  const { data } = await axios.get(`${HEYGEN_BASE}/v1/video_status.get?video_id=${videoId}`, { headers });
  return data.data.video_url;
}
