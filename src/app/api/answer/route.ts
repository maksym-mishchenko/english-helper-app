import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://52.233.240.83:8847";

export async function POST(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id");
  if (!userId) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  const body = await req.json();
  const res = await fetch(`${API_URL}/api/answer?user_id=${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data);
}
