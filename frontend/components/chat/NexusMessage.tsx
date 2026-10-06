"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, LogIn } from "lucide-react";
import Link from "next/link";
import type { Msg } from "./types";

export function NexusMessage({ msg }: { msg: Msg }) {
  const [shown, setShown] = useState("");

  useEffect(() => {
    let i = 0;
    const id = window.setInterval(() => {
      i += 2;
      setShown(msg.text.slice(0, i));
      if (i >= msg.text.length) window.clearInterval(id);
    }, 16);
    return () => window.clearInterval(id);
  }, [msg.text]);

  const done = shown.length >= msg.text.length;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="glass-panel rounded-3xl rounded-bl-lg p-5">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-breathe rounded-full bg-primary" />
          <span className="font-mono text-[10px] tracking-[0.24em] text-muted-foreground">
            BEACON
          </span>
          {msg.confidence && !msg.requiresLogin && (
            <span className="ml-auto rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-[10px] text-foreground">
              {msg.confidence}% confidence
            </span>
          )}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-foreground">
          {shown}
          {!done && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-primary align-middle" />}
        </p>
        
        {done && msg.requiresLogin && (
          <div className="mt-5">
            <Link 
              href="/auth" 
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
            >
              <LogIn className="h-4 w-4" />
              Login to continue
            </Link>
          </div>
        )}
      </div>

      <AnimatePresence>
        {done && msg.evidence && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-3 sm:grid-cols-2"
          >
            {msg.evidence.map((e) => (
              <div key={e.source} className="glass-panel rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <span className="font-mono text-[10px] tracking-[0.14em] text-foreground">
                    {e.source}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">{e.detail}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
