"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export function AuthForm({ next, initialError }: { next: string; initialError?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState<null | "email" | "google">(null);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [notice, setNotice] = useState<string | null>(null);

  const switchMode = (value: Mode) => {
    setMode(value);
    setError(null);
    setNotice(null);
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    setNotice(null);
    setPending("email");

    const supabase = createClient();

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      setPending(null);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (data.session) {
        router.replace(next);
        router.refresh();
        return;
      }
      setNotice(`Check ${email} for a confirmation link to finish signing up.`);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setPending(null);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  async function handleGoogle() {
    if (pending) return;
    setError(null);
    setNotice(null);
    setPending("google");
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (oauthError) {
      setPending(null);
      setError(oauthError.message);
    }
  }

  return (
    <div className="auth-card w-full max-w-md rounded-3xl border border-white/10 bg-[#0a0a0a]/80 p-7 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-2xl sm:p-9">
      <Link href="/" className="group mb-7 flex items-center gap-3">
        <span className="relative">
          <span className="absolute -inset-2 animate-ring rounded-2xl bg-cyan-400/25 blur-md" />
          <Image
            src="/brand/logo.png"
            alt="Codenium"
            width={44}
            height={44}
            className="relative h-11 w-11 rounded-2xl bg-black object-contain p-1.5 ring-1 ring-white/12"
            priority
          />
        </span>
        <span>
          <span className="block text-sm font-bold tracking-tight text-white">Codenium</span>
          <span className="block text-[10px] uppercase tracking-[0.2em] text-white/35">
            3D QR Studio
          </span>
        </span>
      </Link>

      <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
        <span className="text-gradient">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </span>
      </h1>
      <p className="mt-2 text-sm text-white/45">
        {mode === "signin"
          ? "Sign in to manage your dynamic codes, routing rules and landing pages."
          : "Start designing branded 3D QR codes that you can re-point at any time."}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-black/40 p-1">
        {(["signin", "signup"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => switchMode(value)}
            className={`rounded-xl px-3 py-2 text-xs font-semibold transition sm:text-sm ${
              mode === value
                ? "bg-white/[0.08] text-white ring-1 ring-cyan-400/40"
                : "text-white/45 hover:text-white"
            }`}
          >
            {value === "signin" ? "Sign in" : "Sign up"}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={pending !== null}
        className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.09] disabled:opacity-50"
      >
        {pending === "google" ? (
          <span className="h-4 w-4 animate-spin-fast rounded-full border-2 border-white/25 border-t-white" />
        ) : (
          <GoogleMark />
        )}
        Continue with Google
      </button>

      <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-white/25">
        <span className="h-px flex-1 bg-white/10" />
        or use email
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none transition focus:border-cyan-400/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-cyan-400/20"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signin" ? "••••••••" : "At least 6 characters"}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 pr-16 text-sm text-white placeholder-white/25 outline-none transition focus:border-cyan-400/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-cyan-400/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-2 my-auto h-7 rounded-lg px-2 text-[11px] font-semibold text-white/45 transition hover:bg-white/10 hover:text-white"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {error ? (
          <p className="animate-shake rounded-xl border border-pink-500/30 bg-pink-500/10 px-3 py-2.5 text-xs text-pink-200">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="animate-fade-up rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2.5 text-xs text-cyan-100">
            {notice}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending !== null}
          className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
        >
          {pending === "email" ? (
            <span className="h-4 w-4 animate-spin-fast rounded-full border-2 border-black/25 border-t-black" />
          ) : null}
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-white/35">
        {mode === "signin" ? "New to Codenium? " : "Already have an account? "}
        <button
          type="button"
          onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
          className="font-semibold text-cyan-300 transition hover:text-cyan-200"
        >
          {mode === "signin" ? "Create an account" : "Sign in instead"}
        </button>
      </p>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C37 40.2 44 35 44 24c0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
