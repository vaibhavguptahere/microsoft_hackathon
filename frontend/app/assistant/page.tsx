"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Sparkles, Network, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { CursorGlow } from "@/components/nexus/CursorGlow";
import { NexusMessage } from "@/components/chat/NexusMessage";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import type { Msg } from "@/components/chat/types";

const SUGGESTIONS = [
  "How many annual leaves are there?",
  "I need a new laptop and my VPN is broken.",
  "Can I work from home tomorrow, and how do I log into the remote portal?",
];



export default function AssistantPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState<string[] | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const activeChatIdRef = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        // Ensure profile exists in public.profiles table
        let { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!profile) {
          const { data: newProfile } = await supabase
            .from("profiles")
            .upsert({
              id: user.id,
              email: user.email!,
              name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
            })
            .select()
            .single();
          profile = newProfile;
        }

        setUser({ ...user, ...profile });
      } else {
        setUser(null);
      }
    });

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Are you sure you want to go back? This will terminate your session.";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setShowLogoutModal(false);
    router.push("/");
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      if (q) {
        const timer = setTimeout(() => {
          send(q);
        }, 200);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const [chatId, setChatId] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<any[]>([]);

  useEffect(() => {
    activeChatIdRef.current = chatId;
  }, [chatId]);

  useEffect(() => {
    if (user) {
      supabase.from("chats").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
        if (data) setChatSessions(data);
      });
    }
  }, [user, supabase]);

  const loadChat = async (id: string) => {
    if (id === chatId) return;
    setChatId(id);
    setThinking(null);
    setMessages([]);
    const { data: msgs } = await supabase.from("messages").select("*").eq("chat_id", id).order("created_at", { ascending: true });
    if (msgs) {
      setMessages(msgs.map((m: any) => ({
        id: ++idRef.current,
        role: m.role,
        text: m.content,
        evidence: m.sources || [],
        sources: m.sources,
        agents: m.domain ? ["Router Agent", `${m.domain} Agent`, "Response Generator"] : [],
      })));
    }
  };

  const handleNewChat = () => {
    setChatId(null);
    setMessages([]);
    setThinking(null);
  };

  const handleDeleteChat = async (id: string) => {
    setChatSessions((prev) => prev.filter((c) => c.id !== id));
    if (chatId === id) {
      handleNewChat();
    }
    const { error } = await supabase.from("chats").delete().eq("id", id);
    if (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  const handleRenameChat = async (id: string, newTitle: string) => {
    setChatSessions((prev) => prev.map((c) => c.id === id ? { ...c, title: newTitle } : c));
    const { error } = await supabase.from("chats").update({ title: newTitle }).eq("id", id);
    if (error) {
      console.error("Failed to rename chat:", error);
    }
  };

  const send = async (value: string) => {
    const q = value.trim();
    if (!q || thinking) return;
    setInput("");

    // Add user message to UI immediately
    setMessages((m) => [...m, { id: ++idRef.current, role: "user", text: q }]);

    // Start thinking state
    setThinking(["Router Agent", "Classifier", "RAG Engine"]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      let currentChatId = chatId;

      // 1. If user is logged in, handle Chat persistence
      if (user) {
        if (!currentChatId) {
          // Ensure profile exists before insert
          await supabase.from("profiles").upsert({
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
          });

          // Create a new chat session in Supabase
          const { data: chatData, error: chatError } = await supabase
            .from("chats")
            .insert([{ user_id: user.id, title: q.substring(0, 40) + "..." }])
            .select()
            .single();

          if (chatError) {
            console.error("Failed to create chat session:", chatError);
          } else if (chatData) {
            currentChatId = chatData.id;
            setChatId(currentChatId);
            setChatSessions((prev) => [chatData, ...prev]);
          }
        }

        // Save User Message to Supabase
        if (currentChatId) {
          const { error: msgError } = await supabase.from("messages").insert([{
            chat_id: currentChatId,
            role: "user",
            content: q
          }]);
          if (msgError) console.error("Failed to save user message:", msgError);
        }
      }

      // 2. Fetch answer from backend
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` })
        },
        body: JSON.stringify({ message: q }),
      });

      const data = await res.json();
      setThinking(null);

      if (data.success) {
        const sourcesMapped = (data.sources || []).map((s: any) => ({ source: s.title, detail: s.url }));

        // 3. Save Assistant Message to Supabase
        if (user && currentChatId) {
          await supabase.from("messages").insert([{
            chat_id: currentChatId,
            role: "nexus", // or 'assistant'
            content: data.answer,
            domain: data.domain,
            sources: sourcesMapped
          }]);
        }

        if (activeChatIdRef.current === currentChatId) {
          setMessages((m) => [...m, {
            id: ++idRef.current,
            role: "nexus",
            text: data.answer,
            evidence: sourcesMapped,
            sources: data.sources || [],
            agents: ["Router Agent", `${data.domain} Agent`, "Response Generator"],
            requiresLogin: data.requires_login
          }]);
        }
      } else {
        if (activeChatIdRef.current === currentChatId) {
          setMessages((m) => [...m, {
            id: ++idRef.current,
            role: "nexus",
            text: data.error || "An error occurred.",
            evidence: [],
            agents: ["Router Agent"]
          }]);
        }
      }
    } catch (err) {
      if (activeChatIdRef.current === currentChatId) {
        setThinking(null);
      }
      setMessages((m) => [...m, {
        id: ++idRef.current,
        role: "nexus",
        text: "Failed to connect to the backend server.",
        evidence: [],
        agents: ["Router Agent"]
      }]);
    }
  };

  return (
    <div className="relative flex h-[100svh] overflow-hidden bg-background">
      <CursorGlow />
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
      <div className="pointer-events-none absolute inset-0 aurora-bg opacity-50" />

      {/* Floating sidebar */}
      <ChatSidebar
        thinking={thinking}
        sessions={chatSessions}
        onSelectChat={loadChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
      />

      {/* Logout Button */}
      {user && (
        <div className="absolute right-6 top-6 z-50">
          <button
            onClick={handleLogoutClick}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs font-medium text-muted-foreground backdrop-blur-md transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                <LogOut className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Terminate Session?</h3>
              <p className="mb-6 text-sm text-muted-foreground text-balance">
                Are you sure you want to go back? This will terminate your current session.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
                >
                  Yes, go back
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Conversation */}
      <main className="relative z-10 flex min-w-0 flex-1 flex-col p-4">
        <div ref={scrollRef} className="flex-1 overflow-y-auto pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="mx-auto max-w-2xl space-y-6 pt-10">
            {messages.length === 0 && (
              <div className="text-center">
                <div className="mx-auto h-16 w-16 animate-breathe rounded-full bg-primary/30 blur-xl" />
                <h1 className="text-gradient mt-6 text-3xl font-bold sm:text-4xl">
                  Ask your enterprise
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  One question. Multiple systems. One intelligent answer.
                </p>
                <div className="mt-8 grid gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="glass-panel rounded-2xl px-4 py-3 text-left text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.length > 0 && chatId && (
              <div className="flex justify-center pb-2">
                <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] tracking-wide text-muted-foreground backdrop-blur-md">
                  {chatSessions.find((c) => c.id === chatId)?.created_at
                    ? new Date(chatSessions.find((c) => c.id === chatId)?.created_at).toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : new Date().toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}

            {messages.map((m) =>
              m.role === "user" ? (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end"
                >
                  <div className="glass-panel max-w-[85%] rounded-3xl rounded-br-[8px] bg-white/5 border border-white/10 px-5 py-3.5 text-[14px] leading-[1.6] font-medium text-foreground/90 tracking-[0.01em] shadow-lg shadow-black/20">
                    {m.text}
                  </div>
                </motion.div>
              ) : (
                <NexusMessage key={m.id} msg={m} />
              ),
            )}

            <AnimatePresence>
              {thinking && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="relative glass-panel rounded-3xl p-5 overflow-hidden"
                >
                  {/* Subtle ambient moving glow */}
                  <motion.div
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent w-[200%] -ml-[50%]"
                  />

                  <div className="relative flex items-center gap-3 font-medium tracking-wide p-1">
                    {/* Glowing ping radar icon */}
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 border border-primary/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                      <div className="absolute inset-0 rounded-full animate-ping bg-primary/20 duration-1000" />
                      <Sparkles className="h-4 w-4 text-primary relative z-10" />
                    </div>

                    {/* Dancing text with drop shadow */}
                    <div className="flex text-[14px] font-semibold text-primary drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
                      {"Beacon is orchestrating...".split("").map((char, index) => (
                        <motion.span
                          key={index}
                          animate={{ y: [0, -4, 0], opacity: [0.6, 1, 0.6] }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: index * 0.05,
                            ease: "easeInOut"
                          }}
                        >
                          {char === " " ? "\u00A0" : char}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mx-auto w-full max-w-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="glass-panel glow-ring flex items-center gap-3 rounded-full px-5 py-3"
          >
            <Network className="h-4 w-4 shrink-0 text-primary" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask across HR, IT and Finance…"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              aria-label="Send"
              className="rounded-full bg-primary/20 p-2 text-foreground transition-colors hover:bg-primary/35"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-3 pb-2 text-center text-[10px] text-muted-foreground">
            Every answer is grounded in cited enterprise sources.
          </p>
        </div>
      </main>
    </div>
  );
}
