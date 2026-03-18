"use client";

import { useEffect, useState, useCallback } from "react";
import { getTelegramUser, closeMiniApp } from "@/lib/telegram";

interface TriageState {
  words: string[];
  index: number;
  added: number;
  skipped: number;
  lastDefinition?: string;
}

export default function TriagePage() {
  const [user, setUser] = useState<{ userId: number } | null>(null);
  const [state, setState] = useState<TriageState | null>(null);
  const [loading, setLoading] = useState(true);
  const [animating, setAnimating] = useState<"left" | "right" | null>(null);

  useEffect(() => {
    const u = getTelegramUser();
    setUser(u || { userId: 251137156 });
  }, []);

  const loadWords = useCallback(
    async (pack: string) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/triage?user_id=${user?.userId}&pack=${pack}`
        );
        const data = await res.json();
        setState({
          words: data.words || [],
          index: 0,
          added: 0,
          skipped: 0,
        });
      } catch {
        setState({ words: [], index: 0, added: 0, skipped: 0 });
      }
      setLoading(false);
    },
    [user]
  );

  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const pack = params.get("pack") || "idioms";
    loadWords(pack);
  }, [user, loadWords]);

  const handleAction = useCallback(
    async (action: "know" | "learn") => {
      if (!state || !user || state.index >= state.words.length) return;

      const word = state.words[state.index];
      setAnimating(action === "know" ? "left" : "right");

      try {
        const res = await fetch(`/api/triage?user_id=${user.userId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ word, action }),
        });
        const data = await res.json();

        setTimeout(() => {
          setState((prev) =>
            prev
              ? {
                  ...prev,
                  index: prev.index + 1,
                  added: action === "learn" ? prev.added + 1 : prev.added,
                  skipped: action === "know" ? prev.skipped + 1 : prev.skipped,
                  lastDefinition: data.definition,
                }
              : null
          );
          setAnimating(null);
        }, 300);
      } catch {
        setAnimating(null);
      }
    },
    [state, user]
  );

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-400">Loading words...</div>
      </div>
    );
  }

  // No words
  if (!state || state.words.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-xl font-bold text-white mb-2">All done!</h1>
        <p className="text-zinc-400">No new words to triage in this pack.</p>
        <button
          onClick={closeMiniApp}
          className="mt-6 px-6 py-2 bg-zinc-800 rounded-lg text-white text-sm"
        >
          Close
        </button>
      </div>
    );
  }

  // Complete
  if (state.index >= state.words.length) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-4">🏆</div>
        <h1 className="text-xl font-bold text-white mb-2">
          Triage Complete!
        </h1>
        <div className="bg-zinc-900 rounded-xl p-4 w-full max-w-xs mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-zinc-400">Added</span>
            <span className="text-sm font-bold text-emerald-400">
              {state.added} cards
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-zinc-400">Already known</span>
            <span className="text-sm font-bold text-blue-400">
              {state.skipped}
            </span>
          </div>
        </div>
        <button
          onClick={closeMiniApp}
          className="px-6 py-2 bg-blue-600 rounded-lg text-white text-sm font-medium"
        >
          Done
        </button>
      </div>
    );
  }

  const word = state.words[state.index];
  const progress = (state.index / state.words.length) * 100;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <span className="text-xs text-zinc-400">
          {state.index + 1} / {state.words.length}
        </span>
        <div className="flex gap-3">
          <span className="text-xs text-emerald-400">📚 {state.added}</span>
          <span className="text-xs text-blue-400">✅ {state.skipped}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4">
        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div
          className={`w-full max-w-sm transition-all duration-300 ${
            animating === "left"
              ? "-translate-x-full opacity-0"
              : animating === "right"
                ? "translate-x-full opacity-0"
                : ""
          }`}
        >
          <div className="bg-zinc-900 rounded-2xl p-10 text-center border border-zinc-800">
            <div className="text-[10px] text-zinc-500 uppercase mb-4">
              Do you know this word?
            </div>
            <h2 className="text-3xl font-bold text-white">{word}</h2>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="p-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleAction("know")}
            disabled={!!animating}
            className="py-4 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 font-medium text-sm active:scale-95 transition-transform"
          >
            ✅ I know this
          </button>
          <button
            onClick={() => handleAction("learn")}
            disabled={!!animating}
            className="py-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-medium text-sm active:scale-95 transition-transform"
          >
            📚 Learn this
          </button>
        </div>
      </div>
    </div>
  );
}
