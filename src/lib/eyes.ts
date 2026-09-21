import type { DesignConfig, EyeBallStyle, EyeFrameStyle } from "./types";

/**
 * Custom finder-pattern ("eye") renderer.
 *
 * qr-code-styling only ships three eye-frame shapes, so when a custom style is
 * selected we hide its corners and stamp our own vector eyes on top. The geometry
 * mirrors the library's own layout maths (see `drawDots`): the module size is
 * floor(available / count) and the grid is centred in the canvas.
 */

export type EyeGeometry = {
  /** module size in px */
  unit: number;
  /** pixel origin of module (0,0) */
  x0: number;
  y0: number;
  count: number;
};

export function eyeGeometry(size: number, margin: number, count: number): EyeGeometry {
  const available = size - 2 * margin;
  const unit = Math.floor(available / count);
  const x0 = Math.floor((size - count * unit) / 2);
  const y0 = Math.floor((size - count * unit) / 2);
  return { unit, x0, y0, count };
}

const n = (v: number) => Math.round(v * 1000) / 1000;

/** Rounded rectangle path with independent corner radii (tl, tr, br, bl). */
function roundedPath(x: number, y: number, w: number, h: number, r: [number, number, number, number]) {
  const max = Math.min(w, h) / 2;
  const [tl, tr, br, bl] = r.map((v) => Math.max(0, Math.min(v, max))) as [number, number, number, number];
  return [
    `M${n(x + tl)},${n(y)}`,
    `H${n(x + w - tr)}`,
    tr ? `A${n(tr)},${n(tr)} 0 0 1 ${n(x + w)},${n(y + tr)}` : "",
    `V${n(y + h - br)}`,
    br ? `A${n(br)},${n(br)} 0 0 1 ${n(x + w - br)},${n(y + h)}` : "",
    `H${n(x + bl)}`,
    bl ? `A${n(bl)},${n(bl)} 0 0 1 ${n(x)},${n(y + h - bl)}` : "",
    `V${n(y + tl)}`,
    tl ? `A${n(tl)},${n(tl)} 0 0 1 ${n(x + tl)},${n(y)}` : "",
    "Z",
  ]
    .filter(Boolean)
    .join(" ");
}

function chamferPath(x: number, y: number, w: number, h: number, c: number) {
  return [
    `M${n(x + c)},${n(y)}`,
    `L${n(x + w - c)},${n(y)}`,
    `L${n(x + w)},${n(y + c)}`,
    `L${n(x + w)},${n(y + h - c)}`,
    `L${n(x + w - c)},${n(y + h)}`,
    `L${n(x + c)},${n(y + h)}`,
    `L${n(x)},${n(y + h - c)}`,
    `L${n(x)},${n(y + c)}`,
    "Z",
  ].join(" ");
}

type EyeArgs = { x: number; y: number; u: number; color: string };

/** Outer 7x7 frame drawn as a 1-module-thick stroked ring. */
function framePaths({ x, y, u, color }: EyeArgs, style: EyeFrameStyle): string {
  // Stroke centreline sits half a module inside the 7x7 box.
  const sx = x + u / 2;
  const sy = y + u / 2;
  const s = u * 6;
  const stroke = `fill="none" stroke="${color}" stroke-width="${n(u)}" stroke-linejoin="round" stroke-linecap="round"`;
  const cx = x + u * 3.5;
  const cy = y + u * 3.5;

  switch (style) {
    case "square":
      return `<path d="${roundedPath(sx, sy, s, s, [0, 0, 0, 0])}" ${stroke}/>`;
    case "rounded":
      return `<path d="${roundedPath(sx, sy, s, s, [u * 1.6, u * 1.6, u * 1.6, u * 1.6])}" ${stroke}/>`;
    case "circle":
      return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(s / 2)}" ${stroke}/>`;
    case "leaf":
      return `<path d="${roundedPath(sx, sy, s, s, [u * 3, 0, u * 3, 0])}" ${stroke}/>`;
    case "leaf-flip":
      return `<path d="${roundedPath(sx, sy, s, s, [0, u * 3, 0, u * 3])}" ${stroke}/>`;
    case "shield":
      return `<path d="${roundedPath(sx, sy, s, s, [u * 0.6, u * 0.6, u * 3, u * 3])}" ${stroke}/>`;
    case "cut":
      return `<path d="${chamferPath(sx, sy, s, s, u * 1.7)}" ${stroke}/>`;
    case "diamond":
      return `<path d="${roundedPath(-s * 0.36, -s * 0.36, s * 0.72, s * 0.72, [u * 0.5, u * 0.5, u * 0.5, u * 0.5])}" ${stroke} transform="translate(${n(
        cx,
      )},${n(cy)}) rotate(45) scale(1.32)"/>`;
    case "bars": {
      // Four detached bars, corners left open.
      const gap = u * 1.2;
      const len = s - gap;
      const cap = `fill="${color}"`;
      const t = u;
      return [
        `<rect x="${n(x + gap / 2)}" y="${n(y)}" width="${n(len)}" height="${n(t)}" rx="${n(t / 2)}" ${cap}/>`,
        `<rect x="${n(x + gap / 2)}" y="${n(y + u * 6)}" width="${n(len)}" height="${n(t)}" rx="${n(t / 2)}" ${cap}/>`,
        `<rect x="${n(x)}" y="${n(y + gap / 2)}" width="${n(t)}" height="${n(len)}" rx="${n(t / 2)}" ${cap}/>`,
        `<rect x="${n(x + u * 6)}" y="${n(y + gap / 2)}" width="${n(t)}" height="${n(len)}" rx="${n(t / 2)}" ${cap}/>`,
      ].join("");
    }
    case "dotted": {
      const r = u * 0.42;
      const dots: string[] = [];
      for (let i = 0; i < 7; i += 1) {
        const px = x + u * (i + 0.5);
        dots.push(`<circle cx="${n(px)}" cy="${n(y + u * 0.5)}" r="${n(r)}" fill="${color}"/>`);
        dots.push(`<circle cx="${n(px)}" cy="${n(y + u * 6.5)}" r="${n(r)}" fill="${color}"/>`);
      }
      for (let i = 1; i < 6; i += 1) {
        const py = y + u * (i + 0.5);
        dots.push(`<circle cx="${n(x + u * 0.5)}" cy="${n(py)}" r="${n(r)}" fill="${color}"/>`);
        dots.push(`<circle cx="${n(x + u * 6.5)}" cy="${n(py)}" r="${n(r)}" fill="${color}"/>`);
      }
      return dots.join("");
    }
    default:
      return `<path d="${roundedPath(sx, sy, s, s, [u * 1.6, u * 1.6, u * 1.6, u * 1.6])}" ${stroke}/>`;
  }
}

