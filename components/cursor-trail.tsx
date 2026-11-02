"use client";
import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { createFluidCursor } from "@/lib/fluid-cursor";

export function CursorTrail() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let engine: ReturnType<typeof createFluidCursor> = null;
    let frame = 0,
      lastFrame = 0,
      lastMove = 0,
      previous: { x: number; y: number } | null = null;
    const pending: {
      x: number;
      y: number;
      dx: number;
      dy: number;
      color: number[];
    }[] = [];
    const palette = (time: number) => {
      const hue = (time * 0.001) % 1;
      return [0, 4, 2].map((offset) => {
        const k = (offset + hue * 6) % 6;
        return (1 - Math.max(0, Math.min(k, 4 - k, 1))) * 0.16;
      });
    };
    const draw = (time: number) => {
      frame = 0;
      if (!engine || reduced.matches || document.hidden) return;
      const dt = Math.min((time - (lastFrame || time - 16.67)) / 1000, 1 / 60);
      lastFrame = time;
      for (const p of pending.splice(0))
        engine.inject(p.x, p.y, p.dx, p.dy, p.color);
      engine.step(dt);
      if (time - lastMove < 10000) frame = requestAnimationFrame(draw);
      else {
        engine.clear();
        lastFrame = 0;
      }
    };
    const move = (event: PointerEvent) => {
      if (!engine || reduced.matches || event.pointerType === "touch") return;
      const x = event.clientX / innerWidth,
        y = event.clientY / innerHeight,
        time = performance.now();
      if (previous && time - lastMove < 200) {
        const dx = x - previous.x,
          dy = y - previous.y;
        if (Math.hypot(dx, dy) > 0.00001)
          pending.push({
            x,
            y,
            dx: Math.max(-0.12, Math.min(0.12, dx)),
            dy: Math.max(-0.12, Math.min(0.12, dy)),
            color: palette(time),
          });
        if (pending.length > 32) pending.splice(0, pending.length - 32);
      }
      previous = { x, y };
      lastMove = time;
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      lastFrame = 0;
      previous = null;
      pending.length = 0;
      engine?.clear();
    };
    const setup = () => {
      stop();
      engine?.dispose();
      engine = null;
      if (!reduced.matches && !document.hidden)
        engine = createFluidCursor(canvas, resolvedTheme === "dark");
    };
    const resize = () => {
      stop();
      try {
        engine?.resize();
      } catch {
        engine?.dispose();
        engine = null;
      }
    };
    const leave = () => {
      previous = null;
    };
    const lost = (event: Event) => {
      event.preventDefault();
      stop();
      engine = null;
    };
    setup();
    addEventListener("pointermove", move, { passive: true });
    addEventListener("resize", resize, { passive: true });
    document.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", setup);
    reduced.addEventListener("change", setup);
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", setup);
    return () => {
      stop();
      engine?.dispose();
      removeEventListener("pointermove", move);
      removeEventListener("resize", resize);
      document.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", setup);
      reduced.removeEventListener("change", setup);
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", setup);
    };
  }, [resolvedTheme]);
  return <canvas ref={ref} className="cursor-canvas" aria-hidden="true" />;
}
