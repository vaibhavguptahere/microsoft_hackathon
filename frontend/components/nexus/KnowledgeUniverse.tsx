"use client";
import { lazy, Suspense } from "react";
import { ClientOnly } from "./ClientOnly";

const GalaxyScene = lazy(() => import("./GalaxyScene"));

const CLUSTERS = [
  { label: "HR", count: "12,480 documents" },
  { label: "IT", count: "31,902 documents" },
  { label: "Finance", count: "8,714 documents" },
];

export function KnowledgeUniverse() {
  return (
    <section id="knowledge" className="relative h-[110svh] w-full overflow-hidden">
      <div className="absolute inset-0">
        <ClientOnly fallback={<div className="aurora-bg h-full w-full" />}>
          <Suspense fallback={<div className="aurora-bg h-full w-full" />}>
            <GalaxyScene />
          </Suspense>
        </ClientOnly>
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background to-transparent" />

      <div className="pointer-events-none relative z-10 mx-auto flex h-full max-w-5xl flex-col justify-between px-6 py-24">
        <div>
          <span className="eyebrow">05 — Knowledge Universe</span>
          <h2 className="mt-5 max-w-lg text-[clamp(2rem,5vw,3.6rem)] font-bold leading-[1.02] text-foreground">
            Every document, one gravity field.
          </h2>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Drag to orbit. Scroll to zoom. Each point is a retrievable passage clustered by domain.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {CLUSTERS.map((c) => (
            <div key={c.label} className="glass-panel rounded-2xl px-5 py-4">
              <span className="font-mono text-[11px] tracking-[0.24em] text-foreground">
                {c.label.toUpperCase()}
              </span>
              <p className="mt-1.5 text-xs text-muted-foreground">{c.count}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
