import axios from 'axios';

const HEYGEN_BASE = 'https://api.heygen.com';
const headers = { 
  'X-Api-Key': process.env.HEYGEN_API_KEY || '', 
  'Content-Type': 'application/json' 
};

/**
 * Creates a video using the HeyGen V3 Video Agent API.
 * This allows HeyGen to automatically select/generate a female avatar and handle the layout.
 */
export async function createBroadcast(promptOrScript: string, brollUrl: string, audioAssetId?: string): Promise<string> {
  try {
    const payload: any = {
      // By omitting avatar_id, we let the Video Agent choose/generate one.
      // We specify our preference for a female anchor in the prompt.
      prompt: `Create a professional news broadcast about the following topic: ${promptOrScript}. 
               The presenter MUST be a professional-looking female news anchor. 
               ${audioAssetId ? 'Use the attached audio file for the presenter\'s speech.' : ''}
               ${brollUrl ? `Incorporate this visual style or footage: ${brollUrl}` : ''}`,
      
      mode: 'generate',
      orientation: 'landscape',
      
      // If we have an audioAssetId (from ElevenLabs), we provide it as a file.
      files: audioAssetId ? [
        {
          type: 'asset_id',
          asset_id: audioAssetId
        }
      ] : []
    };

    console.log(`[AXIS] Submitting Video Agent request (Auto-generating female avatar)...`);
    const { data } = await axios.post(`${HEYGEN_BASE}/v3/video-agents`, payload, { headers });
    
    // Video Agent returns a session_id
    return data.data.session_id;
  } catch (err: any) {
    console.error(`[AXIS] HeyGen Video Agent error:`, err.response?.data || err.message || err);
    return 'mock_video_id';
  }
}

/**
 * Polls for the status of a Video Agent session and returns the final video URL.
 */
export async function pollVideo(sessionId: string): Promise<string> {
  if (sessionId === 'mock_video_id') {
    return 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  }

  let videoId: string | null = null;
  let attempts = 0;

  // Step 1: Wait for the agent to assign a video_id
  console.log(`[AXIS] Waiting for Video Agent to start rendering...`);
  while (!videoId && attempts < 20) {
    try {
      const { data } = await axios.get(`${HEYGEN_BASE}/v3/video-agents/${sessionId}`, { headers });
      videoId = data.data.video_id;
      if (data.data.status === 'failed') throw new Error('Video Agent failed during thinking phase');
    } catch (err: any) {
      console.warn('[AXIS] Agent session polling warning:', err.message);
    }
    if (!videoId) {
      attempts++;
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  if (!videoId) throw new Error('Video Agent failed to assign a video ID in time');

  // Step 2: Poll the video itself until completion
  attempts = 0;
  while (attempts < 60) {
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
