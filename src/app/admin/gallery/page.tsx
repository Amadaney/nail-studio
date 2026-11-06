import Image from "next/image";
import { requireRole } from "@/lib/security/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteGalleryImageAction, uploadGalleryAction } from "@/actions/admin";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { ImageInput } from "@/components/ui/image-input";
import type { GalleryImage } from "@/types/database";

export default async function GalleryAdmin() {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { data } = await supabase.from("gallery_images").select("id,image_url,caption").order("sort_order", { ascending: false });
  const images = (data ?? []) as GalleryImage[];

  return (
    <>
      <h1 className="text-3xl sm:text-4xl">Galería de trabajos</h1>
      <p className="mt-2 text-sm text-stone">Estas fotos aparecen en la página principal. Puedes subir varias a la vez (JPG, PNG o WebP).</p>

      <form action={uploadGalleryAction} className="card mt-5 space-y-3 p-5">
        <div><label className="label">Fotos (hasta 6 por vez)</label><ImageInput name="images" multiple required /></div>
        <div><label className="label" htmlFor="caption">Descripción corta (opcional)</label><input id="caption" name="caption" maxLength={200} className="input" /></div>
        <button className="btn-primary">Subir</button>
      </form>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((img) => (
          <figure key={img.id} className="card overflow-hidden">
            <div className="relative aspect-square"><Image src={img.image_url} alt={img.caption ?? ""} fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover" /></div>
            <form action={deleteGalleryImageAction} className="p-2">
              <input type="hidden" name="id" value={img.id} />
              <ConfirmButton message="¿Eliminar esta foto?" className="btn-sm w-full border border-red-200 text-red-700 hover:bg-red-50">Eliminar</ConfirmButton>
            </form>
          </figure>
        ))}
        {images.length === 0 && <p className="col-span-full py-8 text-center text-stone">Aún no hay fotos.</p>}
      </div>
    </>
  );
}
