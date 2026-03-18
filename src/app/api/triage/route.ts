import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://52.233.240.83:8847";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id") || "0";
  const pack = request.nextUrl.searchParams.get("pack") || "";
  try {
    const res = await fetch(
      `${API_URL}/api/triage-words?user_id=${userId}&pack=${pack}`
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ words: [], total: 0 }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id") || "0";
  const body = await request.json();
  try {
    const res = await fetch(
      `${API_URL}/api/triage-result?user_id=${userId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "API error" }, { status: 502 });
  }
}
