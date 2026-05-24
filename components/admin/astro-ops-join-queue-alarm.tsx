"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import {
  ensureInboxRingAlarmLoop,
  installInboxAudioGlobalUnlock,
  isInboxOrderSoundEnabled,
  playInboxOrderRing,
  playInboxPhoneRingPattern,
  setInboxAlarmContinueCheck,
  setInboxOrderSoundEnabled,
  stopInboxRingAlarmLoop,
  tryResumeInboxAudio,
  unlockInboxAudio,
} from "@/lib/audio/inbox-order-ring";

const AUDIO_PRIMED_EVENT = "vedguide:astro-ops-audio-primed";

const TAB_BLINK_MS = 720;
/** If tab is already focused, stop blinking title after this long so it doesn’t run forever. */
const TAB_BLINK_MAX_VISIBLE_MS = 14_000;

const JOIN_QUEUE_TAB_TITLE_PREFIX = /^● \d+ new orders? — /;

function stripJoinQueueTabAlertPrefix(title: string): string {
  const t = title.replace(JOIN_QUEUE_TAB_TITLE_PREFIX, "").trim();
  return t.length > 0 ? t : title;
}

/** Runs on all `/astro-ops/*` routes: polls join queue, loops ring while anyone waits, global sound controls. */
export function AstroOpsJoinQueueAlarm() {
  const router = useRouter();
  const [soundOn, setSoundOn] = useState(true);
  const [audioPrimed, setAudioPrimed] = useState(false);
  /** `null` = off; number = “N new order(s)” blink copy */
  const [tabBlinkCount, setTabBlinkCount] = useState<number | null>(null);
  /** Latest poll: true if ≥1 session is `waiting_astrologer` (drives loop + continue-check). */
  const joinQueueNonEmptyRef = useRef(false);
  const pollBootstrappedRef = useRef(false);
  const prevWaitingIdsRef = useRef<Set<string>>(new Set());
  const tabTitleBaseRef = useRef("");
  const tabBlinkIntervalRef = useRef<number | null>(null);
  const tabBlinkVisibleStopRef = useRef<number | null>(null);
  const tabBlinkShowAlertRef = useRef(true);
  const tabBlinkCountRef = useRef<number | null>(null);

  useEffect(() => {
    tabBlinkCountRef.current = tabBlinkCount;
  }, [tabBlinkCount]);

  const markPrimed = useCallback(() => setAudioPrimed(true), []);

  useEffect(() => {
    const onPrimed = () => markPrimed();
    window.addEventListener(AUDIO_PRIMED_EVENT, onPrimed);
    return () => window.removeEventListener(AUDIO_PRIMED_EVENT, onPrimed);
  }, [markPrimed]);

  useEffect(() => {
    setSoundOn(isInboxOrderSoundEnabled());
  }, []);

  useEffect(() => {
    return installInboxAudioGlobalUnlock(() => {
      window.dispatchEvent(new Event(AUDIO_PRIMED_EVENT));
    });
  }, []);

  /** Browser tab title: blink “N new order(s)” when a new session hits the join queue. */
  useEffect(() => {
    if (tabBlinkCount == null) {
      if (tabTitleBaseRef.current) {
        document.title = tabTitleBaseRef.current;
      }
      if (tabBlinkIntervalRef.current != null) {
        window.clearInterval(tabBlinkIntervalRef.current);
        tabBlinkIntervalRef.current = null;
      }
      if (tabBlinkVisibleStopRef.current != null) {
        window.clearTimeout(tabBlinkVisibleStopRef.current);
        tabBlinkVisibleStopRef.current = null;
      }
      return;
    }

    const base = tabTitleBaseRef.current || stripJoinQueueTabAlertPrefix(document.title) || "VedGuide";
    const n = tabBlinkCount;
    const alertTitle =
      n === 1 ? `● 1 new order — ${base}` : `● ${n} new orders — ${base}`;

    const apply = () => {
      const show = tabBlinkShowAlertRef.current;
      document.title = show ? alertTitle : base;
      tabBlinkShowAlertRef.current = !show;
    };

    apply();
    tabBlinkIntervalRef.current = window.setInterval(apply, TAB_BLINK_MS) as unknown as number;

    return () => {
      if (tabBlinkIntervalRef.current != null) {
        window.clearInterval(tabBlinkIntervalRef.current);
        tabBlinkIntervalRef.current = null;
      }
      document.title = base;
    };
  }, [tabBlinkCount]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        if (tabBlinkVisibleStopRef.current != null) {
          window.clearTimeout(tabBlinkVisibleStopRef.current);
          tabBlinkVisibleStopRef.current = null;
        }
        return;
      }
      if (tabBlinkCountRef.current != null) {
        setTabBlinkCount(null);
        tabTitleBaseRef.current = "";
      }
    };

    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const POLL_MS = 3000;

    const syncAlarmFromQueue = (waitingCount: number) => {
      joinQueueNonEmptyRef.current = waitingCount > 0;
      setInboxAlarmContinueCheck(() => joinQueueNonEmptyRef.current);
      if (joinQueueNonEmptyRef.current) tryResumeInboxAudio();
      if (joinQueueNonEmptyRef.current && isInboxOrderSoundEnabled()) {
        ensureInboxRingAlarmLoop();
      } else {
        stopInboxRingAlarmLoop();
      }
      if (waitingCount === 0) {
        setTabBlinkCount(null);
        tabTitleBaseRef.current = "";
      }
    };

    const tick = async () => {
      try {
        const res = await fetch("/api/admin/live-consult/waiting-signal", {
          credentials: "include",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { waitingIds?: string[] };
        const ids = data.waitingIds ?? [];
        const next = new Set(ids);

        if (!pollBootstrappedRef.current) {
          pollBootstrappedRef.current = true;
          prevWaitingIdsRef.current = next;
          syncAlarmFromQueue(ids.length);
          return;
        }

        let newlyAdded = 0;
        for (const id of ids) {
          if (!prevWaitingIdsRef.current.has(id)) newlyAdded += 1;
        }
        const hasNewSession = newlyAdded > 0;
        prevWaitingIdsRef.current = next;

        syncAlarmFromQueue(ids.length);

        if (hasNewSession) {
          router.refresh();
          tabTitleBaseRef.current = stripJoinQueueTabAlertPrefix(document.title);
          tabBlinkShowAlertRef.current = true;
          setTabBlinkCount(newlyAdded);
          if (tabBlinkVisibleStopRef.current != null) {
            window.clearTimeout(tabBlinkVisibleStopRef.current);
            tabBlinkVisibleStopRef.current = null;
          }
          if (document.visibilityState === "visible") {
            tabBlinkVisibleStopRef.current = window.setTimeout(() => {
              setTabBlinkCount(null);
              tabTitleBaseRef.current = "";
            }, TAB_BLINK_MAX_VISIBLE_MS) as unknown as number;
          }
        }
      } catch {
        /* ignore */
      }
    };

    const id = window.setInterval(() => void tick(), POLL_MS);
    void tick();
    return () => {
      cancelled = true;
      window.clearInterval(id);
      stopInboxRingAlarmLoop();
      if (tabBlinkVisibleStopRef.current != null) {
        window.clearTimeout(tabBlinkVisibleStopRef.current);
        tabBlinkVisibleStopRef.current = null;
      }
      setTabBlinkCount(null);
      if (tabTitleBaseRef.current) document.title = tabTitleBaseRef.current;
    };
  }, [router]);

  const toggleSound = useCallback(() => {
    if (unlockInboxAudio()) {
      window.dispatchEvent(new Event(AUDIO_PRIMED_EVENT));
    }
    const next = !soundOn;
    setSoundOn(next);
    setInboxOrderSoundEnabled(next);
    if (next) {
      playInboxOrderRing();
      setInboxAlarmContinueCheck(() => joinQueueNonEmptyRef.current);
      if (joinQueueNonEmptyRef.current) ensureInboxRingAlarmLoop();
    } else {
      stopInboxRingAlarmLoop();
    }
  }, [soundOn]);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex max-w-[min(calc(100vw-2rem),320px)] flex-col items-end gap-2 md:bottom-6 md:right-8">
      {soundOn && !audioPrimed ? (
        <p className="pointer-events-auto rounded-xl border border-amber-500/40 bg-amber-50/95 px-3 py-2 text-left text-[11px] leading-snug text-amber-950 shadow-md dark:border-amber-400/30 dark:bg-amber-950/90 dark:text-amber-50">
          Browsers block sound until there has been some input in this tab (scroll, key, or touch — not only a click).
          After that, the ring loops while anyone is in the join queue.
        </p>
      ) : null}
      <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-border/80 bg-card/95 px-2 py-1.5 shadow-lg backdrop-blur-md">
        <button
          type="button"
          onClick={() => {
            if (unlockInboxAudio()) window.dispatchEvent(new Event(AUDIO_PRIMED_EVENT));
            playInboxPhoneRingPattern();
          }}
          className="rounded-full px-2 py-1 text-[11px] font-semibold text-foreground hover:bg-muted/80"
          title="Test ring"
        >
          Test
        </button>
        <button
          type="button"
          onClick={toggleSound}
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          title={soundOn ? "Mute join-queue alarm" : "Unmute"}
        >
          {soundOn ? (
            <Bell className="size-4 text-amber-600" aria-hidden />
          ) : (
            <BellOff className="size-4" aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}
