"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";
export type Expression =
  "idle" | "thinking" | "talking" | "happy" | "surprised" | "oops";

/** Photo-derived portrait, with restrained pointer parallax and state motion. */
export function DevanshAvatar({
  expression = "idle",
  compact = false,
  wave = 0,
}: {
  expression?: Expression;
  compact?: boolean;
  wave?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0,
      x = 0,
      y = 0;
    const move = (e: PointerEvent) => {
      if (media.matches || e.pointerType === "touch") return;
      x = (e.clientX / innerWidth - 0.5) * 10;
      y = (e.clientY / innerHeight - 0.5) * -7;
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          ref.current?.style.setProperty("--portrait-x", `${x}deg`);
          ref.current?.style.setProperty("--portrait-y", `${y}deg`);
        });
    };
    addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("pointermove", move);
    };
  }, []);
  return (
    <div
      ref={ref}
      className={`portrait-avatar ${compact ? "avatar-compact" : ""}`}
      data-expression={expression}
    >
      <div className="portrait-float" key={wave}>
        <Image
          src="/devansh-portrait-shoulders.png"
          alt="Devansh’s portrait"
          width={1254}
          height={1254}
          priority={!compact}
          unoptimized
          draggable={false}
          sizes={compact ? "64px" : "(max-width: 639px) 230px, 290px"}
        />
      </div>
      {expression === "thinking" && (
        <span className="portrait-thinking" aria-hidden="true">
          •••
        </span>
      )}
    </div>
  );
}
