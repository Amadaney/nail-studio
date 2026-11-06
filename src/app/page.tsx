import { PublicShell } from "@/components/layout/public-shell";
import { Hero } from "@/components/home/hero";
import { Services } from "@/components/home/services";
import { Gallery } from "@/components/home/gallery";
import { About } from "@/components/home/about";
import { Reviews } from "@/components/home/reviews";
import { Contact } from "@/components/home/contact";
import { getSettings } from "@/lib/settings";

export default async function HomePage() {
  const s = await getSettings();
  return (
    <PublicShell>
      <Hero imageUrl={s.hero_image_url} />
      <Services />
      <Gallery />
      <About />
      <Reviews />
      <Contact />
    </PublicShell>
  );
}
