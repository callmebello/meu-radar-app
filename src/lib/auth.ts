import { supabase } from "./supabase";

function redirectTo() {
  // Works on localhost, Vercel previews and prod — falls back to the prod domain
  // during SSR where window is unavailable.
  if (typeof window !== "undefined") return `${window.location.origin}/auth/callback`;
  return "https://privaapp.com.br/auth/callback";
}

export async function signInWithEmail(email: string) {
  if (!supabase) return { error: new Error("Supabase não configurado") };
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo() },
  });
  return { error };
}

/**
 * Sends the "define a new password" e-mail. Supabase deliberately reports
 * success even for addresses that don't exist, so the caller must not turn the
 * result into "this account exists" — that would leak who has an account.
 */
export async function requestPasswordReset(email: string) {
  if (!supabase) return { error: new Error("Supabase não configurado") };
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo(),
  });
  return { error };
}

export async function signInWithPassword(email: string, password: string) {
  if (!supabase) return { error: new Error("Supabase não configurado") };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error };
}

export async function signUpWithPassword(email: string, password: string) {
  if (!supabase) return { error: new Error("Supabase não configurado") };
  const { error } = await supabase.auth.signUp({ email, password });
  return { error };
}

export async function getUser() {
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getSession() {
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}
