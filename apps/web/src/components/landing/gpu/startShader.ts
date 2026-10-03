import { clock, effect, frameLoop, init, surface } from "vgpu";
import type { FrameLoopHandle } from "vgpu";

type Gpu = Awaited<ReturnType<typeof init>>;

export interface ShaderOptions {
  /** Follow the pointer across the canvas (normalized, top-left origin). */
  interactive?: boolean;
  /** Render a single still frame instead of animating. */
  still?: boolean;
  onReady?: () => void;
  onError?: (error: unknown) => void;
}

const INTRO_SECONDS = 1.6;
const STILL_TIME = 14;

/**
 * Runs a fullscreen WGSL effect on `canvas`. The shader must declare
 * `params: { resolution, pointer, time, intro }` at group 0, binding 0.
 * Returns a teardown function.
 */
export function startShader(canvas: HTMLCanvasElement, wgsl: string, options: ShaderOptions = {}): () => void {
  let disposed = false;
  let gpu: Gpu | undefined;
  let loop: FrameLoopHandle | undefined;
  const cleanups: (() => void)[] = [];

  void (async () => {
    try {
      if (!("gpu" in navigator)) throw new Error("WebGPU is not available");
      gpu = await init({ powerPreference: "high-performance" });
      if (disposed) return gpu.dispose();

      const canvasSurface = surface(gpu, canvas, { dpr: [1, 1.5], alphaMode: "premultiplied", clearColor: [0, 0, 0, 0] });
      const pointer: [number, number] = [0.7, 0.4];
      const target: [number, number] = [0.7, 0.4];
      const field = effect(gpu, wgsl, {
        label: "landing-shader",
        set: { params: { resolution: canvasSurface.size, pointer, time: options.still ? STILL_TIME : 0, intro: options.still ? 1 : 0 } },
      });
      cleanups.push(canvasSurface.onResize(() => field.set({ params: { resolution: canvasSurface.size } })));

      if (options.interactive) {
        const onMove = (event: PointerEvent) => {
          const rect = canvas.getBoundingClientRect();
          target[0] = (event.clientX - rect.left) / Math.max(rect.width, 1);
          target[1] = (event.clientY - rect.top) / Math.max(rect.height, 1);
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        cleanups.push(() => window.removeEventListener("pointermove", onMove));
      }

      // Surfaces only exist inside a frame, so pre-warm against their signature.
      await field.compile({ colors: [canvasSurface.format] });
      if (disposed) return;

      if (options.still) {
        loop = frameLoop(gpu, (frame) => {
          frame.pass(canvasSurface, field);
          loop?.stop();
        });
        options.onReady?.();
        return;
      }

      const time = clock(gpu);
      let elapsed = 0;
      const start = () => {
        if (loop || !gpu) return;
        loop = frameLoop(gpu, (frame) => {
          // Clamp the step so resuming after a pause does not jump the animation.
          const dt = Math.min(time.deltaTime, 1 / 20);
          elapsed += dt;
          const ease = 1 - Math.exp(-dt * 4);
          pointer[0] += (target[0] - pointer[0]) * ease;
          pointer[1] += (target[1] - pointer[1]) * ease;
          field.set({ params: { time: elapsed, pointer, intro: Math.min(elapsed / INTRO_SECONDS, 1) } });
          frame.pass(canvasSurface, field);
        });
      };
      const stop = () => {
        loop?.stop();
        loop = undefined;
      };

      // Only spend GPU time while the canvas is on screen.
      const observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
      observer.observe(canvas);
      cleanups.push(() => observer.disconnect());
      options.onReady?.();
    } catch (error) {
      if (!disposed) options.onError?.(error);
    }
  })();

  return () => {
    disposed = true;
    loop?.stop();
    cleanups.forEach((cleanup) => cleanup());
    gpu?.dispose();
  };
}
