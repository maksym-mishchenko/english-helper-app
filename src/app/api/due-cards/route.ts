import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://52.233.240.83:8847";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id");
  if (!userId) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  const res = await fetch(
    `${API_URL}/api/due-cards?user_id=${userId}&limit=20`
  );
  const data = await res.json();
  return NextResponse.json(data);
}
