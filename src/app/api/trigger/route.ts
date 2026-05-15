import { runEdition } from "@/lib/pipeline";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { edition } = await req.json();
    const result = await runEdition(edition ?? 'morning');
    return NextResponse.json({ ok: true, result });
  } catch (error: any) {
    console.error('[AXIS API] Manual trigger failed:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
