import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST() {
  try {
    const { data } = await axios.post(
      'https://api.heygen.com/v1/streaming.create_token',
      {},
      { headers: { 'X-Api-Key': process.env.HEYGEN_API_KEY || '' } }
    );
    return NextResponse.json({ token: data.data.token });
  } catch (error: any) {
    console.error('[HeyGen Token] Failed:', error?.response?.data ?? error.message);
    return NextResponse.json({ error: 'Failed to obtain session token' }, { status: 500 });
  }
}
