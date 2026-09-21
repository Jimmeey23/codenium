"use client";

import type { LandingButton, LandingTheme } from "@/lib/types";
import { Button, Field, Panel, Segmented, Select, TextArea, TextInput, Toggle, cx } from "../ui";
import { expiryFromMode, fromLocalInput, toLocalInput, type ExpiryMode, type StudioState } from "./state";

const EXPIRY_OPTIONS: { value: ExpiryMode; label: string }[] = [
  { value: "never", label: "No expiry" },
  { value: "1h", label: "1 hour" },
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "custom", label: "Custom" },
];

export function RulesPanel({
  state,
  patch,
}: {
  state: StudioState;
  patch: (p: Partial<StudioState>) => void;
}) {
  if (!state.dynamic) {
    return (
      <Panel title="Advanced controls need a dynamic code">
        <p className="text-sm leading-relaxed text-white/55">
          Static codes bake the content into the pixels, so there is nothing to expire, protect or
          re-route. Switch on <strong className="text-white/80">Dynamic short link</strong> in the
          Content tab to unlock expiry windows, scan limits, passwords, device routing, hosted
          landing pages and live analytics.
        </p>
        <Button variant="primary" onClick={() => patch({ dynamic: true })}>
          Make it dynamic
        </Button>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <Panel
        title="Validity"
        subtitle="Codes never expire unless you say so."
      >
        <Field label="Expires">
          <div className="grid grid-cols-3 gap-2">
            {EXPIRY_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() =>
                  patch({ expiryMode: o.value, expiresAt: expiryFromMode(o.value, state.expiresAt) })
                }
                className={cx(
                  "rounded-xl border px-2 py-2 text-xs font-medium transition",
                  state.expiryMode === o.value
                    ? "border-violet-400/50 bg-violet-500/15 text-white"
                    : "border-white/8 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </Field>

        {state.expiryMode !== "never" ? (
          <Field label="Expiry date & time">
            <TextInput
              type="datetime-local"
              value={toLocalInput(state.expiresAt)}
              onChange={(v) => patch({ expiresAt: fromLocalInput(v), expiryMode: "custom" })}
            />
          </Field>
        ) : (
          <p className="rounded-lg bg-emerald-400/10 px-3 py-2 text-[11px] text-emerald-200/90 ring-1 ring-emerald-400/20">
            ♾️ This code will keep working forever — the default for every Prism code.
          </p>
        )}

        <Field label="Go live at" hint="optional">
          <TextInput
            type="datetime-local"
            value={toLocalInput(state.activeFrom)}
            onChange={(v) => patch({ activeFrom: fromLocalInput(v) })}
          />
        </Field>

        <Field label="Scan limit" hint="blank = unlimited">
          <TextInput
            type="number"
            value={state.maxScans === null ? "" : String(state.maxScans)}
            onChange={(v) => patch({ maxScans: v.trim() === "" ? null : Math.max(1, Number(v)) })}
            placeholder="Unlimited"
          />
        </Field>

        <Toggle
          checked={state.active}
          onChange={(v) => patch({ active: v })}
          label={state.active ? "Active" : "Paused"}
          description="Pause instantly without reprinting anything."
        />

        <Field label="Fallback URL when expired" hint="optional">
          <TextInput
            value={state.expiredUrl}
            onChange={(v) => patch({ expiredUrl: v })}
            placeholder="https://yourbrand.com/campaign-over"
          />
        </Field>
      </Panel>

      <Panel title="Access" subtitle="Optional password gate in front of the destination.">
        <TextInput
          type="password"
          value={state.password}
          onChange={(v) => patch({ password: v })}
          placeholder={state.hasPassword ? "•••••••• (saved) — type to change" : "No password"}
        />
        {state.hasPassword ? (
          <Button variant="subtle" className="px-3 py-1.5 text-xs" onClick={() => patch({ password: "" , hasPassword: false })}>
            Remove password on save
          </Button>
        ) : null}
      </Panel>

      <Panel title="Landing behaviour" subtitle="What happens the instant someone scans.">
        <Segmented
          value={state.mode}
          onChange={(v) => patch({ mode: v })}
          options={[
            { value: "redirect", label: "Direct", icon: "⚡" },
            { value: "landing", label: "Landing page", icon: "🪄" },
            { value: "router", label: "Smart routing", icon: "🧭" },
          ]}
        />

        {state.mode === "redirect" ? (
          <p className="text-xs leading-relaxed text-white/45">
            Scanners are sent straight to your content with a 307 redirect — the fastest possible
            hand-off.
          </p>
        ) : null}

        {state.mode === "router" ? (
          <div className="space-y-3">
            <p className="text-xs leading-relaxed text-white/45">
              Send each platform somewhere different — App Store for iPhone, Play Store for Android,
              a web page for desktop. Empty fields fall back to the main destination.
            </p>
            <Field label="iOS destination">
              <TextInput
                value={state.routing.ios}
                onChange={(v) => patch({ routing: { ...state.routing, ios: v } })}
                placeholder="https://apps.apple.com/…"
              />
            </Field>
            <Field label="Android destination">
              <TextInput
                value={state.routing.android}
                onChange={(v) => patch({ routing: { ...state.routing, android: v } })}
                placeholder="https://play.google.com/…"
              />
            </Field>
            <Field label="Desktop destination">
              <TextInput
                value={state.routing.desktop}
                onChange={(v) => patch({ routing: { ...state.routing, desktop: v } })}
                placeholder="https://yourbrand.com"
              />
            </Field>
          </div>
        ) : null}

        {state.mode === "landing" ? <LandingBuilder state={state} patch={patch} /> : null}
      </Panel>
    </div>
  );
}

function LandingBuilder({
  state,
  patch,
}: {
  state: StudioState;
  patch: (p: Partial<StudioState>) => void;
}) {
  const landing = state.landing;
  const setButtons = (buttons: LandingButton[]) => patch({ landing: { ...landing, buttons } });

  return (
    <div className="space-y-3">
      <Field label="Theme">
        <Select<LandingTheme>
          value={landing.theme}
          onChange={(v) => patch({ landing: { ...landing, theme: v } })}
          options={[
            { value: "aurora", label: "Aurora (violet · cyan)" },
            { value: "midnight", label: "Midnight" },
            { value: "sunset", label: "Sunset" },
            { value: "emerald", label: "Emerald" },
            { value: "mono", label: "Mono light" },
          ]}
        />
      </Field>
      <Field label="Headline">
        <TextInput
          value={landing.headline}
          onChange={(v) => patch({ landing: { ...landing, headline: v } })}
        />
      </Field>
      <Field label="Subheadline">
        <TextInput
          value={landing.subheadline}
          onChange={(v) => patch({ landing: { ...landing, subheadline: v } })}
        />
      </Field>
      <Field label="Body copy">
        <TextArea
          value={landing.body}
          onChange={(v) => patch({ landing: { ...landing, body: v } })}
          rows={3}
        />
      </Field>

      <Field label="Buttons">
        <div className="space-y-2">
          {landing.buttons.map((b, i) => (
            <div key={b.id} className="rounded-xl border border-white/8 bg-white/[0.03] p-2.5">
              <div className="flex gap-2">
                <TextInput
                  value={b.icon}
                  onChange={(v) =>
                    setButtons(landing.buttons.map((x, j) => (i === j ? { ...x, icon: v } : x)))
                  }
                  placeholder="🔗"
                  className="!w-16 text-center"
                />
                <TextInput
                  value={b.label}
                  onChange={(v) =>
                    setButtons(landing.buttons.map((x, j) => (i === j ? { ...x, label: v } : x)))
                  }
                  placeholder="Button label"
                />
              </div>
              <div className="mt-2 flex gap-2">
                <TextInput
                  value={b.url}
                  onChange={(v) =>
                    setButtons(landing.buttons.map((x, j) => (i === j ? { ...x, url: v } : x)))
                  }
                  placeholder="https://…"
                />
                <button
                  type="button"
                  onClick={() =>
                    setButtons(
                      landing.buttons.map((x, j) =>
                        i === j ? { ...x, style: x.style === "primary" ? "ghost" : "primary" } : x,
                      ),
                    )
                  }
                  className="shrink-0 rounded-xl border border-white/10 px-3 text-[11px] text-white/60 hover:bg-white/10"
                >
                  {b.style === "primary" ? "Primary" : "Ghost"}
                </button>
                <button
                  type="button"
                  onClick={() => setButtons(landing.buttons.filter((_, j) => j !== i))}
                  className="shrink-0 rounded-xl border border-rose-400/20 px-3 text-rose-200/80 hover:bg-rose-500/15"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          <Button
            variant="subtle"
            className="w-full py-2 text-xs"
            onClick={() =>
              setButtons([
                ...landing.buttons,
                {
                  id: `b${Date.now()}`,
                  label: "New link",
                  url: "https://",
                  icon: "🔗",
                  style: "ghost",
                },
              ])
            }
          >
            + Add button
          </Button>
        </div>
      </Field>

      <Field label="Auto-redirect after" hint="blank = stay on page">
        <TextInput
          type="number"
          value={landing.autoRedirectSeconds === null ? "" : String(landing.autoRedirectSeconds)}
          onChange={(v) =>
            patch({
              landing: {
                ...landing,
                autoRedirectSeconds: v.trim() === "" ? null : Math.max(1, Number(v)),
              },
            })
          }
          placeholder="Seconds"
        />
      </Field>

      <Toggle
        checked={landing.showBranding}
        onChange={(v) => patch({ landing: { ...landing, showBranding: v } })}
        label="Show Prism badge"
      />
    </div>
  );
}
