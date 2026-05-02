import { LIVE_CHAT_ASTROLOGERS } from "@/lib/data/live-chat-astrologers";

export type AstrologerDisplay = {
  id: string;
  name: string;
  initials: string;
  avatarGradient: string;
  imageSrc?: string;
  rateInrPerMin: number;
};

export function getAstrologerDisplay(astrologerId: string): AstrologerDisplay {
  const a = LIVE_CHAT_ASTROLOGERS.find((x) => x.id === astrologerId);
  if (a) {
    return {
      id: a.id,
      name: a.name,
      initials: a.initials,
      avatarGradient: a.avatarGradient,
      imageSrc: a.imageSrc,
      rateInrPerMin: a.chatRateInrPerMin,
    };
  }
  return {
    id: astrologerId,
    name: astrologerId,
    initials: astrologerId.slice(0, 2).toUpperCase(),
    avatarGradient: "from-stone-600 to-stone-900",
    rateInrPerMin: 49,
  };
}

export function resolveSessionRateInr(
  snapshot: number | null | undefined,
  astrologerId: string
): number {
  if (snapshot != null && snapshot > 0) return snapshot;
  return getAstrologerDisplay(astrologerId).rateInrPerMin;
}
