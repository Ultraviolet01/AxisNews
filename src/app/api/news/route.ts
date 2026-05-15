import { NextRequest, NextResponse } from 'next/server';
import { fetchSection } from '@/lib/newsFetcher';
import redis from '@/lib/redis';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const section = searchParams.get('section') || 'world';
  
  // Calculate edition
  const hour = new Date().getUTCHours();
  const edition = (hour >= 5 && hour < 17) ? "morning" : "night";
  const cacheKey = `axis:${edition}:${section}`;

  try {
    // 1. Try Cache
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const cached = await redis.get(cacheKey);
      if (cached) return NextResponse.json(cached);
    }

    // 2. Fetch Fresh
    const data = await fetchSection(section);

    // 3. Store in Cache (12 hours)
    if (process.env.UPSTASH_REDIS_REST_URL) {
      await redis.set(cacheKey, JSON.stringify(data), { ex: 43200 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`[API NEWS] Failed for ${section}:`, error);
    return NextResponse.json({ error: true, message: error.message }, { status: 500 });
  }
}
