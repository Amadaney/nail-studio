import "server-only";
import { cookies, headers } from "next/headers";
import { dictionaries, type Key, type Locale } from "./dictionaries";

// Cookie wins; otherwise use the browser language (Spanish browsers get Spanish by default).
export async function getLocale(): Promise<Locale> {
  const cookie = (await cookies()).get("lang")?.value;
  if (cookie === "es" || cookie === "en") return cookie;
  const accept = (await headers()).get("accept-language") ?? "";
  return accept.toLowerCase().startsWith("es") ? "es" : "en";
}

export async function getT() {
  const locale = await getLocale();
  const dict = dictionaries[locale];
  return { locale, t: (k: Key) => dict[k] };
}
