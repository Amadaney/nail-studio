"use server";
import { cookies } from "next/headers";

export async function setLocaleAction(locale: string) {
  (await cookies()).set("lang", locale === "es" ? "es" : "en", { path: "/", maxAge: 31_536_000, sameSite: "lax" });
}
