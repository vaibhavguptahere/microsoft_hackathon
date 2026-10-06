"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Mail, Lock, ShieldCheck, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { MagneticButton } from "../../components/nexus/MagneticButton";
import { createClient } from "@/utils/supabase/client";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("employee");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              role,
            },
          },
        });
        if (error) throw error;
      }

      router.push("/assistant");
      router.refresh();
    } catch (err: any) {
      let errorMessage = err.message || "An error occurred";
      if (errorMessage === "Invalid login credentials" && isLogin) {
        errorMessage = "User ID not found. Please sign up to continue.";
      }
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] selection:bg-cyan-500/30">
      {/* Dynamic Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 grid-bg opacity-[0.15]" />
        
        {/* Animated Mesh Gradients */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -left-[20%] -top-[20%] h-[70vw] w-[70vw] rounded-full bg-cyan-600/20 blur-[150px] transform-gpu will-change-transform"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            rotate: [0, -90, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -right-[20%] -bottom-[20%] h-[60vw] w-[60vw] rounded-full bg-blue-600/20 blur-[150px] transform-gpu will-change-transform"
        />
        <div className="absolute inset-0 bg-[#020617]/50 backdrop-blur-3xl" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex w-full max-w-[1200px] flex-col items-center justify-center p-6 lg:flex-row lg:justify-between lg:p-12">
        
        {/* Left Side: Brand Narrative */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12 flex w-full flex-col lg:mb-0 lg:w-5/12"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <Sparkles className="h-5 w-5 text-cyan-400" />
            </div>
            <span className="font-display text-2xl font-black tracking-widest text-white">BEACON</span>
          </div>
          
          <h1 className="mt-12 font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-white">
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-500">Access your</span>
            <span className="block">Enterprise Brain.</span>
          </h1>
          
          <p className="mt-6 max-w-md text-lg text-neutral-400 leading-relaxed font-sans">
            Connect your workplace. Route complex intents across HR, IT, and Finance with absolute explainability.
          </p>

          <div className="mt-12 flex items-center gap-4 text-sm font-mono text-neutral-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan-500" />
              <span>Enterprise Grade</span>
            </div>
            <div className="h-1 w-1 rounded-full bg-neutral-700" />
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-cyan-500" />
              <span>SOC2 Compliant</span>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Auth Form */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[440px] lg:w-1/2"
        >
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02] p-8 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
            {/* Inner subtle glow */}
            <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-cyan-500/20 blur-[60px]" />
            
            <div className="relative z-10 flex flex-col">
              {/* Form Toggle */}
              <div className="mb-8 flex rounded-full border border-white/5 bg-black/20 p-1 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className={`relative flex-1 rounded-full py-2 text-sm font-medium transition-colors ${isLogin ? 'text-white' : 'text-neutral-500 hover:text-white'}`}
                >
                  {isLogin && (
                    <motion.div layoutId="auth-pill" className="absolute inset-0 rounded-full border border-white/10 bg-white/10 shadow-sm" />
                  )}
                  <span className="relative z-10">Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className={`relative flex-1 rounded-full py-2 text-sm font-medium transition-colors ${!isLogin ? 'text-white' : 'text-neutral-500 hover:text-white'}`}
                >
                  {!isLogin && (
                    <motion.div layoutId="auth-pill" className="absolute inset-0 rounded-full border border-white/10 bg-white/10 shadow-sm" />
                  )}
                  <span className="relative z-10">Create Account</span>
                </button>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {isLogin ? "Welcome back" : "Start your journey"}
                </h2>
                <p className="mt-2 text-sm text-neutral-400">
                  {isLogin ? "Enter your credentials to access your workspace." : "Join the next generation of enterprise AI."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && (
                  <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
                    {error}
                  </div>
                )}
                <AnimatePresence mode="popLayout">
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, scale: 0.95 }}
                      animate={{ opacity: 1, height: "auto", scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col gap-4"
                    >
                      <div className="group relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500 transition-colors group-focus-within:text-cyan-400" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Full Name"
                          className="w-full rounded-2xl border border-white/10 bg-black/20 py-4 pl-12 pr-4 text-sm text-white placeholder-neutral-500 outline-none transition-all focus:border-cyan-500/50 focus:bg-cyan-500/5 focus:ring-4 focus:ring-cyan-500/10"
                        />
                      </div>
                      <div className="flex rounded-full border border-white/5 bg-black/20 p-1 backdrop-blur-md">
                        <button
                          type="button"
                          onClick={() => setRole("employee")}
                          className={`relative flex-1 rounded-full py-2 text-sm font-medium transition-colors ${role === 'employee' ? 'text-white' : 'text-neutral-500 hover:text-white'}`}
                        >
                          {role === "employee" && (
                            <motion.div layoutId="role-pill" className="absolute inset-0 rounded-full border border-white/10 bg-white/10 shadow-sm" />
                          )}
                          <span className="relative z-10">Employee</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRole("manager")}
                          className={`relative flex-1 rounded-full py-2 text-sm font-medium transition-colors ${role === 'manager' ? 'text-white' : 'text-neutral-500 hover:text-white'}`}
                        >
                          {role === "manager" && (
                            <motion.div layoutId="role-pill" className="absolute inset-0 rounded-full border border-white/10 bg-white/10 shadow-sm" />
                          )}
                          <span className="relative z-10">Manager</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="group relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500 transition-colors group-focus-within:text-cyan-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Work Email"
                    className="w-full rounded-2xl border border-white/10 bg-black/20 py-4 pl-12 pr-4 text-sm text-white placeholder-neutral-500 outline-none transition-all focus:border-cyan-500/50 focus:bg-cyan-500/5 focus:ring-4 focus:ring-cyan-500/10"
                  />
                </div>

                <div className="group relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500 transition-colors group-focus-within:text-cyan-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full rounded-2xl border border-white/10 bg-black/20 py-4 pl-12 pr-4 text-sm text-white placeholder-neutral-500 outline-none transition-all focus:border-cyan-500/50 focus:bg-cyan-500/5 focus:ring-4 focus:ring-cyan-500/10"
                  />
                </div>

                {isLogin && (
                  <div className="flex justify-end mt-2">
                    <button type="button" className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative mt-4 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-white px-8 py-4 font-semibold text-black transition-transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                    ) : (
                      <>
                        {isLogin ? "Sign In" : "Create Account"}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                  {/* Subtle hover glow inside the button */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
