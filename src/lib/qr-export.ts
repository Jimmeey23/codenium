"use client";

import type { Options as QrStylingOptions } from "qr-code-styling";
import { buildIsoScene, buildMatrix, clearCenter, isoSceneToSvg, paintIsoScene } from "./iso3d";
import type { DesignConfig, ExportFormat } from "./types";

export type RasterFormat = "png" | "jpeg" | "webp";

const mimeFor = (f: RasterFormat) => (f === "png" ? "image/png" : `image/${f}`);

export function flatOptions(design: DesignConfig, data: string, size: number): QrStylingOptions {
  const dotGradient = design.dotGradient.enabled
    ? {
        type: design.dotGradient.type,
        rotation: (design.dotGradient.rotation * Math.PI) / 180,
        colorStops: [
          { offset: 0, color: design.dotGradient.from },
          { offset: 1, color: design.dotGradient.to },
        ],
      }
    : undefined;

  const bgGradient = design.bgGradient.enabled
    ? {
        type: design.bgGradient.type,
        rotation: (design.bgGradient.rotation * Math.PI) / 180,
        colorStops: [
          { offset: 0, color: design.bgGradient.from },
          { offset: 1, color: design.bgGradient.to },
        ],
      }
    : undefined;

  return {
    width: size,
    height: size,
    data: data || " ",
    margin: Math.round((design.margin / design.size) * size),
    image: design.logoEnabled && design.logoSrc ? design.logoSrc : undefined,
    qrOptions: { typeNumber: 0, mode: "Byte", errorCorrectionLevel: design.ecc },
    imageOptions: {
      hideBackgroundDots: design.logoHideDots,
      imageSize: design.logoSize,
      margin: Math.round((design.logoMargin / design.size) * size),
      crossOrigin: "anonymous",
    },
    dotsOptions: {
      type: design.dotType,
      color: design.dotColor,
      ...(dotGradient ? { gradient: dotGradient } : {}),
    },
    backgroundOptions: {
      color: design.bgTransparent ? "rgba(255,255,255,0)" : design.bgColor,
      ...(bgGradient && !design.bgTransparent ? { gradient: bgGradient } : {}),
    },
    cornersSquareOptions: { type: design.cornerSquareType, color: design.cornerSquareColor },
    cornersDotOptions: { type: design.cornerDotType, color: design.cornerDotColor },
  } as QrStylingOptions;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load image: ${src}`));
    img.src = src;
  });
}

/** Render the 3D isometric engine straight onto a canvas. */
export async function paintIso(canvas: HTMLCanvasElement, design: DesignConfig, data: string, size: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = size;
  canvas.height = size;
  let matrix = buildMatrix(data || " ", design.ecc);
  if (design.logoEnabled && design.logoSrc) matrix = clearCenter(matrix, design.logoSize + 0.06);
  const scene = buildIsoScene(
    matrix,
    design.iso,
    size,
    Math.round((design.margin / design.size) * size),
    design.logoEnabled && design.logoSrc ? design.logoSize : null,
  );
  let logo: HTMLImageElement | null = null;
  if (design.logoEnabled && design.logoSrc) {
    try {
      logo = await loadImage(design.logoSrc);
    } catch {
      logo = null;
    }
  }
  paintIsoScene(ctx, scene, design, logo);
}

async function flatRaster(design: DesignConfig, data: string, size: number): Promise<HTMLCanvasElement> {
  const { default: QRCodeStyling } = await import("qr-code-styling");
  const qr = new QRCodeStyling({ ...flatOptions(design, data, size), type: "canvas" });
  const blob = (await qr.getRawData("png")) as Blob | null;
  if (!blob) throw new Error("Unable to render QR code");
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx?.drawImage(bitmap, 0, 0, size, size);
  return canvas;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Composite the rendered code inside an optional branded frame. */
function withFrame(source: HTMLCanvasElement, design: DesignConfig): HTMLCanvasElement {
  if (!design.frame.enabled) return source;
  const size = source.width;
  const pad = Math.round(size * 0.07);
  const caption = Math.round(size * 0.17);
  const canvas = document.createElement("canvas");
  canvas.width = size + pad * 2;
  canvas.height = size + pad * 2 + caption;
  const ctx = canvas.getContext("2d");
  if (!ctx) return source;

  const topCaption = design.frame.style === "badge";
  const radius = design.frame.style === "ribbon" ? size * 0.03 : size * 0.09;

  ctx.fillStyle = design.frame.bg;
  roundRect(ctx, 0, 0, canvas.width, canvas.height, radius);
  ctx.fill();

  const qrY = topCaption ? caption + pad : pad;
  ctx.save();
  roundRect(ctx, pad, qrY, size, size, design.frame.style === "ribbon" ? size * 0.02 : size * 0.06);
  ctx.clip();
  if (!design.bgTransparent) {
    ctx.fillStyle = design.bgTransparent ? "#ffffff" : design.bgColor;
    ctx.fillRect(pad, qrY, size, size);
  }
  ctx.drawImage(source, pad, qrY, size, size);
  ctx.restore();

  const text = (design.frame.text || "SCAN ME").toUpperCase();
  const fontSize = Math.round(caption * 0.4);
  ctx.fillStyle = design.frame.textColor;
  ctx.font = `700 ${fontSize}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  try {
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${Math.round(
      fontSize * 0.14,
    )}px`;
  } catch {
    /* letterSpacing not supported */
  }
  const captionY = topCaption ? pad + caption / 2 - pad * 0.15 : size + pad * 2 + caption / 2 - pad * 0.3;
  ctx.fillText(text, canvas.width / 2, captionY);
  return canvas;
}

export async function renderCanvas(
  design: DesignConfig,
  data: string,
  scale = 1,
): Promise<HTMLCanvasElement> {
  const size = Math.round(design.size * scale);
  const base =
    design.engine === "iso3d"
      ? await (async () => {
          const canvas = document.createElement("canvas");
          await paintIso(canvas, design, data, size);
          return canvas;
        })()
      : await flatRaster(design, data, size);
  return withFrame(base, design);
}

async function toDataUrl(src: string): Promise<string> {
  if (src.startsWith("data:")) return src;
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(blob);
    });
  } catch {
    return src;
  }
}

export async function renderSvg(design: DesignConfig, data: string): Promise<string> {
  const size = design.size;
  let inner: string;
  if (design.engine === "iso3d") {
    let matrix = buildMatrix(data || " ", design.ecc);
    if (design.logoEnabled && design.logoSrc) matrix = clearCenter(matrix, design.logoSize + 0.06);
    const scene = buildIsoScene(
      matrix,
      design.iso,
      size,
      design.margin,
      design.logoEnabled && design.logoSrc ? design.logoSize : null,
    );
    const href = design.logoEnabled && design.logoSrc ? await toDataUrl(design.logoSrc) : null;
    inner = isoSceneToSvg(scene, design, href);
  } else {
    const { default: QRCodeStyling } = await import("qr-code-styling");
    const opts = flatOptions(design, data, size);
    if (opts.image) opts.image = await toDataUrl(opts.image);
    const qr = new QRCodeStyling({ ...opts, type: "svg" });
    const blob = (await qr.getRawData("svg")) as Blob | null;
    if (!blob) throw new Error("Unable to render SVG");
    inner = await blob.text();
  }

  if (!design.frame.enabled) return inner;

  const pad = Math.round(size * 0.07);
  const caption = Math.round(size * 0.17);
  const width = size + pad * 2;
  const height = size + pad * 2 + caption;
  const topCaption = design.frame.style === "badge";
  const radius = design.frame.style === "ribbon" ? size * 0.03 : size * 0.09;
  const qrY = topCaption ? caption + pad : pad;
  const fontSize = Math.round(caption * 0.4);
  const captionY = topCaption ? pad + caption / 2 : size + pad * 2 + caption / 2 - pad * 0.3;
  const body = inner.replace(/^<\?xml[^>]*\?>/, "").replace(/<svg /, `<svg x="${pad}" y="${qrY}" `);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" rx="${radius}" fill="${design.frame.bg}"/>${body}<text x="${
    width / 2
  }" y="${captionY}" fill="${
    design.frame.textColor
  }" font-family="ui-sans-serif, system-ui, sans-serif" font-size="${fontSize}" font-weight="700" letter-spacing="${
    fontSize * 0.14
  }" text-anchor="middle" dominant-baseline="middle">${(design.frame.text || "SCAN ME")
    .toUpperCase()
    .replace(/[<>&]/g, "")}</text></svg>`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function canvasToBlob(canvas: HTMLCanvasElement, format: RasterFormat): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))),
      mimeFor(format),
      0.96,
    );
  });
}

export async function exportQr(opts: {
  design: DesignConfig;
  data: string;
  format: ExportFormat;
  scale: number;
  filename: string;
}): Promise<void> {
  const { design, data, format, scale, filename } = opts;

  if (format === "svg") {
    const svg = await renderSvg(design, data);
    triggerDownload(new Blob([svg], { type: "image/svg+xml" }), `${filename}.svg`);
    return;
  }

  const working = { ...design };
  if (format === "jpeg" || format === "pdf") working.bgTransparent = false;
  const canvas = await renderCanvas(working, data, scale);

  if (format === "pdf") {
    const { jsPDF } = await import("jspdf");
    const png = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: canvas.width >= canvas.height ? "landscape" : "portrait",
      unit: "px",
      format: [canvas.width, canvas.height],
    });
    pdf.addImage(png, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save(`${filename}.pdf`);
    return;
  }

  const blob = await canvasToBlob(canvas, format);
  triggerDownload(blob, `${filename}.${format === "jpeg" ? "jpg" : format}`);
}

export async function copyPngToClipboard(design: DesignConfig, data: string, scale = 1) {
  const canvas = await renderCanvas(design, data, scale);
  const blob = await canvasToBlob(canvas, "png");
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}
