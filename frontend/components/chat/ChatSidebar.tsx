"use client";
import Link from "next/link";
import { MessageSquare, Activity, MonitorSmartphone, Users, DollarSign, Command, Sparkles, Cpu, Plus, Trash2, Edit2 } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const agentConfig: Record<string, { icon: any, color: string }> = {
  "Router Agent": { icon: Command, color: "text-blue-400" },
  "IT Agent": { icon: MonitorSmartphone, color: "text-emerald-400" },
  "HR Agent": { icon: Users, color: "text-purple-400" },
  "Finance Agent": { icon: DollarSign, color: "text-amber-400" },
};

export function ChatSidebar({
  thinking,
  sessions = [],
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat
}: {
  thinking: string[] | null,
  sessions?: any[],
  onSelectChat?: (id: string) => void,
  onNewChat?: () => void,
  onDeleteChat?: (id: string) => void,
  onRenameChat?: (id: string, newTitle: string) => void
}) {
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  return (
    <>
      <aside className="relative z-10 hidden w-72 shrink-0 p-4 lg:block">
        <div className="glass-panel flex h-full flex-col rounded-[28px] p-5 shadow-2xl shadow-black/50 border border-white/5 relative overflow-hidden group">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-1000" />

          <div className="relative z-10">
            <Link href="/" className="flex items-center gap-3 group/logo w-max">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-inner group-hover/logo:shadow-primary/30 transition-all duration-500 group-hover/logo:scale-105">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="font-display text-[14px] font-bold tracking-[0.35em] text-foreground/90 group-hover/logo:text-white transition-colors">
                BEACON
              </span>
            </Link>
            <p className="mt-4 text-[10px] font-medium text-muted-foreground/70 tracking-widest uppercase">Enterprise orchestrator</p>
          </div>

          <div className="mt-8 space-y-2.5 relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-3.5 w-3.5 text-primary/70" />
              <span className="eyebrow !mb-0 text-primary/70">live routing</span>
            </div>

            <div className="grid gap-2">
              {["Router Agent", "IT Agent", "HR Agent", "Finance Agent"].map((a) => {
                const active = thinking?.includes(a);
                const { icon: Icon, color } = agentConfig[a] || { icon: Cpu, color: "text-primary" };
                return (
                  <div
                    key={a}
                    className={`group/agent flex items-center justify-between rounded-xl border px-3 py-2.5 transition-all duration-500 ${active
                        ? "bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                        : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg transition-colors duration-500 ${active ? "bg-primary/20" : "bg-white/5 group-hover/agent:bg-white/10"}`}>
                        <Icon className={`h-3 w-3 transition-colors duration-500 ${active ? color : "text-muted-foreground group-hover/agent:text-foreground/70"}`} />
                      </div>
                      <span className={`font-mono text-[10px] font-semibold tracking-[0.12em] transition-colors duration-500 ${active ? "text-foreground drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]" : "text-muted-foreground"}`}>
                        {a.toUpperCase()}
                      </span>
                    </div>
                    <div className="relative flex items-center justify-center h-1.5 w-1.5">
                      {active && <span className="absolute inset-0 rounded-full animate-ping bg-primary opacity-75" />}
                      <span
                        className={`relative h-1.5 w-1.5 rounded-full transition-all duration-500 ${active ? "bg-primary shadow-[0_0_8px_rgba(6,182,212,0.8)]" : "bg-white/10"}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex-1 flex flex-col min-h-0 relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground/60" />
                <span className="eyebrow !mb-0">chat history</span>
              </div>
              <button
                onClick={() => onNewChat?.()}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
                title="New Chat"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 -mr-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
              {sessions.map((session) => (
                <div key={session.id} className="group/chat relative flex items-center">
                  {editingChatId === session.id ? (
                    <div className="w-full flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2.5">
                      <input
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => {
                          if (editTitle.trim() && editTitle !== session.title) {
                            onRenameChat?.(session.id, editTitle.trim());
                          }
                          setEditingChatId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (editTitle.trim() && editTitle !== session.title) {
                              onRenameChat?.(session.id, editTitle.trim());
                            }
                            setEditingChatId(null);
                          } else if (e.key === 'Escape') {
                            setEditingChatId(null);
                          }
                        }}
                        className="w-full bg-transparent text-[11px] font-medium text-foreground outline-none"
                      />
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => onSelectChat?.(session.id)}
                        className="w-full text-left flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-[11px] text-muted-foreground hover:bg-white/5 hover:border-white/5 hover:text-foreground hover:shadow-sm transition-all duration-300"
                      >
                        <div className="h-6 w-6 shrink-0 rounded-full bg-white/5 flex items-center justify-center group-hover/chat:bg-primary/20 group-hover/chat:text-primary transition-colors duration-300">
                          <MessageSquare className="h-3 w-3" />
                        </div>
                        <span className="truncate font-medium flex-1 pr-14">{session.title || "New Chat"}</span>
                      </button>
                      <div className="absolute right-2 flex items-center gap-0.5 opacity-0 group-hover/chat:opacity-100 transition-all duration-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditTitle(session.title || "New Chat");
                            setEditingChatId(session.id);
                          }}
                          className="p-1.5 rounded-md text-muted-foreground/50 hover:bg-white/10 hover:text-foreground transition-all"
                          title="Rename Chat"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setChatToDelete(session.id);
                          }}
                          className="p-1.5 rounded-md text-muted-foreground/50 hover:bg-red-500/20 hover:text-red-400 transition-all"
                          title="Delete Chat"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {sessions.length === 0 && (
                <div className="flex flex-col items-center justify-center h-24 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                  <MessageSquare className="h-4 w-4 text-muted-foreground/30 mb-2" />
                  <p className="text-[10px] font-medium text-muted-foreground/60">No recent chats</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {chatToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Delete Chat?</h3>
              <p className="mb-6 text-sm text-muted-foreground text-balance">
                Are you sure you want to delete this conversation? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setChatToDelete(null)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDeleteChat?.(chatToDelete);
                    setChatToDelete(null);
                  }}
                  className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-medium text-white shadow-lg shadow-red-500/20 transition-all hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
