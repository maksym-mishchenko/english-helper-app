"use client";

export function getTelegramUser() {
  if (typeof window === "undefined") return null;
  const tg = (window as any).Telegram?.WebApp;
  if (!tg) return null;
  tg.ready();
  tg.expand();
  return {
    userId: tg.initDataUnsafe?.user?.id || 0,
    firstName: tg.initDataUnsafe?.user?.first_name || "User",
    colorScheme: tg.colorScheme || "dark",
  };
}

export function closeMiniApp() {
  (window as any).Telegram?.WebApp?.close();
}
