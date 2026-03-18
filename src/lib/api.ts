// Use relative paths — calls go to Next.js API route proxies (avoids mixed content)
const API_BASE = "";

export async function fetchDueCards(userId: number) {
  const res = await fetch(`${API_BASE}/api/due-cards?user_id=${userId}`);
  return res.json();
}

export async function submitAnswer(
  userId: number,
  vocabId: string,
  quality: string,
  quizType: string = "type_translation"
) {
  const res = await fetch(`${API_BASE}/api/answer?user_id=${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vocab_id: vocabId, quality, quiz_type: quizType }),
  });
  return res.json();
}

export async function fetchStats(userId: number) {
  const res = await fetch(`${API_BASE}/api/stats?user_id=${userId}`);
  return res.json();
}
