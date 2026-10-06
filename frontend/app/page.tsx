"use client";

import { Navbar } from "@/components/nexus/Navbar";
import { Hero } from "@/components/nexus/Hero";
import { ScrollStory } from "@/components/nexus/ScrollStory";

import { FinalCTA } from "@/components/nexus/FinalCTA";
import { Footer } from "@/components/nexus/Footer";
import { CursorGlow } from "@/components/nexus/CursorGlow";
import { useSmoothScroll } from "@/components/nexus/useLenis";

const TITLE = "BEACON — One Front Door For Your Enterprise";
const DESCRIPTION =
  "BEACON is the enterprise AI orchestrator that routes one question across HR, IT and Finance systems and returns one grounded, cited answer.";

export default function Index() {
  useSmoothScroll();

  return (
    <main className="relative bg-background">
      <CursorGlow />
      <Navbar />
      <Hero />
      <ScrollStory />

      <FinalCTA />
      <Footer />
    </main>
  );
}
