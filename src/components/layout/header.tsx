"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { cn } from "@/lib/utils";

export function Header({ name }: { name: string }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const nav = [
    { label: t("nav.services"), href: "/#services" }, { label: t("nav.gallery"), href: "/#gallery" },
    { label: t("nav.about"), href: "/#about" }, { label: t("nav.reviews"), href: "/#reviews" },
    { label: t("nav.contact"), href: "/#contact" },
  ];

  return (
    <header className={cn("sticky top-0 z-50 transition-all duration-300", scrolled ? "bg-cream/90 shadow-soft backdrop-blur" : "bg-cream")}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="min-w-0 leading-tight">
          <span className="block truncate font-serif text-xl uppercase tracking-[0.14em] sm:text-2xl sm:tracking-[0.18em]">{name}</span>
          <span className="hidden text-[10px] uppercase tracking-[0.25em] text-cocoa sm:block">{t("brand.tagline")}</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 text-sm xl:gap-8 lg:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="text-ink/80 transition-colors hover:text-cocoa">{n.label}</Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageToggle className="hidden sm:inline-flex" />
          <Link href="/book" className="btn-primary !px-4 !py-2.5">{t("cta.book")}</Link>
          <button aria-label={open ? t("nav.close") : t("nav.open")} aria-expanded={open} onClick={() => setOpen((v) => !v)} className="rounded-lg p-2 lg:hidden">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav aria-label="Mobile" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-sand bg-cream lg:hidden">
            <ul className="flex flex-col gap-1 px-4 py-3">
              {nav.map((n) => (
                <li key={n.href}><Link href={n.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 hover:bg-sand">{n.label}</Link></li>
              ))}
              <li className="pt-2 sm:hidden"><LanguageToggle /></li>
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
