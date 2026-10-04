"use client";

import { useRef } from "react";

/** "Así funciona Proofy" button that plays the promo video in a modal. */
export function HeroVideo() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const open = () => {
    dialogRef.current?.showModal();
    void videoRef.current?.play().catch(() => {});
  };

  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="inline-flex cursor-pointer items-center justify-center gap-3 rounded-full border border-white/20 px-6 py-4 text-sm transition-colors hover:border-lime/50 hover:bg-white/5"
        id="hero-cta-learn"
        aria-haspopup="dialog"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/40 text-[9px]" aria-hidden="true">▶</span>
        Así funciona Proofy
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Video: así funciona Proofy"
        className="hero-video-dialog"
        onClose={() => videoRef.current?.pause()}
        onClick={(event) => event.target === event.currentTarget && close()}
      >
        <div className="relative">
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar video"
            className="absolute -top-11 right-0 cursor-pointer font-mono text-xs tracking-wider text-white/60 transition-colors hover:text-white"
          >
            CERRAR ✕
          </button>
          <video
            ref={videoRef}
            src="/proofy-promo.mp4"
            poster="/proofy-promo-poster.jpg"
            controls
            playsInline
            preload="none"
            className="block aspect-video w-full rounded-xl border border-white/10 bg-black"
          />
        </div>
      </dialog>
    </>
  );
}
