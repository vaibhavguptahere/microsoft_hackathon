"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, useSpring, type MotionValue } from "framer-motion";
import { Zap, Sparkles, ArrowRight } from "lucide-react";

function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <div className="mb-10 flex items-center gap-4">
      <span className="eyebrow">{index}</span>
      <span className="h-px w-16 bg-gradient-to-r from-primary/70 to-transparent" />
      <h2 className="text-sm font-medium tracking-[0.2em] text-muted-foreground">{title}</h2>
    </div>
  );
}

/* SECTION 1 — three doors merge into one */
function DoorsMerge() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const smoothProgress = useSpring(scrollYProgress, { mass: 0.1, stiffness: 100, damping: 20 });

  const spread = useTransform(smoothProgress, [0.1, 0.62], [1, 0]);
  const doorOpacity = useTransform(smoothProgress, [0.5, 0.72], [1, 0]);
  const nexusOpacity = useTransform(smoothProgress, [0.6, 0.82], [0, 1]);
  const nexusScale = useTransform(smoothProgress, [0.6, 0.9], [0.8, 1]);

  const doors = [
    { label: "HR", offset: -1 },
    { label: "IT", offset: 0 },
    { label: "Finance", offset: 1 },
  ];

  return (
    <section ref={ref} id="product" className="relative h-[280vh]">
      <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-center overflow-hidden px-6">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
        <div className="relative z-10 w-full max-w-5xl">
          <SectionLabel index="01" title="THREE DOORS BECOME ONE" />
          <div className="relative flex h-[46vh] items-center justify-center">
            {doors.map((d) => (
              <Door key={d.label} label={d.label} offset={d.offset} spread={spread} opacity={doorOpacity} />
            ))}
            <motion.div
              style={{ opacity: nexusOpacity, scale: nexusScale }}
              className="glass-panel glow-ring absolute flex h-56 w-72 flex-col items-center justify-center rounded-3xl"
            >
              <div className="absolute inset-0 rounded-3xl bg-primary/10 blur-2xl" />
              <span className="relative font-display text-3xl font-bold tracking-[0.35em] text-foreground">
                BEACON
              </span>
              <span className="relative mt-3 text-xs text-muted-foreground">The One Front Door</span>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Door({
  label,
  offset,
  spread,
  opacity,
}: {
  label: string;
  offset: number;
  spread: MotionValue<number>;
  opacity: MotionValue<number>;
}) {
  const x = useTransform(spread, (s) => offset * s * 240);
  const rotate = useTransform(spread, (s) => offset * s * 6);
  return (
    <motion.div
      style={{ x, rotate, opacity }}
      className="glass-panel absolute flex h-56 w-44 flex-col items-center justify-center rounded-3xl will-change-transform"
    >
      <div className="h-10 w-10 rounded-full border border-primary/40 bg-primary/10" />
      <span className="mt-5 font-mono text-[11px] tracking-[0.3em] text-muted-foreground">
        {label.toUpperCase()}
      </span>
      <span className="mt-2 text-[10px] text-muted-foreground/60">isolated system</span>
    </motion.div>
  );
}

/* SECTION 2 — Chatbot Engine / Intents at Scale (One Question, Many Intents) */
function QuerySplit() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const smoothProgress = useSpring(scrollYProgress, { mass: 0.1, stiffness: 100, damping: 20 });

  const titleY = useTransform(smoothProgress, [0, 0.2], [50, 0]);
  const titleOpacity = useTransform(smoothProgress, [0, 0.2], [0, 1]);

  const cardY = useTransform(smoothProgress, [0.15, 0.45], [100, 0]);
  const cardOpacity = useTransform(smoothProgress, [0.15, 0.4], [0, 1]);
  const cardScale = useTransform(smoothProgress, [0.15, 0.45], [0.95, 1]);

  const handleLaunch = (textToUse?: string) => {
    const q = (textToUse ?? query).trim();
    if (q) {
      router.push(`/assistant?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/assistant");
    }
  };

  const quickSamples = [
    "My VPN isn't working and can I work from home tomorrow?",
    "How do I expense a client dinner in Berlin?",
    "What's the onboarding checklist for a new engineer?",
  ];

  return (
    <section ref={ref} id="chatbot-preview" className="relative h-[200vh]">
      <div className="sticky top-0 flex h-[100svh] w-full flex-col items-center justify-center overflow-hidden px-6">
        {/* Background glow and ambient atmosphere */}
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-30 transform-gpu" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-cyan-500/10 blur-[130px] rounded-full transform-gpu" />

        <div className="relative z-10 mx-auto w-full max-w-4xl text-center">
          <motion.div style={{ opacity: titleOpacity, y: titleY }} className="flex flex-col items-center will-change-transform">
            <SectionLabel index="02" title="ONE QUESTION, MANY INTENTS" />

            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-mono tracking-widest text-cyan-300 shadow-inner backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>MULTI-AGENT ENTERPRISE ASSISTANT</span>
            </div>

            {/* Heading with Staggered Text Reveal */}
            <h2 className="mt-5 text-4xl sm:text-6xl font-black tracking-tight text-white uppercase font-display flex flex-wrap justify-center overflow-hidden">
              {["ANSWERS", "AT", "SCALE"].map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: "100%" }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.1 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="inline-block mr-[0.25em]"
                >
                  {word === "SCALE" ? (
                    <span className="italic font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300">
                      SCALE
                    </span>
                  ) : (
                    word
                  )}
                </motion.span>
              ))}
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-neutral-400 leading-relaxed font-sans">
              One front door for your company. Ask complex multi-intent workplace questions, attach internal policy documents, and watch Beacon route across HR, IT, and Finance in real time.
            </p>
          </motion.div>

          {/* Glowing Interactive Chatbot Card */}
          <motion.div
            style={{ opacity: cardOpacity, y: cardY, scale: cardScale }}
            className="relative mx-auto mt-10 w-full max-w-3xl group text-left will-change-transform transform-gpu"
          >
            {/* Cyan-teal ambient backlight */}
            <div className="pointer-events-none absolute -inset-1.5 rounded-[28px] bg-gradient-to-br from-cyan-500/20 via-teal-500/15 to-primary/20 blur-2xl opacity-60 transition duration-700 group-hover:opacity-100" />

            {/* Main Card Frame */}
            <div
              onClick={() => handleLaunch()}
              className="relative flex flex-col rounded-[24px] border border-cyan-500/30 bg-[#0b0e14]/90 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.85)] transition-all duration-300 group-hover:border-cyan-400/50 cursor-pointer"
            >
              {/* Prompt input area */}
              <div className="relative min-h-[110px]">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleLaunch();
                    }
                  }}
                  placeholder="Ask anything across HR, IT, and Finance (e.g., 'My VPN is failing and how do I apply for remote work tomorrow?')..."
                  rows={4}
                  className="w-full resize-none bg-transparent font-sans text-sm sm:text-base text-neutral-100 placeholder:text-neutral-500 outline-none leading-relaxed"
                />
              </div>

              {/* Bottom Bar: Deconstructed Intents on the left, Ask Beacon Assistant on the right */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
                {/* Deconstructed Intent Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] tracking-wider text-neutral-400 uppercase">
                    Deconstructed Intents:
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[10px] text-cyan-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    IT · VPN Connectivity
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 font-mono text-[10px] text-purple-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                    HR · Remote Work Policy
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[10px] text-neutral-400">
                    Finance · On Standby
                  </span>
                </div>

                {/* Ask Beacon Chatbot button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLaunch();
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-gradient-to-r from-cyan-500/30 via-cyan-400/25 to-teal-500/30 px-5 py-2.5 text-xs sm:text-sm font-semibold text-cyan-100 shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] hover:border-cyan-300 active:scale-[0.98]"
                >
                  <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                  <span>Ask Beacon Assistant</span>
                </button>
              </div>
            </div>

            {/* Quick interactive suggestion pills */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="font-mono text-[11px] text-neutral-400">Try sample question:</span>
              {quickSamples.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleLaunch(sample); }}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-left font-sans text-xs text-neutral-300 transition-colors hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-cyan-200 z-20 relative"
                >
                  “{sample}”
                </button>
              ))}
            </div>

            <p className="mt-3 text-center font-mono text-[11px] text-neutral-500">
              Click anywhere on the card or launch button to open the Beacon Chatbot →
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* SECTION 3 — agent routing network */
interface FlowNode {
  id: string;
  label: string;
  x: number;
  y: number;
  row: number;
}

interface FlowEdge {
  from: string;
  to: string;
  stage: number;
}

const FLOW: FlowNode[] = [
  { id: "router", label: "Router Agent", x: 50, y: 8, row: 0 },
  { id: "it", label: "IT Agent", x: 18, y: 32, row: 1 },
  { id: "finance", label: "Finance Agent", x: 50, y: 32, row: 1 },
  { id: "hr", label: "HR Agent", x: 82, y: 32, row: 1 },
  { id: "vpn", label: "VPN Guide", x: 18, y: 58, row: 2 },
  { id: "expense", label: "Expense Policy", x: 50, y: 58, row: 2 },
  { id: "wfh", label: "WFH Policy", x: 82, y: 58, row: 2 },
  { id: "evidence", label: "Evidence Nodes", x: 50, y: 78, row: 3 },
  { id: "response", label: "Response Generator", x: 50, y: 94, row: 4 },
];

const EDGES: FlowEdge[] = [
  // Stage 0: Router -> 3 Agents (draw simultaneously)
  { from: "router", to: "it", stage: 0 },
  { from: "router", to: "finance", stage: 0 },
  { from: "router", to: "hr", stage: 0 },

  // Stage 1: 3 Agents -> 3 Knowledge Policies (draw simultaneously)
  { from: "it", to: "vpn", stage: 1 },
  { from: "finance", to: "expense", stage: 1 },
  { from: "hr", to: "wfh", stage: 1 },

  // Stage 2: 3 Policies -> Evidence Nodes (converge simultaneously)
  { from: "vpn", to: "evidence", stage: 2 },
  { from: "expense", to: "evidence", stage: 2 },
  { from: "wfh", to: "evidence", stage: 2 },

  // Stage 3: Evidence Nodes -> Response Generator
  { from: "evidence", to: "response", stage: 3 },
];

function AgentNetwork() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const smoothProgress = useSpring(scrollYProgress, { mass: 0.1, stiffness: 100, damping: 20 });
  const pathProgress = useTransform(smoothProgress, [0.10, 0.88], [0, 1]);

  const node = (id: string) => FLOW.find((n) => n.id === id)!;

  return (
    <section ref={ref} id="architecture" className="relative h-[320vh]">
      <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden px-6">
        <div className="pointer-events-none absolute inset-0 aurora-bg opacity-40" />
        <div className="relative z-10 w-full max-w-4xl">
          <SectionLabel index="03" title="LIVE AGENT ORCHESTRATION" />
          <div className="relative h-[68vh] w-full">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="edge-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5b8cff" />
                  <stop offset="50%" stopColor="#2dd4bf" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>

              {EDGES.map((edge, i) => {
                const from = node(edge.from);
                const to = node(edge.to);
                const d = `M ${from.x} ${from.y} C ${from.x} ${(from.y + to.y) / 2}, ${to.x} ${(from.y + to.y) / 2}, ${to.x} ${to.y}`;
                return <Edge key={i} d={d} stage={edge.stage} progress={pathProgress} />;
              })}
            </svg>

            {FLOW.map((n) => (
              <NodeChip key={n.id} node={n} progress={pathProgress} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Edge({
  d,
  stage,
  progress,
}: {
  d: string;
  stage: number;
  progress: MotionValue<number>;
}) {
  const STAGE_RANGES: Record<number, [number, number]> = {
    0: [0.02, 0.26], // Router -> IT/Finance/HR (all 3 together)
    1: [0.26, 0.52], // Agents -> Policies (all 3 together)
    2: [0.52, 0.78], // Policies -> Evidence (all 3 converge together)
    3: [0.78, 0.98], // Evidence -> Response
  };

  const [start, end] = STAGE_RANGES[stage] ?? [0, 1];
  const draw = useTransform(progress, [start, end], [0, 1], { clamp: true });
  const opacity = useTransform(progress, [start, start + 0.02, end, 1], [0, 1, 1, 1], { clamp: true });

  return (
    <>
      {/* Background wire track - always cleanly visible */}
      <path
        d={d}
        fill="none"
        stroke="rgba(255, 255, 255, 0.14)"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />

      {/* Laser glow bloom underneath - replaced blur with thick low opacity stroke for perf */}
      <motion.path
        d={d}
        fill="none"
        stroke="url(#edge-gradient)"
        strokeWidth={10}
        vectorEffect="non-scaling-stroke"
        style={{ pathLength: draw, opacity }}
        className="opacity-20"
      />

      {/* Sharp vibrant active neon line */}
      <motion.path
        d={d}
        fill="none"
        stroke="url(#edge-gradient)"
        strokeWidth={2.5}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        style={{ pathLength: draw, opacity }}
      />
    </>
  );
}

function NodeChip({
  node,
  progress,
}: {
  node: FlowNode;
  progress: MotionValue<number>;
}) {
  // Synchronized threshold per row so all 3 agents light up at the same scroll moment!
  const ROW_THRESHOLDS: Record<number, [number, number]> = {
    0: [0.0, 0.05],   // Router Agent
    1: [0.18, 0.28],  // IT Agent, Finance Agent, HR Agent
    2: [0.44, 0.54],  // VPN Guide, Expense Policy, WFH Policy
    3: [0.68, 0.78],  // Evidence Nodes
    4: [0.86, 0.96],  // Response Generator
  };

  const [t0, t1] = ROW_THRESHOLDS[node.row] ?? [0, 0.1];
  const opacity = useTransform(progress, [t0, t1], [0.35, 1], { clamp: true });
  const scale = useTransform(progress, [t0, t1], [0.9, 1], { clamp: true });

  const isAgent = node.row === 1;
  const isFinance = node.id === "finance";
  const isIT = node.id === "it";

  return (
    <motion.div
      style={{ left: `${node.x}%`, top: `${node.y}%`, opacity, scale }}
      className={`glass-panel absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-4 py-2 font-mono text-[10px] tracking-[0.18em] transition-all duration-300 sm:text-[11px] will-change-transform ${isAgent
        ? isFinance
          ? "border-emerald-500/50 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.35)] bg-[#0b1414]/90"
          : isIT
            ? "border-cyan-500/50 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.35)] bg-[#0b1218]/90"
            : "border-purple-500/50 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.35)] bg-[#140e1c]/90"
        : "text-foreground"
        }`}
    >
      <div className="flex items-center gap-2">
        {isAgent && (
          <span
            className={`h-2 w-2 rounded-full animate-pulse shadow-[0_0_8px_currentColor] ${isFinance ? "bg-emerald-400 text-emerald-400" : isIT ? "bg-cyan-400 text-cyan-400" : "bg-purple-400 text-purple-400"
              }`}
          />
        )}
        <span>{node.label.toUpperCase()}</span>
      </div>
    </motion.div>
  );
}

/* SECTION 4 — Enterprise Grade */
const COMPLIANCE_ITEMS = [
  { title: "Multi-Agent Routing", desc: "Dynamic dispatch to specialized IT, HR, and Finance agents" },
  { title: "Explainable Decisions", desc: "Every answer includes citations and full reasoning traces" },
  { title: "Human-in-the-loop", desc: "Automatic standby and escalation if confidence drops below 70%" },
];

const AUDIT_LOGS = [
  { time: "12:34:21", event: "router_dispatched" },
  { time: "12:34:18", event: "intent_classified" },
  { time: "12:34:15", event: "policy_retrieved" },
  { time: "12:34:12", event: "confidence_scored" },
  { time: "12:34:09", event: "response_generated" },
];

function EvidenceGrid() {
  return (
    <section id="trust" className="relative px-6 py-32 overflow-hidden">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12">
          <SectionLabel index="04" title="EXPLAINABILITY" />
        </div>

        <div className="grid gap-16 lg:grid-cols-2 lg:gap-12 items-center">
          {/* Left Side: Copy */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            className="flex flex-col"
          >
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground flex flex-wrap overflow-hidden">
              {["Transparent,", "explainable", "agent", "orchestration."].map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: "100%" }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="inline-block mr-[0.2em]"
                >
                  {word}
                </motion.span>
              ))}
            </h2>
            <p className="mt-6 text-base text-muted-foreground leading-relaxed max-w-md">
              Beacon doesn't guess. It routes intents, retrieves grounded policies, and provides full traceability for every AI decision.
            </p>

            <div className="mt-10 flex flex-col gap-8">
              {COMPLIANCE_ITEMS.map((item) => (
                <div key={item.title} className="flex flex-col">
                  <h3 className="font-display text-lg text-foreground">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 flex flex-wrap gap-4 text-xs font-mono text-muted-foreground/60">
              {["Grounded GenAI", "RAG Powered", "Full Traceability", "Zero Hallucination"].map(badge => (
                <span key={badge} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-primary/40" />
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right Side: Audit Trail UI */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass-panel relative rounded-3xl p-6 sm:p-8 border border-white/5 bg-black/40 shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="eyebrow text-[10px] tracking-widest text-muted-foreground">LIVE AUDIT TRAIL</span>
            </div>
            <div className="flex flex-col gap-3">
              {AUDIT_LOGS.map((log, i) => (
                <motion.div
                  key={log.time}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 + (i * 0.1) }}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs text-muted-foreground/50">{log.time}</span>
                    <span className="font-mono text-sm text-foreground/80">{log.event}</span>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* SECTION 5 — convergence */
function Convergence() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const scale = useTransform(scrollYProgress, [0, 0.7], [0.4, 1.6]);
  const glow = useTransform(scrollYProgress, [0.2, 0.75], [0.15, 1]);
  const answerOpacity = useTransform(scrollYProgress, [0.55, 0.8], [0, 1]);

  return (
    <section ref={ref} className="relative h-[240vh]">
      <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden px-6">
        <motion.div
          style={{ scale, opacity: glow }}
          className="absolute h-[42vmin] w-[42vmin] rounded-full bg-primary/40 blur-[90px]"
        />
        <motion.div
          style={{ opacity: answerOpacity }}
          className="glass-panel glow-ring relative z-10 max-w-2xl rounded-3xl p-8 text-left"
        >
          <span className="eyebrow">one intelligent answer</span>
          <p className="mt-5 text-sm leading-relaxed text-foreground sm:text-base">
            Your VPN is failing because split tunneling is disabled on the new gateway — reset it
            from the client in two steps. And yes: your team policy allows two remote days per
            week, so tomorrow is approved.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["IT · VPN Guide §3", "HR · Remote Work Policy 2026", "Confidence 96%"].map((t) => (
              <span
                key={t}
                className="rounded-full border border-border bg-glass px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function ScrollStory() {
  return (
    <>
      <DoorsMerge />
      <QuerySplit />
      <AgentNetwork />
      <EvidenceGrid />
    </>
  );
}
