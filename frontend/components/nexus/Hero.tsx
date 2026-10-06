"use client";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ClientOnly } from "./ClientOnly";
import { MagneticButton } from "./MagneticButton";
import { IntroSequence } from "./IntroSequence";

const CoreScene = dynamic(() => import("./CoreScene"), { ssr: false, loading: () => <div className="aurora-bg h-full w-full" /> });

export function Hero() {
  const router = useRouter();

  return (
    <section className="noise relative h-[100svh] w-full overflow-hidden">
      <IntroSequence />
      <div className="absolute inset-0">
        <CoreScene />
      </div>

      <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" />
      <div className="pointer-events-none absolute inset-0 aurora-bg opacity-70 mix-blend-screen" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-background to-transparent" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 45% 38% at 50% 52%, color-mix(in oklab, var(--background) 72%, transparent), transparent 75%)",
        }}
      />

      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-6 text-center pt-24">
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="eyebrow"
        >
          Enterprise Intelligence Orchestrator
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 28, filter: "blur(14px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.3, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="text-gradient mt-6 text-[clamp(2.6rem,8.5vw,6.5rem)] font-bold leading-[0.92]"
        >
          ONE FRONT DOOR
          <br />
          FOR YOUR ENTERPRISE
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 max-w-md text-balance text-sm leading-relaxed text-muted-foreground sm:text-base"
        >
          One question. Multiple systems. One intelligent answer.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <MagneticButton
            onClick={() =>
              document.getElementById("architecture")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Explore Architecture
          </MagneticButton>
          <MagneticButton variant="ghost" onClick={() => router.push("/assistant")}>
            Launch Beacon
          </MagneticButton>
        </motion.div>
      </div>

      <div className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2">
        <div className="h-12 w-px animate-breathe bg-gradient-to-b from-transparent via-primary to-transparent" />
      </div>
    </section>
  );
}
