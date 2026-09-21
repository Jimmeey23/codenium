"use client";

import { useEffect, useRef, useState } from "react";

export function UserMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = email.charAt(0).toUpperCase();

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative ml-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-sm font-black text-black ring-1 ring-white/15 transition hover:brightness-110"
      >
        {initial}
      </button>

      {open ? (
        <div className="animate-fade-up absolute right-0 mt-2 w-60 rounded-2xl border border-white/10 bg-[#0a0a0a]/95 p-2 shadow-2xl backdrop-blur-xl">
          <p className="truncate px-3 py-2 text-xs text-white/45">{email}</p>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-white/75 transition hover:bg-white/[0.07] hover:text-white"
            >
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
