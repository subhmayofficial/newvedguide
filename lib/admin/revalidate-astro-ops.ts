import { revalidatePath } from "next/cache";
import { ASTRO_OPS_BASE } from "@/lib/admin/astro-ops-paths";

/** Invalidate all Live Astrology ops pages that show session lists or a single session. */
export function revalidateAstroOpsChat(sessionId?: string): void {
  revalidatePath(ASTRO_OPS_BASE);
  revalidatePath(`${ASTRO_OPS_BASE}/inbox`);
  revalidatePath(`${ASTRO_OPS_BASE}/sessions`);
  if (sessionId) {
    revalidatePath(`${ASTRO_OPS_BASE}/sessions/${sessionId}`);
  }
}
