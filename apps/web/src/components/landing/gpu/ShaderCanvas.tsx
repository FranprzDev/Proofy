"use client";

import { useEffect, useRef, useState } from "react";
import { startShader } from "./startShader";

interface ShaderCanvasProps {
  shader: string;
  className?: string;
  interactive?: boolean;
}

/** WebGPU background powered by vgpu. Stays invisible (CSS fallback shows) when WebGPU is missing. */
export function ShaderCanvas({ shader, className = "", interactive = false }: ShaderCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return startShader(canvas, shader, {
      interactive,
      still,
      onReady: () => setReady(true),
      onError: (error) => console.warn("[ShaderCanvas] WebGPU unavailable, using CSS fallback.", error),
    });
  }, [shader, interactive]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-ready={ready || undefined}
      className={`shader-canvas pointer-events-none ${className}`}
    />
  );
}
