"use client";
import { createContext, useContext } from "react";
import type { Key, Locale } from "./dictionaries";

const Ctx = createContext<{ locale: Locale; dict: Record<Key, string> } | null>(null);

export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Record<Key, string>; children: React.ReactNode }) {
  return <Ctx.Provider value={{ locale, dict }}>{children}</Ctx.Provider>;
}

export function useT() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useT must be used inside I18nProvider");
  return { locale: c.locale, t: (k: Key) => c.dict[k] };
}
