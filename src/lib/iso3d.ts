import qrcode from "qrcode-generator";
import type { DesignConfig, Ecc } from "./types";

export type Matrix = { size: number; dark: boolean[][] };

export function buildMatrix(data: string, ecc: Ecc): Matrix {
  const qr = qrcode(0, ecc);
  // "Byte" matches the mode qr-code-styling uses, so the module count of the
  // flat engine and of our custom eye overlay always agree.
  qr.addData(data || " ", "Byte");
  qr.make();
  const size = qr.getModuleCount();
  const dark: boolean[][] = [];
  for (let r = 0; r < size; r += 1) {
    const row: boolean[] = [];
    for (let c = 0; c < size; c += 1) row.push(qr.isDark(r, c));
    dark.push(row);
  }
  return { size, dark };
}

/** Punch a hole in the middle so the brand logo has room to breathe. */
export function clearCenter(matrix: Matrix, fraction: number): Matrix {
  const n = matrix.size;
  const span = Math.max(1, Math.round(n * fraction));
  const start = Math.floor((n - span) / 2);
  const end = start + span;
  const dark = matrix.dark.map((row, r) =>
    row.map((v, c) => (r >= start && r < end && c >= start && c < end ? false : v)),
  );
  return { size: n, dark };
}

/* ---------------------------------- color --------------------------------- */

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const int = parseInt(full || "000000", 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

const clamp = (v: number, min = 0, max = 255) => Math.min(max, Math.max(min, v));

export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bl = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${bl})`;
}

function shadeRgb(color: string, factor: number): string {
  const nums = color.match(/\d+/g);
  if (!nums) return color;
  const [r, g, b] = nums.map(Number);
  if (factor >= 1) {
    const t = factor - 1;
    return `rgb(${clamp(Math.round(r + (255 - r) * t))},${clamp(
      Math.round(g + (255 - g) * t),
    )},${clamp(Math.round(b + (255 - b) * t))})`;
  }
  return `rgb(${clamp(Math.round(r * factor))},${clamp(Math.round(g * factor))},${clamp(
    Math.round(b * factor),
  )})`;
}

/* ---------------------------------- scene --------------------------------- */

export type Face = { pts: number[][]; fill: string };
export type IsoScene = {
  width: number;
  height: number;
  faces: Face[];
  logo: { x: number; y: number; size: number } | null;
  center: { x: number; y: number };
  footprint: { x: number; y: number }[];
};

const COS30 = Math.cos(Math.PI / 6);

function heightFactor(mode: string, x: number, y: number, n: number): number {
  const cx = (n - 1) / 2;
  const d = Math.min(1, Math.hypot(x - cx, y - cx) / (cx * Math.SQRT2 || 1));
  switch (mode) {
    case "uniform":
      return 1;
    case "radial":
      return 0.42 + 0.95 * (1 - d);
    case "corners":
      return 0.42 + 0.95 * d;
    case "wave":
      return 0.5 + 0.55 * ((Math.sin(x * 0.55) + Math.cos(y * 0.55)) / 2 + 1) * 0.5 + 0.2;
    case "random": {
      const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      return 0.4 + (h - Math.floor(h)) * 0.95;
    }
    default:
      return 1;
  }
}

export function buildIsoScene(
  matrix: Matrix,
  iso: DesignConfig["iso"],
  size: number,
  margin: number,
  logoFraction: number | null,
): IsoScene {
  const n = matrix.size;
  const tilt = (Math.min(48, Math.max(12, iso.tilt)) * Math.PI) / 180;
  const sinT = Math.sin(tilt);
  const zScale = Math.max(0.15, iso.depth) * 3.4;

  // Natural (unit = 1 module) bounds.
  const naturalW = 2 * n * COS30;
  const slab = 0.7;
  const naturalH = 2 * n * sinT + zScale * 1.4 + slab;
  const u = (size - margin * 2) / Math.max(naturalW, naturalH);

  const contentW = naturalW * u;
  const contentH = naturalH * u;
  const offsetX = size / 2;
  const offsetY = (size - contentH) / 2 + zScale * 1.4 * u;

  const project = (x: number, y: number, z: number) => [
    offsetX + (x - y) * COS30 * u,
    offsetY + (x + y) * sinT * u - z * u,
  ];

  const faces: Face[] = [];
  const lightLeft = iso.lightFrom === "left";
  const leftShade = lightLeft ? 0.78 : 0.48;
  const rightShade = lightLeft ? 0.5 : 0.8;

  // Base slab.
  if (iso.floor) {
    const topPlate = [
      project(0, 0, 0),
      project(n, 0, 0),
      project(n, n, 0),
      project(0, n, 0),
    ];
    faces.push({ pts: topPlate, fill: shadeRgb(mix(iso.floorColor, iso.floorColor, 0), 1.12) });
    faces.push({
      pts: [project(n, 0, 0), project(n, n, 0), project(n, n, -slab), project(n, 0, -slab)],
      fill: shadeRgb(mix(iso.floorColor, "#000000", 0.15), rightShade),
    });
    faces.push({
      pts: [project(0, n, 0), project(n, n, 0), project(n, n, -slab), project(0, n, -slab)],
      fill: shadeRgb(mix(iso.floorColor, "#000000", 0.15), leftShade),
    });
  }

  const cells: { x: number; y: number }[] = [];
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      if (matrix.dark[r][c]) cells.push({ x: c, y: r });
    }
  }
  cells.sort((a, b) => a.x + a.y - (b.x + b.y));

  for (const cell of cells) {
    const { x, y } = cell;
    const cx = (n - 1) / 2;
    let t: number;
    if (iso.gradientDir === "vertical") t = y / Math.max(1, n - 1);
    else if (iso.gradientDir === "radial")
      t = Math.min(1, Math.hypot(x - cx, y - cx) / (cx * Math.SQRT2 || 1));
    else t = (x + y) / Math.max(1, 2 * (n - 1));

    const base = mix(iso.topFrom, iso.topTo, t);
    const h = heightFactor(iso.heightMode, x, y, n) * zScale;
    const gap = 0.04;
    const x0 = x + gap;
    const x1 = x + 1 - gap;
    const y0 = y + gap;
    const y1 = y + 1 - gap;

    faces.push({
      pts: [project(x1, y0, h), project(x1, y1, h), project(x1, y1, 0), project(x1, y0, 0)],
      fill: shadeRgb(base, rightShade),
    });
    faces.push({
      pts: [project(x0, y1, h), project(x1, y1, h), project(x1, y1, 0), project(x0, y1, 0)],
      fill: shadeRgb(base, leftShade),
    });
    faces.push({
      pts: [project(x0, y0, h), project(x1, y0, h), project(x1, y1, h), project(x0, y1, h)],
      fill: shadeRgb(base, 1.08),
    });
  }

  const centerPt = project(n / 2, n / 2, zScale * 1.1);
  const logo = logoFraction
    ? {
        size: contentW * logoFraction * 0.85,
        x: centerPt[0],
        y: centerPt[1],
      }
    : null;
  const footprint = [project(0, 0, 0), project(n, 0, 0), project(n, n, 0), project(0, n, 0)];

  // Auto-fit: measure the real geometry and centre it perfectly in the canvas.
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const face of faces) {
    for (const p of face.pts) {
      if (p[0] < minX) minX = p[0];
      if (p[0] > maxX) maxX = p[0];
      if (p[1] < minY) minY = p[1];
      if (p[1] > maxY) maxY = p[1];
    }
  }
  const bboxW = Math.max(1, maxX - minX);
  const bboxH = Math.max(1, maxY - minY);
  const k = (size - margin * 2) / Math.max(bboxW, bboxH);
  const tx = size / 2 - ((minX + maxX) / 2) * k;
  const ty = size / 2 - ((minY + maxY) / 2) * k;
  const fit = (p: number[]) => [p[0] * k + tx, p[1] * k + ty];

  for (const face of faces) face.pts = face.pts.map(fit);
  const fittedCenter = fit([centerPt[0], centerPt[1]]);
  if (logo) {
    logo.x = fittedCenter[0];
    logo.y = fittedCenter[1];
    logo.size *= k;
  }

  return {
    width: size,
    height: size,
    faces,
    logo,
    center: { x: fittedCenter[0], y: fittedCenter[1] },
    footprint: footprint.map(fit).map(([x, y]) => ({ x, y })),
  };
}

/* --------------------------------- canvas --------------------------------- */

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function paintIsoScene(
  ctx: CanvasRenderingContext2D,
  scene: IsoScene,
  design: DesignConfig,
  logoImage: HTMLImageElement | null,
) {
  const { width, height } = scene;
  ctx.clearRect(0, 0, width, height);

  if (!design.bgTransparent) {
    if (design.bgGradient.enabled) {
      const g =
        design.bgGradient.type === "radial"
          ? ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.72)
          : ctx.createLinearGradient(0, 0, width, height);
      g.addColorStop(0, design.bgGradient.from);
      g.addColorStop(1, design.bgGradient.to);
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = design.bgColor;
    }
    ctx.fillRect(0, 0, width, height);
  }

  if (design.iso.glow) {
    const glow = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      width * 0.55,
    );
    glow.addColorStop(0, `${design.iso.topTo}55`);
    glow.addColorStop(0.55, `${design.iso.topFrom}22`);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }

  if (design.iso.shadow) {
    const fp = scene.footprint;
    const cx = (fp[0].x + fp[2].x) / 2;
    const cy = (fp[0].y + fp[2].y) / 2 + (fp[2].y - fp[0].y) * 0.16;
    ctx.save();
    ctx.globalAlpha = 0.34;
    ctx.filter = `blur(${Math.max(6, width * 0.02)}px)`;
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.ellipse(cx, cy, (fp[1].x - fp[3].x) / 2.1, (fp[2].y - fp[0].y) / 2.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  for (const face of scene.faces) {
    ctx.beginPath();
    ctx.moveTo(face.pts[0][0], face.pts[0][1]);
    for (let i = 1; i < face.pts.length; i += 1) ctx.lineTo(face.pts[i][0], face.pts[i][1]);
    ctx.closePath();
    ctx.fillStyle = face.fill;
    ctx.fill();
  }

  if (scene.logo && logoImage) {
    const { x, y, size } = scene.logo;
    const pad = size * 0.1;
    ctx.save();
    ctx.shadowColor = "rgba(8,4,25,0.45)";
    ctx.shadowBlur = size * 0.35;
    ctx.shadowOffsetY = size * 0.1;
    ctx.fillStyle = "#ffffff";
    roundRectPath(ctx, x - size / 2 - pad, y - size / 2 - pad, size + pad * 2, size + pad * 2, size * 0.22);
    ctx.fill();
    ctx.restore();

    ctx.save();
    roundRectPath(ctx, x - size / 2, y - size / 2, size, size, size * 0.18);
    ctx.clip();
    ctx.drawImage(logoImage, x - size / 2, y - size / 2, size, size);
    ctx.restore();
  }
}

/* ----------------------------------- svg ---------------------------------- */

export function isoSceneToSvg(
  scene: IsoScene,
  design: DesignConfig,
  logoHref: string | null,
): string {
  const { width, height } = scene;
  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
  );
  parts.push("<defs>");
  parts.push(
    `<radialGradient id="glow" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="${design.iso.topTo}" stop-opacity="0.35"/><stop offset="100%" stop-color="${design.iso.topFrom}" stop-opacity="0"/></radialGradient>`,
  );
  parts.push(
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${design.bgGradient.from}"/><stop offset="100%" stop-color="${design.bgGradient.to}"/></linearGradient>`,
  );
  parts.push(
    `<clipPath id="logoClip"><rect x="${(scene.logo?.x ?? 0) - (scene.logo?.size ?? 0) / 2}" y="${
      (scene.logo?.y ?? 0) - (scene.logo?.size ?? 0) / 2
    }" width="${scene.logo?.size ?? 0}" height="${scene.logo?.size ?? 0}" rx="${
      (scene.logo?.size ?? 0) * 0.18
    }"/></clipPath>`,
  );
  parts.push("</defs>");

  if (!design.bgTransparent) {
    const fill = design.bgGradient.enabled ? "url(#bg)" : design.bgColor;
    parts.push(`<rect width="${width}" height="${height}" fill="${fill}"/>`);
  }
  if (design.iso.glow) {
    parts.push(`<rect width="${width}" height="${height}" fill="url(#glow)"/>`);
  }
  for (const face of scene.faces) {
    const pts = face.pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ");
    parts.push(`<polygon points="${pts}" fill="${face.fill}"/>`);
  }
  if (scene.logo && logoHref) {
    const { x, y, size } = scene.logo;
    const pad = size * 0.1;
    parts.push(
      `<rect x="${x - size / 2 - pad}" y="${y - size / 2 - pad}" width="${size + pad * 2}" height="${
        size + pad * 2
      }" rx="${size * 0.22}" fill="#ffffff"/>`,
    );
    parts.push(
      `<image href="${logoHref}" xlink:href="${logoHref}" x="${x - size / 2}" y="${
        y - size / 2
      }" width="${size}" height="${size}" clip-path="url(#logoClip)" preserveAspectRatio="xMidYMid slice"/>`,
    );
  }
  parts.push("</svg>");
  return parts.join("");
}
