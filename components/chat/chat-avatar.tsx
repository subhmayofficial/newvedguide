"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

export function ChatAvatar({
  src,
  alt,
  initials,
  gradientClass,
  size = 40,
}: {
  src?: string | null;
  alt: string;
  initials: string;
  gradientClass: string;
  size?: number;
}) {
  const px = `${size}px`;
  const [imageFailed, setImageFailed] = useState(false);
  if (src && !imageFailed) {
    return (
      <div
        className="relative shrink-0 overflow-hidden rounded-full ring-2 ring-white/80 shadow-sm"
        style={{ width: px, height: px }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="size-full object-cover"
          onError={() => setImageFailed(true)}
        />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white ring-2 ring-white/50 shadow-sm",
        gradientClass
      )}
      style={{ width: px, height: px }}
    >
      {initials.slice(0, 2)}
    </div>
  );
}
