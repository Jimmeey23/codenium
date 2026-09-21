"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { LandingConfig, LandingTheme } from "@/lib/types";

const THEMES: Record<LandingTheme, { bg: string; card: string; text: string; sub: string; primary: string; ghost: string }> = {
  aurora: {
    bg: "bg-[radial-gradient(70rem_50rem_at_20%_-10%,#7c3aed55,transparent_60%),radial-gradient(60rem_40rem_at_100%_10%,#22d3ee44,transparent_55%),linear-gradient(180deg,#0a0818,#05040f)]",
    card: "glass-strong",
    text: "text-white",
    sub: "text-white/60",
    primary: "btn-primary text-white",
    ghost: "border border-white/15 bg-white/5 text-white hover:bg-white/10",
  },
  midnight: {
    bg: "bg-[linear-gradient(180deg,#020617,#0f172a_55%,#020617)]",
    card: "border border-white/10 bg-slate-900/70 backdrop-blur-xl",
    text: "text-slate-50",
    sub: "text-slate-400",
    primary: "bg-slate-100 text-slate-900 hover:bg-white",
    ghost: "border border-slate-700 bg-slate-800/60 text-slate-100 hover:bg-slate-800",
  },
  sunset: {
    bg: "bg-[radial-gradient(60rem_40rem_at_10%_0%,#fb923c66,transparent_60%),linear-gradient(160deg,#4c0519,#831843_50%,#1e1b4b)]",
    card: "border border-white/15 bg-white/10 backdrop-blur-xl",
    text: "text-orange-50",
    sub: "text-orange-100/70",
    primary: "bg-gradient-to-r from-orange-400 to-rose-500 text-white",
    ghost: "border border-orange-200/30 bg-white/10 text-orange-50 hover:bg-white/20",
  },
  emerald: {
    bg: "bg-[radial-gradient(60rem_40rem_at_80%_0%,#10b98155,transparent_60%),linear-gradient(170deg,#022c22,#064e3b_60%,#021410)]",
    card: "border border-emerald-300/15 bg-emerald-950/50 backdrop-blur-xl",
    text: "text-emerald-50",
    sub: "text-emerald-200/65",
    primary: "bg-gradient-to-r from-emerald-400 to-teal-400 text-emerald-950",
    ghost: "border border-emerald-300/25 bg-emerald-900/40 text-emerald-50 hover:bg-emerald-900/70",
  },
  mono: {
    bg: "bg-[linear-gradient(180deg,#f8fafc,#e2e8f0)]",
    card: "border border-slate-900/10 bg-white shadow-xl",
    text: "text-slate-900",
    sub: "text-slate-500",
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    ghost: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-100",
  },
};

export function Landing({
  config,
  target,
  slug,
}: {
  config: LandingConfig;
  target: string;
  slug: string;
}) {
  const theme = THEMES[config.theme] ?? THEMES.aurora;
  return (
    <main className={`relative min-h-screen ${theme.bg} px-5 py-14`}>
      <div className="grid-overlay pointer-events-none absolute inset-0" />
      <div className="relative mx-auto w-full max-w-md">
        <div className={`animate-fade-up rounded-3xl p-7 ${theme.card}`}>
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <span className="animate-ring absolute inset-0 rounded-2xl bg-violet-400/40" />
              <Image
                src={config.avatarUrl || "/brand/logo.png"}
                alt=""
                width={88}
                height={88}
                className="relative h-20 w-20 rounded-2xl object-cover shadow-lg ring-1 ring-white/20"
                unoptimized
              />
            </div>
            <h1 className={`mt-5 text-2xl font-bold tracking-tight ${theme.text}`}>
              {config.headline}
            </h1>
            {config.subheadline ? (
              <p className={`mt-1 text-sm font-medium ${theme.sub}`}>{config.subheadline}</p>
            ) : null}
            {config.body ? (
              <p className={`mt-4 text-sm leading-relaxed ${theme.sub}`}>{config.body}</p>
            ) : null}
          </div>

          <div className="mt-7 space-y-3">
            {config.buttons
              .filter((b) => b.label && b.url)
              .map((b) => (
                <a
                  key={b.id}
                  href={b.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold transition active:scale-[0.98] ${
                    b.style === "primary" ? theme.primary : theme.ghost
                  }`}
                >
                  {b.icon ? <span>{b.icon}</span> : null}
                  {b.label}
                </a>
              ))}
          </div>

          {config.autoRedirectSeconds && target ? (
            <AutoRedirect seconds={config.autoRedirectSeconds} url={target} themeSub={theme.sub} />
          ) : null}
        </div>

        {config.showBranding ? (
          <p className="mt-6 text-center text-xs text-white/35">
            Powered by <span className="font-semibold text-white/60">Prism QR</span> · /r/{slug}
          </p>
        ) : null}
      </div>
    </main>
  );
}

function AutoRedirect({
  seconds,
  url,
  themeSub,
}: {
  seconds: number;
  url: string;
  themeSub: string;
}) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) {
      window.location.href = url;
      return;
    }
    const t = window.setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left, url]);

  return (
    <p className={`mt-6 text-center text-xs ${themeSub}`}>
      Redirecting in <span className="font-bold tabular-nums">{left}</span>s ·{" "}
      <a href={url} className="underline underline-offset-2">
        go now
      </a>
    </p>
  );
}

export function UnlockScreen({ slug, name }: { slug: string; name: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/r/${slug}/unlock`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else setError("That password doesn't match. Try again.");
  }

  return (
    <Shell icon="🔒" title="Protected code" subtitle={name}>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          className="w-full rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-center text-sm text-white outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/25"
        />
        {error ? <p className="text-center text-xs text-rose-300">{error}</p> : null}
        <button
          type="submit"
          disabled={busy || !password}
          className="btn-primary w-full rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Checking…" : "Unlock"}
        </button>
      </form>
    </Shell>
  );
}

export function StatusScreen({
  icon,
  title,
  subtitle,
  detail,
}: {
  icon: string;
  title: string;
  subtitle: string;
  detail?: string;
}) {
  return (
    <Shell icon={icon} title={title} subtitle={subtitle}>
      {detail ? <p className="mt-4 text-center text-xs text-white/40">{detail}</p> : null}
      <a
        href="/"
        className="mt-6 block rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white/80 transition hover:bg-white/10"
      >
        Create your own QR code
      </a>
    </Shell>
  );
}

function Shell({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-5 py-16">
      <div className="grid-overlay pointer-events-none absolute inset-0" />
      <div className="glass-strong animate-fade-up relative w-full max-w-sm rounded-3xl p-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-3xl ring-1 ring-white/10">
            {icon}
          </div>
          <h1 className="mt-5 text-xl font-bold text-white">{title}</h1>
          <p className="mt-1 text-sm text-white/50">{subtitle}</p>
        </div>
        {children}
      </div>
    </main>
  );
}
