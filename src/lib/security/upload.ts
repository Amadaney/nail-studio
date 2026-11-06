import "server-only";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export class UploadError extends Error {}
const MAX_BYTES = 5 * 1024 * 1024;

// Checks the REAL file signature (magic bytes), not just the extension or declared MIME type.
function sniff(b: Uint8Array): { ext: string; type: string } | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", type: "image/jpeg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: "png", type: "image/png" };
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50)
    return { ext: "webp", type: "image/webp" };
  return null;
}

export async function uploadImage(supabase: SupabaseClient, file: File, folder: "services" | "gallery" | "site") {
  if (!file || file.size === 0) throw new UploadError("No se recibió ninguna imagen.");
  if (file.size > MAX_BYTES) throw new UploadError("La imagen pesa más de 5 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniff(bytes);
  if (!kind) throw new UploadError("Formato no permitido. Usa JPG, PNG o WebP.");

  const path = `${folder}/${randomUUID()}.${kind.ext}`; // server-generated name: no user-controlled paths
  const { error } = await supabase.storage.from("media").upload(path, bytes, { contentType: kind.type, upsert: false, cacheControl: "31536000" });
  if (error) throw new UploadError("No se pudo subir la imagen.");
  return { url: supabase.storage.from("media").getPublicUrl(path).data.publicUrl, path };
}

export async function removeImageByUrl(supabase: SupabaseClient, url: string | null | undefined) {
  if (!url) return;
  const marker = "/storage/v1/object/public/media/";
  const i = url.indexOf(marker);
  if (i < 0) return;
  await supabase.storage.from("media").remove([decodeURIComponent(url.slice(i + marker.length))]);
}
