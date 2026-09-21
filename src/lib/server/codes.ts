import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { QrCodeRow } from "@/db/schema";
import {
  cloneDesign,
  DEFAULT_LANDING,
  DEFAULT_ROUTING,
  type ContentFields,
  type ContentType,
  type QrCodeDTO,
  type QrConfigPayload,
} from "@/lib/types";

const ALPHABET = "abcdefghijkmnopqrstuvwxyz23456789";

export function generateSlug(length = 7): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return true;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

export function toDTO(row: QrCodeRow): QrCodeDTO {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    contentType: row.contentType,
    content: row.content ?? {},
    staticPayload: row.staticPayload,
    dynamic: row.dynamic,
    mode: row.mode,
    targetUrl: row.targetUrl,
    landing: row.landing ?? null,
    routing: row.routing ?? null,
    design: cloneDesign(row.design),
    password: null,
    hasPassword: Boolean(row.password),
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    activeFrom: row.activeFrom ? row.activeFrom.toISOString() : null,
    maxScans: row.maxScans,
    active: row.active,
    expiredUrl: row.expiredUrl,
    scanCount: row.scanCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const parseDate = (value: unknown): Date | null => {
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export type NormalizedInput = {
  name: string;
  contentType: ContentType;
  content: ContentFields;
  staticPayload: string;
  dynamic: boolean;
  mode: "redirect" | "landing" | "router";
  targetUrl: string;
  landing: QrConfigPayload["landing"];
  routing: QrConfigPayload["routing"];
  design: QrConfigPayload["design"];
  expiresAt: Date | null;
  activeFrom: Date | null;
  maxScans: number | null;
  active: boolean;
  expiredUrl: string | null;
  password?: string | null;
};

export function normalizeInput(body: Partial<QrConfigPayload>): NormalizedInput {
  const mode = (["redirect", "landing", "router"] as const).includes(
    body.mode as "redirect" | "landing" | "router",
  )
    ? (body.mode as "redirect" | "landing" | "router")
    : "redirect";

  const maxScansRaw = body.maxScans;
  const maxScans =
    typeof maxScansRaw === "number" && Number.isFinite(maxScansRaw) && maxScansRaw > 0
      ? Math.floor(maxScansRaw)
      : null;

  const normalized: NormalizedInput = {
    name: (body.name ?? "Untitled code").toString().slice(0, 120) || "Untitled code",
    contentType: (body.contentType ?? "url") as ContentType,
    content: (body.content ?? {}) as ContentFields,
    staticPayload: (body.staticPayload ?? "").toString(),
    dynamic: body.dynamic !== false,
    mode,
    targetUrl: (body.targetUrl ?? "").toString(),
    landing: mode === "landing" ? { ...DEFAULT_LANDING, ...(body.landing ?? {}) } : (body.landing ?? null),
    routing: mode === "router" ? { ...DEFAULT_ROUTING, ...(body.routing ?? {}) } : (body.routing ?? null),
    design: cloneDesign(body.design),
    expiresAt: parseDate(body.expiresAt),
    activeFrom: parseDate(body.activeFrom),
    maxScans,
    active: body.active !== false,
    expiredUrl: body.expiredUrl ? body.expiredUrl.toString() : null,
  };

  if (typeof body.password === "string") {
    normalized.password = body.password.trim() ? hashPassword(body.password.trim()) : null;
  }
  return normalized;
}

export function detectClient(userAgent: string) {
  const ua = userAgent.toLowerCase();
  const isTablet = /ipad|tablet|playbook|silk/.test(ua) || (/android/.test(ua) && !/mobile/.test(ua));
  const isMobile = /iphone|ipod|android.*mobile|windows phone|blackberry/.test(ua);
  const device = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

  let os = "unknown";
  if (/iphone|ipad|ipod/.test(ua)) os = "iOS";
  else if (/android/.test(ua)) os = "Android";
  else if (/mac os x/.test(ua)) os = "macOS";
  else if (/windows/.test(ua)) os = "Windows";
  else if (/linux/.test(ua)) os = "Linux";

  let browser = "unknown";
  if (/edg\//.test(ua)) browser = "Edge";
  else if (/opr\//.test(ua)) browser = "Opera";
  else if (/chrome\//.test(ua)) browser = "Chrome";
  else if (/safari\//.test(ua)) browser = "Safari";
  else if (/firefox\//.test(ua)) browser = "Firefox";

  return { device, os, browser };
}

export function resolveTarget(
  row: Pick<QrCodeRow, "mode" | "targetUrl" | "routing">,
  os: string,
): string {
  if (row.mode === "router" && row.routing) {
    if (os === "iOS" && row.routing.ios) return row.routing.ios;
    if (os === "Android" && row.routing.android) return row.routing.android;
    if (!["iOS", "Android"].includes(os) && row.routing.desktop) return row.routing.desktop;
  }
  return row.targetUrl;
}

export function ensureAbsolute(url: string): string {
  const trimmed = (url || "").trim();
  if (!trimmed) return "/";
  if (/^[a-zA-Z][\w+.-]*:/.test(trimmed) || trimmed.startsWith("/")) return trimmed;
  return `https://${trimmed}`;
}
