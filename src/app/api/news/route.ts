import { NextRequest, NextResponse } from 'next/server';
import { fetchSection } from '@/lib/newsFetcher';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const section = searchParams.get('section') || 'world';

  try {
    const data = await fetchSection(section);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`[API NEWS] Failed for ${section}:`, error);
    return NextResponse.json({ error: true, message: error.message }, { status: 500 });
  }
}
