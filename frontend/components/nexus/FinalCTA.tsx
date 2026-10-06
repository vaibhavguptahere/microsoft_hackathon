"use client";
import { useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence, useSpring } from "framer-motion";
import { useRouter } from "next/navigation";
import { MagneticButton } from "./MagneticButton";

export function FinalCTA() {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [portal, setPortal] = useState(false);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const smoothProgress = useSpring(scrollYProgress, { mass: 0.1, stiffness: 100, damping: 20 });
  const collapse = useTransform(smoothProgress, [0, 1], [2.4, 1]);
  const spin = useTransform(smoothProgress, [0, 1], [-40, 0]);
  const fade = useTransform(smoothProgress, [0.2, 0.9], [0, 1]);

  const enter = () => {
    setPortal(true);
    window.setTimeout(() => router.push("/assistant"), 950);
  };

  return (
    <section ref={ref} className="noise relative flex h-[110svh] items-center justify-center overflow-hidden px-6">
      <motion.div
        style={{ scale: collapse, rotate: spin }}
        className="pointer-events-none absolute h-[60vmin] w-[60vmin] rounded-full border border-primary/25 transform-gpu will-change-transform"
      />
      <motion.div
        style={{ scale: collapse }}
        className="pointer-events-none absolute h-[34vmin] w-[34vmin] rounded-full bg-accent/25 blur-[100px] transform-gpu will-change-transform"
      />

      <motion.div style={{ opacity: fade }} className="relative z-10 text-center will-change-transform">
        <span className="eyebrow">the collapse</span>
        <h2 className="text-gradient mt-6 text-[clamp(2.2rem,7vw,5rem)] font-bold leading-[0.95]">
          STEP INSIDE
          <br />
          YOUR ENTERPRISE
        </h2>
        <p className="mx-auto mt-6 max-w-sm text-sm text-muted-foreground">
          The whole architecture folds into a single conversation.
        </p>
        <div className="mt-10">
          <MagneticButton onClick={enter}>Step Inside Your Enterprise</MagneticButton>
        </div>
      </motion.div>

      <AnimatePresence>
        {portal && (
          <motion.div
            initial={{ scale: 0, opacity: 0.9 }}
            animate={{ scale: 28, opacity: 1 }}
            transition={{ duration: 0.95, ease: [0.7, 0, 0.3, 1] }}
            className="pointer-events-none fixed left-1/2 top-1/2 z-50 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background"
            style={{ boxShadow: "0 0 120px 40px color-mix(in oklab, var(--primary) 60%, transparent)" }}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
