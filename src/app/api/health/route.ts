import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "pr-assistant",
    timestamp: new Date().toISOString(),
  });
}
