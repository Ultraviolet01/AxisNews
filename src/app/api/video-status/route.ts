import { NextRequest, NextResponse } from 'next/server';
import { getBroadcastStatus } from '@/lib/heygenRenderer';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
  }

  const result = await getBroadcastStatus(id);
  return NextResponse.json(result);
}
