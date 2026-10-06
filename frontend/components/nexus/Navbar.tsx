"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const LINKS = [
  { label: "Product", href: "#product" },
  { label: "Architecture", href: "#architecture" },
  { label: "Knowledge", href: "#knowledge" },
  { label: "Trust", href: "#trust" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-700",
        scrolled ? "py-2" : "py-5",
      )}
      style={{ transitionTimingFunction: "var(--ease-cinema)" }}
    >
      <nav
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between rounded-full px-5 transition-all duration-700",
          scrolled
            ? "glass-panel h-12 backdrop-blur-2xl"
            : "h-16 border border-transparent bg-transparent",
        )}
        style={{ transitionTimingFunction: "var(--ease-cinema)" }}
      >
        <Link
          href="/"
          className="font-display text-sm font-bold tracking-[0.42em] text-foreground transition-[text-shadow] duration-700"
          style={{
            textShadow: scrolled
              ? "0 0 22px color-mix(in oklab, var(--primary) 85%, transparent)"
              : "0 0 0 transparent",
          }}
        >
          BEACON
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="group relative text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-primary transition-all duration-500 group-hover:w-full" />
            </a>
          ))}
        </div>

        <Link
          href="/auth"
          className="glow-ring rounded-full bg-primary/15 px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-primary/25"
        >
          Sign In
        </Link>
      </nav>
    </header>
  );
}
