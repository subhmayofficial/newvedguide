/** Map live waiting-queue depth → rounded minutes shown in UI (conservative, capped). */
export function waitEstimateMinutesFromQueueDepth(waitingCount: number): number {
  if (waitingCount <= 0) return 0;
  // First user ~1–2 min; each additional queued session adds ~2 min (typical pickup / handoff).
  return Math.min(45, 1 + waitingCount * 2);
}
