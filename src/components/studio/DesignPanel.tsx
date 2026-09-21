"use client";

import { useRef } from "react";
import {
  DEFAULT_LOGO,
  STYLE_PRESETS,
  type CornerDotType,
  type CornerSquareType,
  type DesignConfig,
  type DotType,
  type Ecc,
  type EyeBallStyle,
  type EyeFrameStyle,
} from "@/lib/types";
import { Button, ColorField, Field, Panel, Segmented, Select, Slider, TextInput, Toggle, cx } from "../ui";

type Patch = (p: Partial<DesignConfig>) => void;

export function DesignPanel({ design, patch }: { design: DesignConfig; patch: Patch }) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const onLogoFile = (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => patch({ logoSrc: String(reader.result), logoEnabled: true });
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <Panel title="Engine" subtitle="Flat vector for print, isometric 3D for hero art.">
        <Segmented
          value={design.engine}
          onChange={(v) => patch({ engine: v })}
          options={[
            { value: "flat", label: "Flat vector", icon: "▦" },
            { value: "iso3d", label: "3D isometric", icon: "🧊" },
          ]}
        />
      </Panel>

      <Panel title="Style presets">
        <div className="grid grid-cols-3 gap-2">
          {STYLE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => patch(p.design)}
              className="group rounded-xl border border-white/8 bg-white/[0.03] p-2 text-left transition hover:border-white/25"
            >
              <span
                className="block h-9 w-full rounded-lg ring-1 ring-white/10 transition group-hover:scale-[1.03]"
                style={{ background: `linear-gradient(120deg, ${p.swatch[0]}, ${p.swatch[1]})` }}
              />
              <span className="mt-1.5 block text-[11px] font-medium text-white/65">{p.name}</span>
            </button>
          ))}
        </div>
      </Panel>

      {design.engine === "flat" ? (
        <Panel title="Modules & eyes">
          <Field label="Dot style">
            <Select<DotType>
              value={design.dotType}
              onChange={(v) => patch({ dotType: v })}
              options={[
                { value: "square", label: "Square" },
                { value: "dots", label: "Dots" },
                { value: "rounded", label: "Rounded" },
                { value: "extra-rounded", label: "Extra rounded" },
                { value: "classy", label: "Classy" },
                { value: "classy-rounded", label: "Classy rounded" },
              ]}
            />
          </Field>
          <Field label="Eye frame shape" hint="Custom vector eyes">
            <Select<EyeFrameStyle>
              value={design.eyeFrameStyle}
              onChange={(v) => patch({ eyeFrameStyle: v })}
              options={[
                { value: "auto", label: "Auto (library)" },
                { value: "square", label: "Square" },
                { value: "rounded", label: "Rounded" },
                { value: "circle", label: "Circle" },
                { value: "leaf", label: "Leaf" },
                { value: "leaf-flip", label: "Leaf flipped" },
                { value: "shield", label: "Shield" },
                { value: "cut", label: "Cut corner" },
                { value: "diamond", label: "Diamond" },
                { value: "bars", label: "Bars" },
                { value: "dotted", label: "Dotted" },
              ]}
            />
          </Field>
          {design.eyeFrameStyle === "auto" ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Eye frame">
                <Select<CornerSquareType>
                  value={design.cornerSquareType}
                  onChange={(v) => patch({ cornerSquareType: v })}
                  options={[
                    { value: "square", label: "Square" },
                    { value: "dot", label: "Dot" },
                    { value: "extra-rounded", label: "Rounded" },
                  ]}
                />
              </Field>
              <Field label="Eye ball">
                <Select<CornerDotType>
                  value={design.cornerDotType}
                  onChange={(v) => patch({ cornerDotType: v })}
                  options={[
                    { value: "square", label: "Square" },
                    { value: "dot", label: "Dot" },
                  ]}
                />
              </Field>
            </div>
          ) : (
            <Field label="Eye ball shape">
              <Select<EyeBallStyle>
                value={design.eyeBallStyle}
                onChange={(v) => patch({ eyeBallStyle: v })}
                options={[
                  { value: "rounded", label: "Rounded" },
                  { value: "square", label: "Square" },
                  { value: "dot", label: "Dot" },
                  { value: "leaf", label: "Leaf" },
                  { value: "leaf-flip", label: "Leaf flipped" },
                  { value: "diamond", label: "Diamond" },
                  { value: "cut", label: "Cut corner" },
                ]}
              />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-2">
            <ColorField
              label="Eye frame"
              value={design.cornerSquareColor}
              onChange={(v) => patch({ cornerSquareColor: v })}
            />
            <ColorField
              label="Eye ball"
              value={design.cornerDotColor}
              onChange={(v) => patch({ cornerDotColor: v })}
            />
          </div>
          {design.eyeFrameStyle !== "auto" ? (
            <>
              <Toggle
                checked={design.eyeTwoTone}
                onChange={(v) => patch({ eyeTwoTone: v })}
                label="Two-tone eyes"
                description="Top-right and bottom-left frames take the accent colour."
              />
              {design.eyeTwoTone ? (
                <ColorField
                  label="Side eye accent"
                  value={design.eyeAccentColor}
                  onChange={(v) => patch({ eyeAccentColor: v })}
                />
              ) : null}
            </>
          ) : null}
        </Panel>
      ) : null}

      {design.engine === "flat" ? (
        <Panel title="Foreground">
          <Toggle
            checked={design.dotGradient.enabled}
            onChange={(v) => patch({ dotGradient: { ...design.dotGradient, enabled: v } })}
            label="Gradient fill"
            description="Blend two colours across the modules."
          />
          {design.dotGradient.enabled ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <ColorField
                  label="From"
                  value={design.dotGradient.from}
                  onChange={(v) => patch({ dotGradient: { ...design.dotGradient, from: v } })}
                />
                <ColorField
                  label="To"
                  value={design.dotGradient.to}
                  onChange={(v) => patch({ dotGradient: { ...design.dotGradient, to: v } })}
                />
              </div>
              <Field label="Gradient type">
                <Segmented
                  size="sm"
                  value={design.dotGradient.type}
                  onChange={(v) => patch({ dotGradient: { ...design.dotGradient, type: v } })}
                  options={[
                    { value: "linear", label: "Linear" },
                    { value: "radial", label: "Radial" },
                  ]}
                />
              </Field>
              <Field label="Rotation">
                <Slider
                  value={design.dotGradient.rotation}
                  min={0}
                  max={360}
                  onChange={(v) => patch({ dotGradient: { ...design.dotGradient, rotation: v } })}
                  suffix="°"
                />
              </Field>
            </>
          ) : (
            <ColorField label="Module colour" value={design.dotColor} onChange={(v) => patch({ dotColor: v })} />
          )}
        </Panel>
      ) : null}

      <Panel title="Background">
        <Toggle
          checked={design.bgTransparent}
          onChange={(v) => patch({ bgTransparent: v })}
          label="Transparent"
          description="Perfect for overlaying on artwork (PNG / WEBP / SVG)."
        />
        {!design.bgTransparent ? (
          <>
            <Toggle
              checked={design.bgGradient.enabled}
              onChange={(v) => patch({ bgGradient: { ...design.bgGradient, enabled: v } })}
              label="Gradient background"
            />
            {design.bgGradient.enabled ? (
              <div className="grid grid-cols-2 gap-2">
                <ColorField
                  label="From"
                  value={design.bgGradient.from}
                  onChange={(v) => patch({ bgGradient: { ...design.bgGradient, from: v } })}
                />
                <ColorField
                  label="To"
                  value={design.bgGradient.to}
                  onChange={(v) => patch({ bgGradient: { ...design.bgGradient, to: v } })}
                />
              </div>
            ) : (
              <ColorField label="Colour" value={design.bgColor} onChange={(v) => patch({ bgColor: v })} />
            )}
          </>
        ) : null}
      </Panel>

      <Panel title="Centre logo" subtitle="Your brand mark is applied to every code by default.">
        <Toggle
          checked={design.logoEnabled}
          onChange={(v) => patch({ logoEnabled: v })}
          label="Show logo"
          description="Error correction level H keeps it scannable."
        />
        {design.logoEnabled ? (
          <>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={design.logoSrc || DEFAULT_LOGO}
                alt="logo"
                className="h-12 w-12 rounded-lg object-cover ring-1 ring-white/15"
              />
              <div className="flex flex-1 flex-wrap gap-2">
                <Button variant="subtle" className="px-3 py-1.5 text-xs" onClick={() => fileRef.current?.click()}>
                  Upload
                </Button>
                <Button
                  variant="subtle"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => patch({ logoSrc: DEFAULT_LOGO })}
                >
                  Brand default
                </Button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onLogoFile(e.target.files?.[0])}
              />
            </div>
            <Field label="Logo size">
              <Slider
                value={Math.round(design.logoSize * 100)}
                min={12}
                max={40}
                onChange={(v) => patch({ logoSize: v / 100 })}
                suffix="%"
              />
            </Field>
            {design.engine === "flat" ? (
              <>
                <Field label="Logo padding">
                  <Slider
                    value={design.logoMargin}
                    min={0}
                    max={30}
                    onChange={(v) => patch({ logoMargin: v })}
                    suffix="px"
                  />
                </Field>
                <Toggle
                  checked={design.logoHideDots}
                  onChange={(v) => patch({ logoHideDots: v })}
                  label="Clear modules behind logo"
                />
              </>
            ) : null}
          </>
        ) : null}
      </Panel>

      {design.engine === "iso3d" ? <IsoSection design={design} patch={patch} /> : null}

      <Panel title="Frame & call to action">
        <Toggle
          checked={design.frame.enabled}
          onChange={(v) => patch({ frame: { ...design.frame, enabled: v } })}
          label="Add frame"
          description="Frames lift scan rates — a caption tells people what to do."
        />
        {design.frame.enabled ? (
          <>
            <Segmented
              size="sm"
              value={design.frame.style}
              onChange={(v) => patch({ frame: { ...design.frame, style: v } })}
              options={[
                { value: "pill", label: "Pill" },
                { value: "ribbon", label: "Ribbon" },
                { value: "badge", label: "Badge (top)" },
              ]}
            />
            <TextInput
              value={design.frame.text}
              onChange={(v) => patch({ frame: { ...design.frame, text: v } })}
              placeholder="SCAN ME"
            />
            <div className="grid grid-cols-2 gap-2">
              <ColorField
                label="Frame"
                value={design.frame.bg}
                onChange={(v) => patch({ frame: { ...design.frame, bg: v } })}
              />
              <ColorField
                label="Caption"
                value={design.frame.textColor}
                onChange={(v) => patch({ frame: { ...design.frame, textColor: v } })}
              />
            </div>
          </>
        ) : null}
      </Panel>

      <Panel title="Output & resilience">
        <Field label="Export size" hint="px">
          <Slider value={design.size} min={300} max={2400} step={20} onChange={(v) => patch({ size: v })} />
        </Field>
        <Field label="Quiet zone" hint="px">
          <Slider value={design.margin} min={0} max={96} onChange={(v) => patch({ margin: v })} />
        </Field>
        <Field label="Error correction" hint="higher = more damage tolerance">
          <Segmented<Ecc>
            size="sm"
            value={design.ecc}
            onChange={(v) => patch({ ecc: v })}
            options={[
              { value: "L", label: "L · 7%" },
              { value: "M", label: "M · 15%" },
              { value: "Q", label: "Q · 25%" },
              { value: "H", label: "H · 30%" },
            ]}
          />
        </Field>
        {design.logoEnabled && design.ecc !== "H" ? (
          <p className="rounded-lg bg-amber-400/10 px-3 py-2 text-[11px] text-amber-200/90 ring-1 ring-amber-400/20">
            Tip: with a centre logo, level <strong>H</strong> is strongly recommended.
          </p>
        ) : null}
      </Panel>
    </div>
  );
}

