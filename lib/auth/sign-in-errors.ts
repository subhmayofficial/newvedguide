import type { AuthError } from "@supabase/supabase-js";

export function signInErrorMessage(authError: AuthError): string {
  const msg = (authError.message ?? "").toLowerCase();
  if (
    msg.includes("invalid login credentials") ||
    msg.includes("invalid_credentials")
  ) {
    return "Wrong email or password — or this account does not exist.";
  }
  if (msg.includes("email not confirmed")) {
    return "Confirm your email from the link we sent, or disable email confirmation in Supabase for testing.";
  }
  if (
    authError.status === 0 ||
    msg.includes("fetch") ||
    msg.includes("network")
  ) {
    return "Network error — check your connection and Supabase URL.";
  }
  return authError.message || "Sign-in failed.";
}

export function signUpErrorMessage(authError: AuthError): string {
  const msg = (authError.message ?? "").toLowerCase();
  if (msg.includes("already registered") || msg.includes("already been registered")) {
    return "This email is already registered. Try signing in instead.";
  }
  return signInErrorMessage(authError);
}
