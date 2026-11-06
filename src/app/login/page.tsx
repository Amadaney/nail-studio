import type { Metadata } from "next";
import { signInAction } from "@/actions/auth";

export const metadata: Metadata = { title: "Acceso", robots: { index: false } };

const ERRORS: Record<string, string> = {
  invalid: "Correo o contraseña incorrectos.",
  forbidden: "Esta cuenta no tiene acceso al panel.",
  rate: "Demasiados intentos. Espera unos minutos.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const sp = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <form action={signInAction} className="card w-full max-w-sm space-y-4 p-6 sm:p-8">
        <h1 className="text-3xl">Panel de administración</h1>
        {sp.error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{ERRORS[sp.error] ?? ERRORS.invalid}</p>}
        <input type="hidden" name="next" value={sp.next ?? ""} />
        <div>
          <label htmlFor="email" className="label">Correo</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="input" />
        </div>
        <div>
          <label htmlFor="password" className="label">Contraseña</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
        </div>
        <button type="submit" className="btn-primary w-full">Entrar</button>
      </form>
    </main>
  );
}
