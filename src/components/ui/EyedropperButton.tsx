"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

// Eyedropper/pipette icon
const EyedropperIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 22 1-1h3l9-9" />
    <path d="M3 21v-3l9-9" />
    <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 0 1-3 3l-3.8-3.8a2.1 2.1 0 0 1 3-3l.4.4z" />
  </svg>
);

declare global {
  interface Window {
    EyeDropper?: new () => {
      open: (options?: { signal?: AbortSignal }) => Promise<{ sRGBHex: string }>;
    };
  }
}

export default function EyedropperButton({
  onPick,
  disabled = false,
  title = "Pick color from screen",
  className = "",
}: {
  onPick: (color: string) => void;
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  const [active, setActive] = useState(false);

  const handleClick = async () => {
    if (disabled || active) return;
    if (!("EyeDropper" in window)) {
      toast.error("Eyedropper is not supported in this browser. Try Chrome or Edge.");
      return;
    }
    setActive(true);
    try {
      const eyeDropper = new window.EyeDropper!();
      const result = await eyeDropper.open();
      const hex = result.sRGBHex;
      // Append alpha if not present (#RRGGBB -> #RRGGBBFF)
      const color = hex.length === 7 ? `${hex}FF` : hex;
      onPick(color);
    } catch (err) {
      // User cancelled - ignore
      if ((err as Error).name !== "AbortError") {
        toast.error("Could not pick color");
      }
    } finally {
      setActive(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || active}
      title={title}
      className={`flex items-center justify-center rounded-lg border-2 border-gray-300 hover:border-primary-400 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      aria-label={title}
    >
      <EyedropperIcon className="h-5 w-5 text-gray-600" />
    </button>
  );
}
