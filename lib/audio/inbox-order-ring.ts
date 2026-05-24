/**
 * Join-queue alarm: classic “phone ring” pattern, looped while any session is
 * `waiting_astrologer` (poll drives start/stop).
 *
 * Audible output still needs a one-time user gesture in the tab (browser autoplay policy).
 * `installInboxAudioGlobalUnlock` wires wheel, keys, and pointer so ops rarely need a deliberate “unlock” click.
 */

let sharedCtx: AudioContext | null = null;

/** Loop timer for repeated ring until shouldAlarm() is false */
let alarmLoopTimer: number | null = null;
let alarmContinueCheck: () => boolean = () => false;

const DEFAULT_ALARM_INTERVAL_MS = 3200;

function getAudioContextClass(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ||
    null
  );
}

/** If a context exists but is suspended, try to resume (e.g. after tab focus). No-op if none. */
export function tryResumeInboxAudio(): void {
  if (typeof window === "undefined") return;
  if (!sharedCtx || sharedCtx.state === "closed") return;
  void sharedCtx.resume().catch(() => {});
}

/**
 * One-time unlock from almost any user input in the tab (capture phase on window + document).
 * Call once when astro-ops mounts. `onPrimed` runs when unlock succeeds.
 */
export function installInboxAudioGlobalUnlock(onPrimed?: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const types = [
    "pointerdown",
    "touchstart",
    "touchend",
    "keydown",
    "wheel",
    "mousedown",
  ] as const;
  const opts: AddEventListenerOptions = { capture: true, passive: true };

  let finished = false;

  const removeAll = () => {
    for (const t of types) {
      window.removeEventListener(t, tryOnce, opts);
      document.removeEventListener(t, tryOnce, opts);
    }
  };

  const tryOnce = () => {
    if (finished) return;
    if (!unlockInboxAudio()) return;
    finished = true;
    onPrimed?.();
    removeAll();
  };

  for (const t of types) {
    window.addEventListener(t, tryOnce, opts);
    document.addEventListener(t, tryOnce, opts);
  }

  return () => {
    if (!finished) removeAll();
    finished = true;
  };
}

/** Call from a user gesture — also used internally by `installInboxAudioGlobalUnlock`. */
export function unlockInboxAudio(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const AC = getAudioContextClass();
    if (!AC) return false;
    if (!sharedCtx || sharedCtx.state === "closed") {
      sharedCtx = new AC();
    }
    void sharedCtx.resume().catch(() => {});
    const osc = sharedCtx.createOscillator();
    const g = sharedCtx.createGain();
    g.gain.setValueAtTime(0.00005, sharedCtx.currentTime);
    osc.connect(g);
    g.connect(sharedCtx.destination);
    const t0 = sharedCtx.currentTime;
    osc.start(t0);
    osc.stop(t0 + 0.02);
    return true;
  } catch {
    return false;
  }
}

/** One “trill” — two frequencies like an old phone bell. */
function trill(
  ctx: AudioContext,
  t0: number,
  freqA: number,
  freqB: number,
  dur: number,
  vol: number
) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  g.connect(ctx.destination);

  for (const f of [freqA, freqB]) {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(f, t0);
    o.connect(g);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }
}

/**
 * Classic call-style double ring (≈0.85s of tone + gaps), one “cycle”.
 * Looped by ensureInboxRingAlarmLoop until the join queue is empty.
 */
export function playInboxPhoneRingPattern(): void {
  if (typeof window === "undefined") return;
  try {
    if (!sharedCtx || sharedCtx.state === "closed") return;

    const run = () => {
      try {
        const ctx = sharedCtx!;
        const t0 = ctx.currentTime;
        // Ring — ring — (pause handled by outer interval)
        trill(ctx, t0, 523, 659, 0.16, 0.2);
        trill(ctx, t0 + 0.22, 523, 659, 0.16, 0.19);
        trill(ctx, t0 + 0.52, 440, 554, 0.22, 0.17);
        trill(ctx, t0 + 0.76, 440, 554, 0.22, 0.16);
      } catch {
        /* ignore */
      }
    };

    if (sharedCtx.state === "running") {
      run();
      return;
    }
    void sharedCtx.resume().then(run).catch(() => {});
  } catch {
    /* ignore */
  }
}

/** @deprecated use playInboxPhoneRingPattern — kept for “Test ring” / toggle preview */
export function playInboxOrderRing(): void {
  playInboxPhoneRingPattern();
}

export function setInboxAlarmContinueCheck(check: () => boolean): void {
  alarmContinueCheck = check;
}

export function ensureInboxRingAlarmLoop(intervalMs = DEFAULT_ALARM_INTERVAL_MS): void {
  if (typeof window === "undefined") return;
  if (alarmLoopTimer != null) return;

  const tick = () => {
    if (!isInboxOrderSoundEnabled()) {
      stopInboxRingAlarmLoop();
      return;
    }
    if (!alarmContinueCheck()) {
      stopInboxRingAlarmLoop();
      return;
    }
    playInboxPhoneRingPattern();
  };

  tick();
  alarmLoopTimer = window.setInterval(tick, intervalMs) as unknown as number;
}

export function stopInboxRingAlarmLoop(): void {
  if (alarmLoopTimer != null) {
    window.clearInterval(alarmLoopTimer);
    alarmLoopTimer = null;
  }
}

export const INBOX_SOUND_STORAGE_KEY = "vedguide-astro-ops-inbox-sound";

export function isInboxOrderSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(INBOX_SOUND_STORAGE_KEY) !== "0";
}

export function setInboxOrderSoundEnabled(on: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INBOX_SOUND_STORAGE_KEY, on ? "1" : "0");
}
