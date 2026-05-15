import axios from 'axios';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel - Common ElevenLabs Voice

/**
 * Generates speech audio from text using ElevenLabs.
 * Returns a Buffer containing the MP3 data.
 */
export async function generateSpeech(text: string, voiceId: string = DEFAULT_VOICE_ID): Promise<Buffer> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY is not configured in .env');
  }

  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      },
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      }
    );

    return Buffer.from(response.data);
  } catch (err: any) {
    console.error('[AXIS] ElevenLabs TTS Error:', err.response?.data?.toString() || err.message);
    throw new Error('Failed to generate ElevenLabs speech');
  }
}
