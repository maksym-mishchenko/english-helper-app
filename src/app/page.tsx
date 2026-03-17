"use client";

import { useEffect, useState } from "react";
import { getTelegramUser, closeMiniApp } from "@/lib/telegram";
import { fetchDueCards, submitAnswer, fetchStats } from "@/lib/api";

interface Card {
  id: string;
  word: string;
  definition: string;
  example: string;
  category: string;
  interval_days: number;
  repetitions: number;
}

interface Stats {
  xp?: number;
  level?: number;
  level_name?: string;
  current_streak?: number;
  total_words?: number;
}

interface AnswerResult {
  xp_earned?: number;
}

type Mode = "loading" | "card" | "complete" | "empty";

export default function AnkiPage() {
  const [user, setUser] = useState<{
    userId: number;
    firstName: string;
  } | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [current, setCurrent] = useState(0);
  const [mode, setMode] = useState<Mode>("loading");
  const [showAnswer, setShowAnswer] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [quizMode, setQuizMode] = useState<"type" | "reveal">("reveal");

  useEffect(() => {
    const u = getTelegramUser();
    if (u && u.userId) {
      setUser(u);
    } else {
      setUser({ userId: 251137156, firstName: "Dev" });
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadCards = async () => {
    if (!user) return;
    setMode("loading");
    try {
      const data = await fetchDueCards(user.userId);
      const s = await fetchStats(user.userId);
      setStats(s);
      if (data.cards && data.cards.length > 0) {
        setCards(data.cards);
        setCurrent(0);
        setMode("card");
      } else {
        setMode("empty");
      }
    } catch {
      setMode("empty");
    }
  };

  const card = cards[current];

  const handleReveal = () => setShowAnswer(true);

  const handleRate = async (quality: string) => {
    if (!user || !card) return;
    setMode("loading");
    try {
      const result = await submitAnswer(
        user.userId,
        card.id,
        quality,
        quizMode === "type" ? "type_translation" : "reveal"
      );
      setLastResult(result);
      setShowAnswer(false);
      setTypedAnswer("");

      if (current + 1 < cards.length) {
        setCurrent(current + 1);
        setMode("card");
      } else {
        const s = await fetchStats(user.userId);
        setStats(s);
        setMode("complete");
      }
    } catch {
      setMode("card");
    }
  };

  const handleTypeSubmit = () => {
    setShowAnswer(true);
  };

  // ---- RENDER ----

  if (mode === "loading") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (mode === "empty") {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-xl font-bold text-white mb-2">All caught up!</h1>
        <p className="text-zinc-400 mb-6">
          No cards due for review. Forward some teacher notes to add vocabulary!
        </p>
        {stats && (
          <div className="bg-zinc-900 rounded-xl p-4 w-full max-w-xs">
            <div className="text-2xl font-bold text-emerald-400">
              {stats.xp || 0} XP
            </div>
            <div className="text-xs text-zinc-400">
              Level {stats.level || 1}: {stats.level_name || "Word Rookie"}
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              🔥 {stats.current_streak || 0}-day streak
            </div>
          </div>
        )}
        <button
          onClick={closeMiniApp}
          className="mt-6 px-6 py-2 bg-zinc-800 rounded-lg text-white text-sm"
        >
          Close
        </button>
      </div>
    );
  }

  if (mode === "complete") {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-4">🏆</div>
        <h1 className="text-xl font-bold text-white mb-2">
          Session Complete!
        </h1>
        <p className="text-zinc-400 mb-4">
          You reviewed {cards.length} cards
        </p>
        {stats && (
          <div className="bg-zinc-900 rounded-xl p-4 w-full max-w-xs mb-4">
            <div className="text-2xl font-bold text-emerald-400">
              {stats.xp || 0} XP
            </div>
            <div className="text-xs text-zinc-400">
              Level {stats.level || 1}: {stats.level_name || "Word Rookie"}
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              🔥 {stats.current_streak || 0}-day streak
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              📚 {stats.total_words || 0} words learned
            </div>
          </div>
        )}
        {lastResult && (
          <div className="text-sm text-amber-400 mb-4">
            +{lastResult.xp_earned} XP earned!
          </div>
        )}
        <button
          onClick={closeMiniApp}
          className="px-6 py-2 bg-blue-600 rounded-lg text-white text-sm font-medium"
        >
          Done
        </button>
      </div>
    );
  }

  // Card mode
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="text-xs text-zinc-400">
          {current + 1} / {cards.length}
        </div>
        <div className="flex items-center gap-2">
          {stats && (
            <span className="text-xs text-amber-400">
              ⭐ {stats.xp || 0}
            </span>
          )}
          {stats && (
            <span className="text-xs text-orange-400">
              🔥 {stats.current_streak || 0}
            </span>
          )}
        </div>
        <button
          onClick={() =>
            setQuizMode(quizMode === "reveal" ? "type" : "reveal")
          }
          className="text-[10px] px-2 py-1 rounded bg-zinc-800 text-zinc-400"
        >
          {quizMode === "reveal" ? "🔤 Type" : "👁️ Reveal"}
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-4">
        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${(current / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {card && (
          <div className="w-full max-w-sm">
            {/* Category badge */}
            <div className="text-center mb-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 uppercase">
                {card.category}
              </span>
            </div>

            {/* Word */}
            <div className="bg-zinc-900 rounded-2xl p-8 text-center mb-6 border border-zinc-800">
              <h2 className="text-2xl font-bold text-white mb-2">
                {card.word}
              </h2>
              {card.repetitions > 0 && (
                <div className="text-[10px] text-zinc-500">
                  reviewed {card.repetitions}x
                </div>
              )}
            </div>

            {/* Quiz area */}
            {quizMode === "type" && !showAnswer ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTypeSubmit()}
                  placeholder="Type the definition..."
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-center focus:border-blue-500 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleTypeSubmit}
                  className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium"
                >
                  Check
                </button>
              </div>
            ) : !showAnswer ? (
              <button
                onClick={handleReveal}
                className="w-full py-4 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-medium"
              >
                Tap to reveal answer
              </button>
            ) : (
              <div className="space-y-4">
                {/* Answer */}
                <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                  <div className="text-sm font-medium text-emerald-400 mb-1">
                    {card.definition}
                  </div>
                  {card.example && (
                    <div className="text-xs text-zinc-400 italic mt-2">
                      &ldquo;{card.example}&rdquo;
                    </div>
                  )}
                  {quizMode === "type" && (
                    <div className="mt-2 text-xs">
                      {typedAnswer.trim().toLowerCase() ===
                      card.definition.toLowerCase().trim() ? (
                        <span className="text-emerald-400">✅ Correct!</span>
                      ) : (
                        <span className="text-red-400">
                          ❌ Your answer: &ldquo;{typedAnswer}&rdquo;
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Rating buttons */}
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => handleRate("again")}
                    className="py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-center"
                  >
                    <div className="text-xs font-medium text-red-400">
                      Again
                    </div>
                    <div className="text-[9px] text-red-400/60">1m</div>
                  </button>
                  <button
                    onClick={() => handleRate("hard")}
                    className="py-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-center"
                  >
                    <div className="text-xs font-medium text-amber-400">
                      Hard
                    </div>
                    <div className="text-[9px] text-amber-400/60">10m</div>
                  </button>
                  <button
                    onClick={() => handleRate("good")}
                    className="py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-center"
                  >
                    <div className="text-xs font-medium text-emerald-400">
                      Good
                    </div>
                    <div className="text-[9px] text-emerald-400/60">
                      {card.interval_days <= 1
                        ? "1d"
                        : `${Math.round(card.interval_days * 2.5)}d`}
                    </div>
                  </button>
                  <button
                    onClick={() => handleRate("easy")}
                    className="py-3 rounded-xl bg-blue-500/20 border border-blue-500/30 text-center"
                  >
                    <div className="text-xs font-medium text-blue-400">
                      Easy
                    </div>
                    <div className="text-[9px] text-blue-400/60">
                      {card.interval_days <= 1
                        ? "4d"
                        : `${Math.round(card.interval_days * 3.5)}d`}
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
