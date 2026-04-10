/** Client-only session id for funnel / internal events */
export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("vg_session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("vg_session_id", id);
  }
  return id;
}
