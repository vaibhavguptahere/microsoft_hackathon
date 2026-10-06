"use client";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function ChatSidebar({ thinking }: { thinking: string[] | null }) {
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

        <div className="mt-8 space-y-3">
          <span className="eyebrow">knowledge graph</span>
          <div className="space-y-2">
            {[
              { label: "HR", value: 64 },
              { label: "IT", value: 88 },
              { label: "Finance", value: 41 },
            ].map((k) => (
              <div key={k.label}>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span className="font-mono tracking-[0.18em]">{k.label.toUpperCase()}</span>
                  <span>{k.value}%</span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-secondary">
                  <div
                    className="h-1 rounded-full bg-gradient-to-r from-primary to-accent"
                    style={{ width: `${k.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto flex items-center gap-2 rounded-xl border border-border/60 px-3 py-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          Human escalation on standby
        </div>
      </div>
    </aside>
  );
}
