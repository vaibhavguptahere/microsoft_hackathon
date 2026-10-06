"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, LogIn, ChevronDown, BookOpen } from "lucide-react";
import Link from "next/link";
import type { Msg } from "./types";

export function NexusMessage({ msg }: { msg: Msg }) {
  const [showSources, setShowSources] = useState(false);
  
  const hasEvidence = msg.evidence && msg.evidence.length > 0;

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
          {msg.text}
        </p>
        
        {msg.requiresLogin && (
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
        
        {/* ChatGPT-style expandable sources button inside the chat bubble */}
        {hasEvidence && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <button
              onClick={() => setShowSources(!showSources)}
              className="group flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                <BookOpen className="h-3 w-3" />
              </span>
              <span>Sources</span>
              <span className="text-[10px] opacity-70">({msg.evidence?.length})</span>
              <ChevronDown 
                className={`ml-1 h-3.5 w-3.5 transition-transform duration-200 ${showSources ? "rotate-180" : ""}`} 
              />
            </button>
            
            <AnimatePresence>
              {showSources && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {msg.evidence?.map((e, idx) => (
                      <div key={`${e.source}-${idx}`} className="flex flex-col gap-1 rounded-xl bg-black/20 p-3 border border-white/5">
                        <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                          <FileText className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{e.source}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2" title={e.detail}>
                          {e.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
