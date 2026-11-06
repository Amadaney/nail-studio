import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { Reveal } from "@/components/ui/reveal";
import type { GalleryImage } from "@/types/database";

export async function Gallery() {
  const { t } = await getT();
  let images: GalleryImage[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("gallery_images").select("id,image_url,caption").order("sort_order", { ascending: false }).limit(18);
    images = (data as GalleryImage[] | null) ?? [];
  } catch { /* not configured yet */ }
  if (images.length === 0) return null; // section only appears once you upload photos

  return (
    <section id="gallery" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-14 sm:px-6 lg:px-8">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.25em] text-cocoa">{t("gallery.eyebrow")}</p>
        <h2 className="mt-3 text-3xl sm:text-4xl">{t("gallery.title")}</h2>
      </Reveal>
      <div className="mt-8 grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {images.map((img) => (
          <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl bg-sand">
            <Image src={img.image_url} alt={img.caption ?? ""} fill loading="lazy" sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105" />
          </div>
        ))}
      </div>
    </section>
  );
}
