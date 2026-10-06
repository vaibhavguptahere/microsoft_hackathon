"use client";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function ChatSidebar({ 
  thinking, 
  sessions = [], 
  onSelectChat 
}: { 
  thinking: string[] | null,
  sessions?: any[],
  onSelectChat?: (id: string) => void
}) {
  return (
    <aside className="relative z-10 hidden w-72 shrink-0 p-4 lg:block">
      <div className="glass-panel flex h-full flex-col rounded-3xl p-5">
        <Link href="/" className="font-display text-sm font-bold tracking-[0.42em] text-foreground">
          BEACON
        </Link>
        <p className="mt-2 text-[11px] text-muted-foreground">Enterprise orchestrator</p>

        <div className="mt-8 space-y-2">
          <span className="eyebrow">live routing</span>
          {["Router Agent", "IT Agent", "HR Agent", "Finance Agent"].map((a) => {
            const active = thinking?.includes(a);
            return (
              <div
                key={a}
                className={`flex items-center justify-between rounded-xl border border-border/60 px-3 py-2 text-[11px] transition-colors ${active ? "bg-primary/15 text-foreground" : "text-muted-foreground"
                  }`}
              >
                <span className="font-mono tracking-[0.14em]">{a.toUpperCase()}</span>
                <span
                  className={`h-1.5 w-1.5 rounded-full ${active ? "animate-breathe bg-primary" : "bg-muted-foreground/40"}`}
                />
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex-1 overflow-y-auto space-y-3 pr-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
          <span className="eyebrow sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-1">chat history</span>
          <div className="space-y-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectChat?.(session.id)}
                className="w-full text-left truncate rounded-lg border border-border/40 px-3 py-2 text-[12px] text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
              >
                {session.title || "New Chat"}
              </button>
            ))}
            {sessions.length === 0 && (
              <p className="text-[11px] text-muted-foreground/60">No recent chats.</p>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/60 px-3 py-2 text-[11px] text-muted-foreground shrink-0">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          Human escalation on standby
        </div>
      </div>
    </aside>
  );
}
