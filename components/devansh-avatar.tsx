"use client";
import { useEffect, useId, useRef } from "react";
export type Expression =
  "idle" | "thinking" | "talking" | "happy" | "surprised" | "oops";

/** Original layered vector artwork, with animation isolated from chat renders. */
export function DevanshAvatar({
  expression = "idle",
  wave = 0,
  compact = false,
}: {
  expression?: Expression;
  wave?: number;
  compact?: boolean;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const id = useId().replace(/:/g, "");
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0,
      blinkTimer: ReturnType<typeof setTimeout>,
      openTimer: ReturnType<typeof setTimeout>;
    const blink = () => {
      blinkTimer = setTimeout(
        () => {
          if (!media.matches && !document.hidden) {
            svg.dataset.blink = "true";
            openTimer = setTimeout(() => {
              svg.dataset.blink = "false";
            }, 130);
          }
          blink();
        },
        2600 + Math.random() * 4000,
      );
    };
    const pointer = (event: PointerEvent) => {
      if (frame || media.matches || event.pointerType === "touch") return;
      const { clientX, clientY } = event;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const box = svg.getBoundingClientRect();
        const x = Math.max(
          -1,
          Math.min(1, (clientX - box.x - box.width / 2) / 400),
        );
        const y = Math.max(
          -1,
          Math.min(1, (clientY - box.y - box.height / 2) / 350),
        );
        svg.style.setProperty("--gaze-x", `${x * 4}px`);
        svg.style.setProperty("--gaze-y", `${y * 3}px`);
        svg.style.setProperty("--head-turn", `${x * 3}deg`);
      });
    };
    const reset = () => {
      svg.style.setProperty("--gaze-x", "0px");
      svg.style.setProperty("--gaze-y", "0px");
      svg.style.setProperty("--head-turn", "0deg");
    };
    blink();
    addEventListener("pointermove", pointer, { passive: true });
    media.addEventListener("change", reset);
    return () => {
      clearTimeout(blinkTimer);
      clearTimeout(openTimer);
      cancelAnimationFrame(frame);
      removeEventListener("pointermove", pointer);
      media.removeEventListener("change", reset);
    };
  }, []);
  return (
    <svg
      ref={ref}
      className={`devansh-avatar ${compact ? "avatar-compact" : ""}`}
      viewBox="0 0 360 340"
      role="img"
      aria-label={`Devansh’s illustrated avatar, ${expression === "oops" ? "apologetic" : expression}`}
      data-expression={expression}
    >
      <defs>
        <linearGradient
          id={`${id}-skin`}
          x1=".2"
          y1="0"
          x2=".9"
          y2="1"
          gradientUnits="objectBoundingBox"
        >
          <stop stopColor="#E7B18B" />
          <stop offset="1" stopColor="#C88760" />
        </linearGradient>
        <linearGradient id={`${id}-shirt`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#6984D3" />
          <stop offset="1" stopColor="#3B4E91" />
        </linearGradient>
        <linearGradient id={`${id}-hair`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#46332D" />
          <stop offset="1" stopColor="#211D25" />
        </linearGradient>
        <linearGradient id={`${id}-laptop`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#EEF3FF" />
          <stop offset="1" stopColor="#B8C8E7" />
        </linearGradient>
      </defs>
      <g className="avatar-stage" aria-hidden="true">
        <circle cx="181" cy="169" r="143" fill="currentColor" opacity=".055" />
        <circle cx="61" cy="133" r="5" fill="#81BDCF" />
        <path d="m296 67 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z" fill="#A7A0DF" />
        <path d="m43 220 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="#E1B975" />
      </g>
      <g className="avatar-body">
        <ellipse
          cx="183"
          cy="318"
          rx="112"
          ry="9"
          fill="#183669"
          opacity=".07"
        />
        <g id={`${id}-shoulders`}>
          <path
            d="M85 303c-3-55 23-88 66-94h61c47 9 68 42 65 94Z"
            fill={`url(#${id}-shirt)`}
          />
          <path d="m151 212 30 34 31-34" fill="#F3F2ED" />
          <path
            d="m141 216 13 39 27-9-18-27m60-3-13 39-29-9 20-27"
            fill="#879CDF"
          />
        </g>
        <g className="wave-arm" key={wave}>
          <path
            d="M106 262c-29-2-44-38-48-66l22-11c11 27 23 38 44 39"
            fill={`url(#${id}-shirt)`}
          />
          <path
            d="M58 197c-6-10-13-20-15-34-1-7 3-10 7-5l7 11-7-34c-1-7 6-9 9-2l8 26-2-36c0-8 8-9 9-1l4 34 3-29c1-8 9-6 8 2l-2 33 7-17c3-7 10-3 7 4l-10 34c-4 12-15 19-24 19Z"
            fill={`url(#${id}-skin)`}
          />
          <path
            d="m63 168 9 5m4-14 4 18"
            stroke="#B47754"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
        <g id={`${id}-neck`}>
          <path d="M160 185v33q20 22 42 0v-34" fill="#C88A65" />
          <path
            d="M160 195q22 13 42-2v10q-24 15-42-1Z"
            fill="#B77555"
            opacity=".45"
          />
        </g>
        <g className="head-gaze">
          <g className="head-sway">
            <g id={`${id}-ears`}>
              <ellipse cx="119" cy="145" rx="14" ry="23" fill="#D69B75" />
              <ellipse cx="243" cy="145" rx="14" ry="23" fill="#D69B75" />
              <path
                d="M116 137q-8 3 1 13m129-13q8 3-1 13"
                fill="none"
                stroke="#B87855"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
            <path
              id={`${id}-head`}
              d="M119 111c0-51 124-51 124 0v49c0 40-28 63-62 63s-62-23-62-63Z"
              fill={`url(#${id}-skin)`}
            />
            <path
              d="M128 167q4 34 31 43"
              fill="none"
              stroke="#F4C8A3"
              strokeWidth="5"
              opacity=".5"
              strokeLinecap="round"
            />
            <g id={`${id}-hair-layer`}>
              <path
                d="M117 145c-11-18-16-47-4-63-5-18 6-36 27-38 6-18 31-25 48-16 18-11 41-1 46 14 22 2 33 24 23 41 7 20-1 48-14 63l-7-37c-34 6-58-5-76-19-5 17-18 26-32 30l-11 25Z"
                fill={`url(#${id}-hair)`}
              />
              <path
                d="M131 70q21-23 52-19m-17 22q23-15 47-8"
                fill="none"
                stroke="#6D4E3C"
                strokeWidth="5"
                strokeLinecap="round"
                opacity=".6"
              />
            </g>
            <g
              className="brows"
              fill="none"
              stroke="#4A3029"
              strokeWidth="5"
              strokeLinecap="round"
            >
              <path className="brow-left" d="M135 127q14-9 29-3" />
              <path className="brow-right" d="M200 124q14-5 27 3" />
            </g>
            <g className="eyes">
              <ellipse cx="151" cy="146" rx="13" ry="15" fill="#FFF8EF" />
              <ellipse cx="214" cy="146" rx="13" ry="15" fill="#FFF8EF" />
              <g className="pupils">
                <ellipse cx="154" cy="147" rx="7" ry="10" fill="#3D2C29" />
                <ellipse cx="211" cy="147" rx="7" ry="10" fill="#3D2C29" />
                <circle cx="156" cy="144" r="2.5" fill="white" />
                <circle cx="213" cy="144" r="2.5" fill="white" />
              </g>
            </g>
            <path
              d="m181 148-5 21q6 5 12 0"
              stroke="#AD6F50"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <ellipse
              cx="140"
              cy="172"
              rx="13"
              ry="6"
              fill="#D88070"
              opacity=".25"
            />
            <ellipse
              cx="222"
              cy="172"
              rx="13"
              ry="6"
              fill="#D88070"
              opacity=".25"
            />
            <g className="mouth-smile">
              <path d="M163 187q19 21 39-1" fill="#713F37" />
              <path
                d="M167 188q16 7 31-1"
                stroke="#FFF5E8"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
              />
            </g>
            <ellipse
              className="mouth-open"
              cx="182"
              cy="191"
              rx="11"
              ry="9"
              fill="#713F37"
            />
            <path
              className="mouth-think"
              d="M172 192q11-5 20-1"
              stroke="#713F37"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <path
              className="mouth-oops"
              d="M166 195q15-12 31-1"
              stroke="#713F37"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        </g>
        <g className="avatar-laptop" id={`${id}-laptop-layer`}>
          <path
            d="M111 255q-2-8 7-8h135q8 0 6 8l-10 61H122Z"
            fill={`url(#${id}-laptop)`}
            stroke="#A7B9D9"
            strokeWidth="1.5"
          />
          <path
            d="m171 278-7 7 7 7m26-14 7 7-7 7m-9-18-7 22"
            stroke="#55719E"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M108 315h154q-2 9-15 9H124q-13 0-16-9Z" fill="#91A7C9" />
          <path d="M171 315h30v3h-30Z" fill="#728BAD" />
        </g>
      </g>
      <g className="thought-dots" fill="#9F9BDA">
        <circle cx="274" cy="109" r="3" />
        <circle cx="284" cy="93" r="5" />
        <circle cx="301" cy="71" r="8" />
      </g>
    </svg>
  );
}
