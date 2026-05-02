/** Only same-site paths for post-login redirect — blocks open redirects. */
const ALLOWED_PREFIXES = [
  "/astrologers",
  "/user",
  "/users",
] as const;

export function safeAuthRedirect(raw: string | null): string {
  if (!raw) return "/astrologers";
  let path = raw.trim();
  try {
    path = decodeURIComponent(path);
  } catch {
    return "/astrologers";
  }
  if (!path.startsWith("/") || path.startsWith("//")) return "/astrologers";
  const ok = ALLOWED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
  if (!ok) return "/astrologers";
  return path;
}
