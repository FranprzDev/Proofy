"use client";

import { useState, type DragEvent, type ReactNode } from "react";
import { ContractIcon } from "./ContractIcon";
import { formatBytes } from "./labels";

export function Dropzone({ onPick, disabled = false, compact = false }: { onPick: (file: File | undefined) => void; disabled?: boolean; compact?: boolean }) {
  const [dragging, setDragging] = useState(false);

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    if (!disabled) onPick(e.dataTransfer.files[0]);
  };

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      data-dragging={dragging || undefined}
      data-compact={compact || undefined}
      aria-disabled={disabled || undefined}
      className="cw-dropzone group"
    >
      <input
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          onPick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <span className="cw-drop-icon" aria-hidden="true">
        <ContractIcon name="file" width={34} height={34} />
        <span className="cw-drop-tag">PDF</span>
      </span>
      <span className="mt-6 block text-lg font-medium sm:text-xl">{dragging ? "Soltá el PDF para analizarlo" : "Arrastrá el contrato acá"}</span>
      <span className="mt-2 block text-sm text-white/50">
        o <span className="text-lime underline decoration-lime/40 underline-offset-4 group-hover:decoration-lime">hacé clic para elegirlo</span>
        <span className="hidden sm:inline"> · el análisis arranca solo</span>
      </span>
      <span className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] tracking-wider text-white/35 uppercase">
        <span>Solo PDF</span>
        <span aria-hidden="true">·</span>
        <span>Texto seleccionable</span>
        <span aria-hidden="true">·</span>
        <span>Máx. 10 MB</span>
      </span>
    </label>
  );
}

/** The selected PDF: name, size, a status line and an optional trailing action. */
export function FileChip({ file, status, action }: { file: File; status: ReactNode; action?: ReactNode }) {
  return (
    <div className="cw-file-chip">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-lime/10 text-lime">
        <ContractIcon name="file" width={22} height={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium" title={file.name}>
          {file.name}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-white/45">
          {formatBytes(file.size)}
          <span aria-hidden="true">·</span>
          {status}
        </span>
      </span>
      {action}
    </div>
  );
}
