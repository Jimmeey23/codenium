"use client";

import type { ChangeEvent, ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
        {children}
      </span>
      {hint ? <span className="text-[11px] text-white/35">{hint}</span> : null}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label ? <Label hint={hint}>{label}</Label> : null}
      {children}
    </div>
  );
}

const inputBase =
  "w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none transition focus:border-cyan-400/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-cyan-400/20";

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      className={cx(inputBase, disabled && "opacity-40", className)}
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cx(inputBase, "resize-y leading-relaxed")}
    />
  );
}

export function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={cx(inputBase, "appearance-none pr-9")}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#0b0b0b] text-white">
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
        ▾
      </span>
    </div>
  );
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  suffix,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 flex-1 cursor-pointer"
      />
      <span className="w-14 shrink-0 rounded-lg bg-white/5 px-2 py-1 text-center text-[11px] font-medium tabular-nums text-white/70">
        {value}
        {suffix ?? ""}
      </span>
    </div>
  );
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-black/40 px-2.5 py-2 transition hover:border-cyan-400/40">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-7 rounded-lg"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11px] uppercase tracking-wide text-white/45">
          {label}
        </span>
        <span className="block font-mono text-[11px] text-white/80">{value}</span>
      </span>
    </label>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-left transition hover:border-cyan-400/40 hover:bg-white/[0.05]"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-white/90">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-snug text-white/45">{description}</span>
        ) : null}
      </span>
      <span
        className={cx(
          "relative h-6 w-11 shrink-0 rounded-full transition",
          checked ? "bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_14px_rgba(0,229,255,0.45)]" : "bg-white/12",
        )}
      >
        <span
          className={cx(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
            checked ? "left-[22px]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: string }[];
  size?: "sm" | "md";
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-black/40 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cx(
            "flex-1 rounded-lg text-center font-medium transition",
            size === "sm" ? "px-2 py-1.5 text-[11px]" : "px-3 py-2 text-xs",
            value === o.value
              ? "bg-white/[0.07] text-white ring-1 ring-cyan-400/50 shadow-[0_0_16px_-4px_rgba(0,229,255,0.5)]"
              : "text-white/55 hover:bg-white/5 hover:text-white/85",
          )}
        >
          {o.icon ? <span className="mr-1">{o.icon}</span> : null}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b]/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white/90">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-white/45">{subtitle}</p> : null}
        </div>
        {action}
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
        className ?? "bg-white/8 text-white/70 ring-white/15",
      )}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  onClick,
  variant = "ghost",
  className,
  disabled,
  type = "button",
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "subtle" | "danger";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
  title?: string;
}) {
  const styles: Record<string, string> = {
    primary: "btn-primary",
    ghost:
      "border border-white/12 bg-white/[0.03] text-white/80 hover:border-cyan-400/40 hover:bg-white/[0.07] hover:text-white",
    subtle: "bg-white/[0.05] text-white/70 hover:bg-white/[0.1]",
    danger: "border border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20",
  };
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45",
        styles[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}
