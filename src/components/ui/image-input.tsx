"use client";

// Phone photos are often 4-10 MB. Shrink them in the browser (max 2000px, JPEG) before uploading.
async function shrink(file: File): Promise<File> {
  try {
    if (!file.type.startsWith("image/") || file.size < 1_500_000) return file;
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    return blob ? new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

export function ImageInput({ name, multiple = false, required = false }: { name: string; multiple?: boolean; required?: boolean }) {
  return (
    <input
      type="file" name={name} multiple={multiple} required={required} accept="image/jpeg,image/png,image/webp"
      className="block w-full cursor-pointer text-sm text-stone file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-sand file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:bg-blush/30"
      onChange={async (e) => {
        const input = e.currentTarget;
        const dt = new DataTransfer();
        for (const f of Array.from(input.files ?? [])) dt.items.add(await shrink(f));
        input.files = dt.files;
      }}
    />
  );
}