function IsoSection({ design, patch }: { design: DesignConfig; patch: Patch }) {
  const iso = design.iso;
  return (
    <Panel title="3D extrusion" subtitle="Real isometric geometry — exports as pixels or vectors.">
      <div className="grid grid-cols-2 gap-2">
        <ColorField label="Top from" value={iso.topFrom} onChange={(v) => patch({ iso: { ...iso, topFrom: v } })} />
        <ColorField label="Top to" value={iso.topTo} onChange={(v) => patch({ iso: { ...iso, topTo: v } })} />
      </div>
      <Field label="Height profile">
        <Segmented
          size="sm"
          value={iso.heightMode}
          onChange={(v) => patch({ iso: { ...iso, heightMode: v } })}
          options={[
            { value: "uniform", label: "Flat" },
            { value: "radial", label: "Dome" },
            { value: "corners", label: "Bowl" },
            { value: "wave", label: "Wave" },
            { value: "random", label: "City" },
          ]}
        />
      </Field>
      {iso.heightMode !== "uniform" ? (
        <p className="rounded-lg bg-amber-400/10 px-3 py-2 text-[11px] leading-relaxed text-amber-200/90 ring-1 ring-amber-400/20">
          Sculpted profiles are <strong>display art</strong> — varying module heights bends the
          scanner grid. Use <strong>Flat</strong> for a 3D code that still scans.
        </p>
      ) : null}
      <Field label="Extrusion depth">
        <Slider
          value={Math.round(iso.depth * 100)}
          min={15}
          max={220}
          onChange={(v) => patch({ iso: { ...iso, depth: v / 100 } })}
          suffix="%"
        />
      </Field>
      <Field label="Camera tilt">
        <Slider
          value={iso.tilt}
          min={14}
          max={46}
          onChange={(v) => patch({ iso: { ...iso, tilt: v } })}
          suffix="°"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Gradient flow">
          <Select
            value={iso.gradientDir}
            onChange={(v) => patch({ iso: { ...iso, gradientDir: v } })}
            options={[
              { value: "diagonal", label: "Diagonal" },
              { value: "vertical", label: "Vertical" },
              { value: "radial", label: "Radial" },
            ]}
          />
        </Field>
        <Field label="Key light">
          <Select
            value={iso.lightFrom}
            onChange={(v) => patch({ iso: { ...iso, lightFrom: v } })}
            options={[
              { value: "left", label: "From left" },
              { value: "right", label: "From right" },
            ]}
          />
        </Field>
      </div>
      <div className={cx("grid gap-2", iso.floor ? "grid-cols-2" : "grid-cols-1")}>
        <Toggle checked={iso.floor} onChange={(v) => patch({ iso: { ...iso, floor: v } })} label="Base plate" />
        {iso.floor ? (
          <ColorField label="Plate" value={iso.floorColor} onChange={(v) => patch({ iso: { ...iso, floorColor: v } })} />
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Toggle checked={iso.shadow} onChange={(v) => patch({ iso: { ...iso, shadow: v } })} label="Contact shadow" />
        <Toggle checked={iso.glow} onChange={(v) => patch({ iso: { ...iso, glow: v } })} label="Ambient glow" />
      </div>
    </Panel>
  );
}
