"use client";
import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

/** Pure canvas state: pointer motion never schedules a React render. */
export function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !context) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const lowPower =
      matchMedia("(pointer: coarse)").matches ||
      navigator.hardwareConcurrency <= 4;
    const dark = resolvedTheme === "dark";
    let width = 0,
      height = 0,
      frame = 0,
      lastFrame = 0;
    let target = { x: 0, y: 0 },
      current = { x: 0, y: 0 };
    let active = false,
      lastMove = 0,
      speed = 0;
    const points: { x: number; y: number; time: number; speed: number }[] = [];
    const lifetime = lowPower ? 420 : 720;
    const resize = () => {
      width = innerWidth;
      height = innerHeight;
      const ratio = Math.min(devicePixelRatio || 1, lowPower ? 1 : 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      points.length = 0;
    };
    const draw = (now: number) => {
      frame = 0;
      if (media.matches || document.hidden) {
        context.clearRect(0, 0, width, height);
        return;
      }
      const dt = Math.min(40, now - (lastFrame || now - 16));
      lastFrame = now;
      context.clearRect(0, 0, width, height);
      const distance = Math.hypot(target.x - current.x, target.y - current.y);
      const interpolation = 1 - Math.exp(-dt / 38);
      current.x += (target.x - current.x) * interpolation;
      current.y += (target.y - current.y) * interpolation;
      speed += (Math.min(distance / Math.max(dt, 1), 4) - speed) * 0.25;
      if (active && now - lastMove < 140 && distance > 0.2)
        points.push({ ...current, time: now, speed });
      while (
        points.length &&
        (now - points[0].time > lifetime ||
          points.length > (lowPower ? 22 : 46))
      )
        points.shift();
      context.globalCompositeOperation = dark ? "lighter" : "source-over";
      context.lineCap = "round";
      context.lineJoin = "round";
      for (let i = 1; i < points.length; i++) {
        const p = points[i],
          previous = points[i - 1];
        const fade = Math.pow(1 - (now - p.time) / lifetime, 1.7);
        const taper = i / points.length;
        const energy = 0.35 + Math.min(p.speed, 2) * 0.33;
        const hue = 190 + 80 * (1 - taper);
        const thickness = (0.7 + p.speed * 1.8) * taper;
        for (let layer = lowPower ? 1 : 2; layer >= 0; layer--) {
          context.beginPath();
          context.moveTo(previous.x, previous.y);
          context.lineTo(p.x, p.y);
          context.lineWidth = thickness + layer * (dark ? 7 : 10);
          context.strokeStyle = `hsla(${hue},90%,${dark ? 65 : 48}%,${fade * energy * (layer ? 0.05 : dark ? 0.55 : 0.25)})`;
          context.stroke();
        }
      }
      if (points.length || now - lastMove < 160)
        frame = requestAnimationFrame(draw);
      else lastFrame = 0;
    };
    const pointer = (event: PointerEvent) => {
      if (media.matches) return;
      if (!active || performance.now() - lastMove > lifetime)
        current = { x: event.clientX, y: event.clientY };
      target = { x: event.clientX, y: event.clientY };
      active = true;
      lastMove = performance.now();
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const clear = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      points.length = 0;
      active = false;
      context.clearRect(0, 0, width, height);
    };
    resize();
    addEventListener("pointermove", pointer, { passive: true });
    addEventListener("pointerdown", pointer, { passive: true });
    addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", clear);
    media.addEventListener("change", clear);
    return () => {
      clear();
      removeEventListener("pointermove", pointer);
      removeEventListener("pointerdown", pointer);
      removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", clear);
      media.removeEventListener("change", clear);
    };
  }, [resolvedTheme]);
  return (
    <canvas ref={canvasRef} className="cursor-canvas" aria-hidden="true" />
  );
}
