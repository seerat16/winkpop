import Stripe from "npm:stripe@17";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

export const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  httpClient: Stripe.createFetchHttpClient(),
});

/** Service-role client: bypasses RLS — only ever used inside Edge Functions. */
export const admin: SupabaseClient = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const ALLOWED = (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map((s) => s.trim()).filter(Boolean);

export function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  // Capacitor WebViews use capacitor://localhost (iOS) and https://localhost (Android).
  const ok = ALLOWED.length === 0 || ALLOWED.includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin || "*" : "null",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors(req), "Content-Type": "application/json" } });
}

/** The signed-in user, verified from their JWT. */
export async function requireUser(req: Request): Promise<{ id: string; email?: string }> {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "Please sign in again.");
  return { id: data.user.id, email: data.user.email ?? undefined };
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Wrap a handler with CORS preflight + consistent error responses. */
export function handler(fn: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
    if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);
    try {
      return await fn(req);
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500;
      if (status === 500) console.error(e);
      return json(req, { error: status === 500 ? "Something went wrong." : (e as Error).message }, status);
    }
  };
}

/** Only allow redirects back to our own app origins (prevents open redirects). */
export function safeReturnUrl(url: unknown, fallback: string): string {
  if (typeof url !== "string") return fallback;
  try {
    const u = new URL(url.replace("{CHECKOUT_SESSION_ID}", "x"));
    const okOrigins = ALLOWED.length ? ALLOWED : [new URL(fallback).origin];
    return okOrigins.includes(u.origin) ? url : fallback;
  } catch {
    return fallback;
  }
}
