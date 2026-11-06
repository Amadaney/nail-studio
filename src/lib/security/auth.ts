import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "admin" | "professional";

// Server-side authorization. Never trust a role coming from the client.
export async function requireRole(allowed: Role[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("id, full_name, role").eq("id", user.id).single();

  if (!profile || !allowed.includes(profile.role as Role)) redirect("/login?error=forbidden");
  return { user, profile: profile as { id: string; full_name: string; role: Role } };
}
