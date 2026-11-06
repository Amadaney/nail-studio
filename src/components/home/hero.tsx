"use client";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Gem, Leaf, ShieldCheck, Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n/client";

export function Hero({ imageUrl }: { imageUrl: string | null }) {
  const { t } = useT();
  const reduce = useReducedMotion();
  const fade = (d: number) => ({
    initial: reduce ? false : { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay: d, ease: [0.22, 1, 0.36, 1] as const },
  });
  const features = [
    { icon: ShieldCheck, a: t("feat.sterile"), b: t("feat.sterileSub") },
    { icon: Leaf, a: t("feat.materials"), b: t("feat.materialsSub") },
    { icon: Gem, a: t("feat.experience"), b: t("feat.experienceSub") },
    { icon: Sparkles, a: t("feat.ambience"), b: t("feat.ambienceSub") },
  ];

  return (
    <section className="mx-auto grid max-w-7xl items-center gap-8 px-4 pb-12 pt-6 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:pb-16 lg:pt-14">
      <div className="order-2 lg:order-1">
        <motion.p {...fade(0)} className="text-xs uppercase tracking-[0.25em] text-cocoa">{t("hero.eyebrow")}</motion.p>
        <motion.h1 {...fade(0.1)} className="mt-4 text-[2.5rem] leading-[1.08] sm:text-5xl lg:text-6xl">{t("hero.title")}</motion.h1>
        <motion.p {...fade(0.2)} className="mt-5 max-w-md text-base text-stone">{t("hero.text")}</motion.p>
        <motion.div {...fade(0.3)} className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link href="/book" className="btn-primary">{t("cta.book")}</Link>
          <Link href="/#services" className="btn-outline">{t("cta.services")}</Link>
        </motion.div>
        <motion.ul {...fade(0.4)} className="mt-10 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
          {features.map(({ icon: Icon, a, b }) => (
            <li key={a}>
              <Icon className="h-5 w-5 text-cocoa" aria-hidden />
              <p className="mt-2 text-sm font-medium leading-tight">{a}</p>
              <p className="text-xs text-stone">{b}</p>
            </li>
          ))}
        </motion.ul>
      </div>

      <motion.div {...fade(0.2)} className="order-1 lg:order-2">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] rounded-tl-[4rem] bg-gradient-to-br from-sand via-blush/40 to-nude/60 shadow-soft sm:aspect-[5/4] lg:aspect-[4/5] lg:rounded-tl-[6rem]">
          {imageUrl && <Image src={imageUrl} alt="" fill priority sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />}
        </div>
      </motion.div>
    </section>
  );
}
