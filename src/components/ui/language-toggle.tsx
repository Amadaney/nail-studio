"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { setLocaleAction } from "@/actions/locale";
import { useT } from "@/lib/i18n/client";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { locale } = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  const next = locale === "es" ? "en" : "es";
  return (
    <button
      type="button" disabled={pending}
      aria-label={next === "es" ? "Cambiar a español" : "Switch to English"}
      onClick={() => start(async () => { await setLocaleAction(next); router.refresh(); })}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-sand px-3 py-2 text-xs font-medium uppercase tracking-wide text-ink/80 transition-colors hover:bg-sand disabled:opacity-60 ${className}`}
    >
      <Globe className="h-4 w-4" aria-hidden /> {next === "es" ? "Español" : "English"}
    </button>
  );
}
