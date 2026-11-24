/**
 * Minimal Supabase client (Auth + REST + Edge Functions) built on fetch.
 *
 * The app runs in **demo mode** (local data only) until both env vars are set:
 *
 *   VITE_SUPABASE_URL=https://<project>.supabase.co
 *   VITE_SUPABASE_ANON_KEY=<anon public key>
 *
 * Only the public anon key ever ships in the app. Everything privileged
 * (Stripe secret key, service-role key) lives in Supabase Edge Functions — see
 * `supabase/functions` and docs/PAYMENTS.md. Row Level Security in
 * `supabase/migrations` decides what each signed-in user can read or write.
 *
 * Security note: the session is kept in localStorage, which lives inside the
 * app's sandboxed WebView. Before launch, move it to the iOS Keychain /
 * Android Keystore with a secure-storage Capacitor plugin.
 */

const URL_ = (import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
const SESSION_KEY = "winkpop-session";

export const isBackendConfigured = (): boolean => Boolean(URL_ && ANON);

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number; // unix seconds
  user: { id: string; email?: string };
}

export class BackendError extends Error {
  constructor(
    message: string,
    public status = 0,
  ) {
    super(message);
  }
}

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function saveSession(s: Session | null) {
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else localStorage.removeItem(SESSION_KEY);
}

async function request<T>(path: string, init: RequestInit & { auth?: boolean } = {}): Promise<T> {
  if (!isBackendConfigured()) throw new BackendError("Backend is not configured (demo mode).");
  const headers: Record<string, string> = {
    apikey: ANON,
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (init.auth !== false) {
    const session = await getSession();
    headers.Authorization = `Bearer ${session?.access_token ?? ANON}`;
  }
  const res = await fetch(`${URL_}${path}`, { ...init, headers });
  const text = await res.text();
  const body = text ? safeJson(text) : null;
  if (!res.ok) {
    const msg =
      (body && typeof body === "object" && ("error_description" in body || "msg" in body || "error" in body || "message" in body)
        ? String((body as Record<string, unknown>).error_description ?? (body as Record<string, unknown>).msg ?? (body as Record<string, unknown>).message ?? (body as Record<string, unknown>).error)
        : res.statusText) || "Request failed";
    throw new BackendError(msg, res.status);
  }
  return body as T;
}

function safeJson(t: string): unknown {
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}

function toSession(r: { access_token: string; refresh_token: string; expires_in: number; user: Session["user"] }): Session {
  return {
    access_token: r.access_token,
    refresh_token: r.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + r.expires_in,
    user: { id: r.user.id, email: r.user.email },
  };
}

/** Current session, refreshed when it is about to expire. */
export async function getSession(): Promise<Session | null> {
  const s = loadSession();
  if (!s) return null;
  if (s.expires_at - 60 > Date.now() / 1000) return s;
  try {
    const r = await request<Parameters<typeof toSession>[0]>("/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ refresh_token: s.refresh_token }),
    });
    const next = toSession(r);
    saveSession(next);
    return next;
  } catch {
    saveSession(null);
    return null;
  }
}

export const auth = {
  async signIn(email: string, password: string): Promise<Session> {
    const r = await request<Parameters<typeof toSession>[0]>("/auth/v1/token?grant_type=password", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ email, password }),
    });
    const s = toSession(r);
    saveSession(s);
    return s;
  },

  /** Returns a session, or null when email confirmation is required first. */
  async signUp(email: string, password: string): Promise<Session | null> {
    const r = await request<Partial<Parameters<typeof toSession>[0]>>("/auth/v1/signup", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ email, password }),
    });
    if (!r.access_token) return null;
    const s = toSession(r as Parameters<typeof toSession>[0]);
    saveSession(s);
    return s;
  },

  async resetPassword(email: string): Promise<void> {
    await request("/auth/v1/recover", { method: "POST", auth: false, body: JSON.stringify({ email }) });
  },

  /** OAuth (Google / Apple) — returns the URL to open; Supabase redirects back with tokens. */
  oauthUrl(provider: "google" | "apple", redirectTo: string): string {
    return `${URL_}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectTo)}`;
  },

  /** Store tokens from an OAuth redirect fragment (#access_token=…). */
  async fromRedirect(hash: string): Promise<Session | null> {
    const p = new URLSearchParams(hash.replace(/^#/, ""));
    const access = p.get("access_token");
    const refresh = p.get("refresh_token");
    if (!access || !refresh) return null;
    const user = await request<Session["user"]>("/auth/v1/user", { headers: { Authorization: `Bearer ${access}` }, auth: false });
    const s: Session = { access_token: access, refresh_token: refresh, expires_at: Math.floor(Date.now() / 1000) + Number(p.get("expires_in") ?? 3600), user };
    saveSession(s);
    return s;
  },

  async signOut(): Promise<void> {
    const s = loadSession();
    saveSession(null);
    if (s && isBackendConfigured()) {
      await fetch(`${URL_}/auth/v1/logout`, { method: "POST", headers: { apikey: ANON, Authorization: `Bearer ${s.access_token}` } }).catch(
        () => undefined,
      );
    }
  },
};

/** PostgREST access — RLS on the server decides what is allowed. */
export const db = {
  select<T>(table: string, query: string): Promise<T[]> {
    return request<T[]>(`/rest/v1/${table}?${query}`, { method: "GET" });
  },
  insert<T>(table: string, row: Record<string, unknown>): Promise<T[]> {
    return request<T[]>(`/rest/v1/${table}`, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(row) });
  },
  update<T>(table: string, query: string, patch: Record<string, unknown>): Promise<T[]> {
    return request<T[]>(`/rest/v1/${table}?${query}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(patch),
    });
  },
};

/** Call a Supabase Edge Function as the signed-in user. */
export function callFunction<T>(name: string, body: Record<string, unknown> = {}): Promise<T> {
  return request<T>(`/functions/v1/${name}`, { method: "POST", body: JSON.stringify(body) });
}
