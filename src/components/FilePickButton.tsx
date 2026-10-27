"use client";

import type { ReactNode } from "react";

export const DOCUMENT_ACCEPT =
  ".txt,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

/**
 * File control that iPhone and iPad Safari can actually open.
 * A display:none input inside a label is ignored on iOS; the input has to
 * cover the button with a real (invisible) hit target.
 */
export function FilePickButton({
  children,
  busy = false,
  disabled = false,
  accept = DOCUMENT_ACCEPT,
  onFile,
  className = "btn btn-ghost",
}: {
  children: ReactNode;
  busy?: boolean;
  disabled?: boolean;
  accept?: string;
  onFile: (file: File) => void | Promise<void>;
  className?: string;
}) {
  const locked = busy || disabled;
  return (
    <label
      className={`relative isolate overflow-hidden ${className} ${locked ? "pointer-events-none opacity-60" : "cursor-pointer"}`}
    >
      {children}
      <input
        type="file"
        accept={accept}
        disabled={locked}
        className="file-pick-input"
        onChange={(e) => {
          const file = e.currentTarget.files?.[0];
          e.currentTarget.value = "";
          if (file) void onFile(file);
        }}
      />
    </label>
  );
}
