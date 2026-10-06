"use client";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  className?: string;
};

export function MagneticButton({ children, onClick, variant = "primary", className }: Props) {
  const ref = useRef<HTMLButtonElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate3d(${dx * 0.18}px, ${dy * 0.25}px, 0)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = "translate3d(0,0,0)";
  };

  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className={cn(
        "glow-ring group relative inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium transition-[transform,box-shadow,background] duration-300",
        variant === "primary"
          ? "bg-primary/15 text-foreground shadow-[var(--shadow-glow)] hover:bg-primary/25"
          : "bg-glass text-muted-foreground backdrop-blur-xl hover:text-foreground",
        className,
      )}
      style={{ transitionTimingFunction: "var(--ease-cinema)" }}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
}
