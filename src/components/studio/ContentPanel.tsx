"use client";

import { CONTENT_TYPES } from "@/lib/qr-content";
import type { ContentType } from "@/lib/types";
import { Field, Panel, Select, TextArea, TextInput, Toggle, cx } from "../ui";
import type { StudioState } from "./state";

export function ContentPanel({
  state,
  patch,
  setType,
}: {
  state: StudioState;
  patch: (p: Partial<StudioState>) => void;
  setType: (t: ContentType) => void;
}) {
  const active = CONTENT_TYPES.find((t) => t.id === state.contentType) ?? CONTENT_TYPES[0];

  return (
    <div className="space-y-4">
      <Panel title="Code name" subtitle="Only you see this — it labels the code in your dashboard.">
        <TextInput value={state.name} onChange={(v) => patch({ name: v })} placeholder="Summer campaign" />
      </Panel>

      <Panel title="Content type" subtitle={active.hint}>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {CONTENT_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id)}
              className={cx(
                "group flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-[11px] font-medium transition",
                state.contentType === t.id
                  ? "border-violet-400/50 bg-violet-500/15 text-white shadow-lg shadow-violet-900/30"
                  : "border-white/8 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white",
              )}
            >
              <span className="text-lg transition group-hover:scale-110">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </Panel>

      <Panel title={`${active.label} details`}>
        <div className="grid grid-cols-2 gap-3">
          {active.fields.map((f) => (
            <Field
              key={f.key}
              label={f.label}
              className={f.half ? "col-span-1" : "col-span-2"}
            >
              {f.type === "textarea" ? (
                <TextArea
                  value={state.content[f.key] ?? ""}
                  onChange={(v) => patch({ content: { ...state.content, [f.key]: v } })}
                  placeholder={f.placeholder}
                />
              ) : f.type === "select" ? (
                <Select
                  value={state.content[f.key] ?? f.options?.[0]?.value ?? ""}
                  onChange={(v) => patch({ content: { ...state.content, [f.key]: v } })}
                  options={f.options ?? []}
                />
              ) : (
                <TextInput
                  type={f.type ?? "text"}
                  value={state.content[f.key] ?? ""}
                  onChange={(v) => patch({ content: { ...state.content, [f.key]: v } })}
                  placeholder={f.placeholder}
                />
              )}
            </Field>
          ))}
        </div>
      </Panel>

      <Panel
        title="Link behaviour"
        subtitle="Dynamic codes route through a short link so you can edit or expire them later."
      >
        <Toggle
          checked={state.dynamic}
          onChange={(v) => patch({ dynamic: v })}
          label={state.dynamic ? "Dynamic short link" : "Static code"}
          description={
            state.dynamic
              ? "Editable destination, scan analytics, expiry, password and device routing."
              : "Content is burned into the pixels forever. No tracking, no expiry."
          }
        />
      </Panel>
    </div>
  );
}
