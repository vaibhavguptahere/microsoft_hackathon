"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const LINES = [
  { text: "> initializing beacon ...", at: 150 },
  { text: "> neural core online", at: 1100 },
  { text: "> linking hr · it · finance networks", at: 2000 },
  { text: "> system ready", at: 2800 },
];

const BOOT_MS = 3400;

export function IntroSequence() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const timers = LINES.map((l, i) =>
      window.setTimeout(() => setStep((s) => Math.max(s, i + 1)), l.at),
    );
    timers.push(window.setTimeout(() => setDone(true), BOOT_MS));
    timers.push(window.setTimeout(() => setGone(true), BOOT_MS + 1100));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  const skip = () => {
    setDone(true);
    window.setTimeout(() => setGone(true), 700);
  };

  if (gone) return null;

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          onClick={skip}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(12px)" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[70] flex cursor-pointer flex-col items-center justify-center bg-background"
        >
          <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />

          <div className="relative flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-primary/30 animate-breathe" />
            <div className="absolute inset-4 rounded-full border border-primary/50 animate-breathe [animation-delay:-1.5s]" />
            <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_30px_6px_color-mix(in_oklab,var(--primary)_60%,transparent)]" />
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 14, letterSpacing: "0.8em" }}
            animate={{ opacity: 1, y: 0, letterSpacing: "0.42em" }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="font-display mt-8 text-2xl font-bold text-foreground sm:text-3xl"
          >
            BEACON
          </motion.h1>

          <div className="mt-8 h-20 font-mono text-[11px] tracking-[0.22em] text-muted-foreground sm:text-xs">
            <AnimatePresence>
              {LINES.slice(0, step).map((l, i) => (
                <motion.p
                  key={l.text}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className={i === step - 1 && i === LINES.length - 1 ? "text-primary" : ""}
                >
                  {l.text}
                </motion.p>
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-4 h-px w-48 overflow-hidden bg-border/60">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: BOOT_MS / 1000, ease: "linear" }}
              className="h-full bg-primary"
            />
          </div>

          <p className="mt-10 text-[10px] tracking-[0.3em] text-muted-foreground/50">
            CLICK TO SKIP
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