/** Inner 3x3 pupil. */
function ballPaths({ x, y, u, color }: EyeArgs, style: EyeBallStyle): string {
  const bx = x + u * 2;
  const by = y + u * 2;
  const s = u * 3;
  const cx = bx + s / 2;
  const cy = by + s / 2;
  const fill = `fill="${color}"`;

  switch (style) {
    case "square":
      return `<rect x="${n(bx)}" y="${n(by)}" width="${n(s)}" height="${n(s)}" ${fill}/>`;
    case "dot":
      return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(s / 2)}" ${fill}/>`;
    case "rounded":
      return `<path d="${roundedPath(bx, by, s, s, [u, u, u, u])}" ${fill}/>`;
    case "leaf":
      return `<path d="${roundedPath(bx, by, s, s, [s / 2, 0, s / 2, 0])}" ${fill}/>`;
    case "leaf-flip":
      return `<path d="${roundedPath(bx, by, s, s, [0, s / 2, 0, s / 2])}" ${fill}/>`;
    case "diamond":
      return `<rect x="${n(-s * 0.37)}" y="${n(-s * 0.37)}" width="${n(s * 0.74)}" height="${n(
        s * 0.74,
      )}" rx="${n(u * 0.35)}" ${fill} transform="translate(${n(cx)},${n(cy)}) rotate(45)"/>`;
    case "cut":
      return `<path d="${chamferPath(bx, by, s, s, u * 0.9)}" ${fill}/>`;
    default:
      return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(s / 2)}" ${fill}/>`;
  }
}

export function usesCustomEyes(design: DesignConfig): boolean {
  return design.eyeFrameStyle !== "auto";
}

/**
 * SVG markup for the three finder patterns, ready to append inside the QR <svg>.
 * `frameColor` is used for the top-left eye; the two "side" eyes use the accent
 * colour when two-tone eyes are on.
 */
export function eyesSvg(design: DesignConfig, geo: EyeGeometry): string {
  const { unit: u, x0, y0, count } = geo;
  if (u <= 0) return "";
  const last = count - 7;
  const eyes: { x: number; y: number; color: string }[] = [
    { x: x0, y: y0, color: design.cornerSquareColor },
    {
      x: x0 + last * u,
      y: y0,
      color: design.eyeTwoTone ? design.eyeAccentColor : design.cornerSquareColor,
    },
    {
      x: x0,
      y: y0 + last * u,
      color: design.eyeTwoTone ? design.eyeAccentColor : design.cornerSquareColor,
    },
  ];

  return `<g class="qr-eyes">${eyes
    .map((eye) => {
      const args = { x: eye.x, y: eye.y, u, color: eye.color };
      const ball = { ...args, color: design.cornerDotColor };
      return framePaths(args, design.eyeFrameStyle) + ballPaths(ball, design.eyeBallStyle);
    })
    .join("")}</g>`;
}
