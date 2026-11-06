import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/book", "/privacy", "/terms"].map((p) => ({ url: `${SITE.url}${p}`, lastModified: new Date() }));
}
