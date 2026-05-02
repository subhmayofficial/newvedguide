/** Two-letter initials for chat avatars from profile display name. */
export function displayNameInitials(
  displayName: string | null | undefined,
  fallbackUserId: string
): string {
  const n = (displayName ?? "").trim();
  const id = fallbackUserId.replace(/-/g, "");
  if (!n) {
    const slice = id.slice(0, 2).toUpperCase();
    return slice.length >= 2 ? slice : "U";
  }
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    const one = parts[0]!;
    return one.length >= 2
      ? one.slice(0, 2).toUpperCase()
      : (one[0]! + one[0]!).toUpperCase();
  }
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
}
