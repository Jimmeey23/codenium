import { buildPayload, defaultContent } from "@/lib/qr-content";
import {
  cloneDesign,
  DEFAULT_LANDING,
  DEFAULT_ROUTING,
  type ContentFields,
  type ContentType,
  type DesignConfig,
  type LandingConfig,
  type QrCodeDTO,
  type RoutingConfig,
} from "@/lib/types";

export type ExpiryMode = "never" | "1h" | "24h" | "7d" | "30d" | "custom";

export type StudioState = {
  id: string | null;
  slug: string | null;
  name: string;
  contentType: ContentType;
  content: ContentFields;
  dynamic: boolean;
  mode: "redirect" | "landing" | "router";
  landing: LandingConfig;
  routing: RoutingConfig;
  design: DesignConfig;
  password: string;
  hasPassword: boolean;
  expiryMode: ExpiryMode;
  expiresAt: string | null;
  activeFrom: string | null;
  maxScans: number | null;
  active: boolean;
  expiredUrl: string;
  scanCount: number;
};

export function initialState(): StudioState {
  return {
    id: null,
    slug: null,
    name: "My first Codenium code",
    contentType: "url",
    content: defaultContent("url"),
    dynamic: true,
    mode: "redirect",
    landing: JSON.parse(JSON.stringify(DEFAULT_LANDING)) as LandingConfig,
    routing: { ...DEFAULT_ROUTING },
    design: cloneDesign(),
    password: "",
    hasPassword: false,
    expiryMode: "never",
    expiresAt: null,
    activeFrom: null,
    maxScans: null,
    active: true,
    expiredUrl: "",
    scanCount: 0,
  };
}

export function fromDTO(dto: QrCodeDTO): StudioState {
  return {
    id: dto.id,
    slug: dto.slug,
    name: dto.name,
    contentType: dto.contentType,
    content: dto.content ?? {},
    dynamic: dto.dynamic,
    mode: dto.mode,
    landing: { ...DEFAULT_LANDING, ...(dto.landing ?? {}) },
    routing: { ...DEFAULT_ROUTING, ...(dto.routing ?? {}) },
    design: cloneDesign(dto.design),
    password: "",
    hasPassword: dto.hasPassword,
    expiryMode: dto.expiresAt ? "custom" : "never",
    expiresAt: dto.expiresAt,
    activeFrom: dto.activeFrom,
    maxScans: dto.maxScans,
    active: dto.active,
    expiredUrl: dto.expiredUrl ?? "",
    scanCount: dto.scanCount,
  };
}

export function payloadOf(s: StudioState): string {
  return buildPayload(s.contentType, s.content);
}

/** What actually gets encoded into the matrix. */
export function encodedData(s: StudioState, origin: string): string {
  if (!s.dynamic) return payloadOf(s);
  if (s.slug) return `${origin}/r/${s.slug}`;
  return `${origin}/r/preview`;
}

export function toPayloadBody(s: StudioState, includePassword: boolean) {
  const payload = payloadOf(s);
  return {
    name: s.name,
    contentType: s.contentType,
    content: s.content,
    staticPayload: payload,
    dynamic: s.dynamic,
    mode: s.mode,
    targetUrl: payload,
    landing: s.mode === "landing" ? s.landing : null,
    routing: s.mode === "router" ? s.routing : null,
    design: s.design,
    expiresAt: s.expiresAt,
    activeFrom: s.activeFrom,
    maxScans: s.maxScans,
    active: s.active,
    expiredUrl: s.expiredUrl || null,
    ...(includePassword ? { password: s.password } : {}),
  };
}

export function expiryFromMode(mode: ExpiryMode, current: string | null): string | null {
  const now = Date.now();
  const map: Record<string, number> = {
    "1h": 3600e3,
    "24h": 86400e3,
    "7d": 7 * 86400e3,
    "30d": 30 * 86400e3,
  };
  if (mode === "never") return null;
  if (mode === "custom") return current ?? new Date(now + 86400e3).toISOString();
  return new Date(now + map[mode]).toISOString();
}

export function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
