export const DEFAULT_LOGO = "/brand/logo.png";

export type ContentType =
  | "url"
  | "text"
  | "wifi"
  | "vcard"
  | "email"
  | "sms"
  | "phone"
  | "geo"
  | "event"
  | "crypto";

export type ContentFields = Record<string, string>;

export type DotType =
  | "square"
  | "dots"
  | "rounded"
  | "extra-rounded"
  | "classy"
  | "classy-rounded";
export type CornerSquareType = "square" | "dot" | "extra-rounded";
export type CornerDotType = "square" | "dot";
export type Ecc = "L" | "M" | "Q" | "H";
export type ExportFormat = "png" | "jpeg" | "webp" | "svg" | "pdf";

export type GradientConfig = {
  enabled: boolean;
  type: "linear" | "radial";
  from: string;
  to: string;
  rotation: number;
};

export type FrameConfig = {
  enabled: boolean;
  style: "pill" | "ribbon" | "badge";
  text: string;
  bg: string;
  textColor: string;
};

export type IsoConfig = {
  depth: number;
  tilt: number;
  heightMode: "uniform" | "radial" | "wave" | "random" | "corners";
  topFrom: string;
  topTo: string;
  gradientDir: "diagonal" | "radial" | "vertical";
  lightFrom: "left" | "right";
  shadow: boolean;
  floor: boolean;
  floorColor: string;
  glow: boolean;
};

export type DesignConfig = {
  engine: "flat" | "iso3d";
  size: number;
  margin: number;
  ecc: Ecc;
  dotType: DotType;
  dotColor: string;
  dotGradient: GradientConfig;
  cornerSquareType: CornerSquareType;
  cornerSquareColor: string;
  cornerDotType: CornerDotType;
  cornerDotColor: string;
  bgColor: string;
  bgTransparent: boolean;
  bgGradient: GradientConfig;
  logoEnabled: boolean;
  logoSrc: string;
  logoSize: number;
  logoMargin: number;
  logoHideDots: boolean;
  logoRounded: boolean;
  frame: FrameConfig;
  iso: IsoConfig;
};

export type LandingButton = {
  id: string;
  label: string;
  url: string;
  icon: string;
  style: "primary" | "ghost";
};

export type LandingTheme = "aurora" | "midnight" | "sunset" | "emerald" | "mono";

export type LandingConfig = {
  theme: LandingTheme;
  headline: string;
  subheadline: string;
  body: string;
  avatarUrl: string;
  buttons: LandingButton[];
  showBranding: boolean;
  autoRedirectSeconds: number | null;
};

export type RoutingConfig = {
  ios: string;
  android: string;
  desktop: string;
};

export type QrConfigPayload = {
  id?: string;
  name: string;
  contentType: ContentType;
  content: ContentFields;
  staticPayload: string;
  dynamic: boolean;
  mode: "redirect" | "landing" | "router";
  targetUrl: string;
  landing: LandingConfig | null;
  routing: RoutingConfig | null;
  design: DesignConfig;
  password: string | null;
  expiresAt: string | null;
  activeFrom: string | null;
  maxScans: number | null;
  active: boolean;
  expiredUrl: string | null;
};

export type QrCodeDTO = QrConfigPayload & {
  id: string;
  slug: string;
  scanCount: number;
  hasPassword: boolean;
  createdAt: string;
  updatedAt: string;
};

export const DEFAULT_DESIGN: DesignConfig = {
  engine: "flat",
  size: 1000,
  margin: 24,
  ecc: "H",
  dotType: "extra-rounded",
  dotColor: "#4c1d95",
  dotGradient: {
    enabled: true,
    type: "linear",
    from: "#7c3aed",
    to: "#06b6d4",
    rotation: 45,
  },
  cornerSquareType: "extra-rounded",
  cornerSquareColor: "#5b21b6",
  cornerDotType: "dot",
  cornerDotColor: "#06b6d4",
  bgColor: "#ffffff",
  bgTransparent: false,
  bgGradient: {
    enabled: false,
    type: "linear",
    from: "#ffffff",
    to: "#e9e7ff",
    rotation: 90,
  },
  logoEnabled: true,
  logoSrc: DEFAULT_LOGO,
  logoSize: 0.26,
  logoMargin: 8,
  logoHideDots: true,
  logoRounded: true,
  frame: {
    enabled: false,
    style: "pill",
    text: "SCAN ME",
    bg: "#0b0b18",
    textColor: "#ffffff",
  },
  iso: {
    depth: 0.75,
    tilt: 34,
    heightMode: "uniform",
    topFrom: "#8b5cf6",
    topTo: "#22d3ee",
    gradientDir: "diagonal",
    lightFrom: "left",
    shadow: true,
    floor: true,
    floorColor: "#0e0b1f",
    glow: true,
  },
};

export const DEFAULT_LANDING: LandingConfig = {
  theme: "aurora",
  headline: "Welcome 👋",
  subheadline: "You just scanned a Codenium code",
  body: "Everything you need, one scan away. Tap a link below to continue.",
  avatarUrl: DEFAULT_LOGO,
  buttons: [
    { id: "b1", label: "Visit website", url: "https://example.com", icon: "🌐", style: "primary" },
    { id: "b2", label: "Contact us", url: "mailto:hello@example.com", icon: "✉️", style: "ghost" },
  ],
  showBranding: true,
  autoRedirectSeconds: null,
};

export const DEFAULT_ROUTING: RoutingConfig = { ios: "", android: "", desktop: "" };

export type StylePreset = {
  id: string;
  name: string;
  swatch: [string, string];
  design: Partial<DesignConfig>;
};

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "codenium",
    name: "Codenium",
    swatch: ["#7c3aed", "#06b6d4"],
    design: {
      dotType: "extra-rounded",
      dotGradient: { enabled: true, type: "linear", from: "#7c3aed", to: "#06b6d4", rotation: 45 },
      cornerSquareType: "extra-rounded",
      cornerSquareColor: "#5b21b6",
      cornerDotColor: "#06b6d4",
      bgColor: "#ffffff",
      bgTransparent: false,
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    swatch: ["#f97316", "#db2777"],
    design: {
      dotType: "classy-rounded",
      dotGradient: { enabled: true, type: "linear", from: "#f97316", to: "#db2777", rotation: 30 },
      cornerSquareType: "dot",
      cornerSquareColor: "#db2777",
      cornerDotColor: "#f97316",
      bgColor: "#fff7ed",
      bgTransparent: false,
    },
  },
  {
    id: "matrix",
    name: "Matrix",
    swatch: ["#22c55e", "#052e16"],
    design: {
      dotType: "dots",
      dotGradient: { enabled: true, type: "radial", from: "#4ade80", to: "#15803d", rotation: 0 },
      cornerSquareType: "square",
      cornerSquareColor: "#22c55e",
      cornerDotColor: "#bbf7d0",
      bgColor: "#04140a",
      bgTransparent: false,
    },
  },
  {
    id: "mono",
    name: "Mono",
    swatch: ["#111827", "#6b7280"],
    design: {
      dotType: "square",
      dotGradient: { enabled: false, type: "linear", from: "#111827", to: "#111827", rotation: 0 },
      dotColor: "#0f172a",
      cornerSquareType: "square",
      cornerSquareColor: "#0f172a",
      cornerDotColor: "#0f172a",
      bgColor: "#ffffff",
      bgTransparent: false,
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    swatch: ["#0ea5e9", "#1e1b4b"],
    design: {
      dotType: "rounded",
      dotGradient: { enabled: true, type: "linear", from: "#38bdf8", to: "#1e1b4b", rotation: 135 },
      cornerSquareType: "extra-rounded",
      cornerSquareColor: "#1e3a8a",
      cornerDotColor: "#38bdf8",
      bgColor: "#f0f9ff",
      bgTransparent: false,
    },
  },
  {
    id: "neon",
    name: "Neon",
    swatch: ["#f0abfc", "#0b0b18"],
    design: {
      dotType: "classy",
      dotGradient: { enabled: true, type: "linear", from: "#f0abfc", to: "#22d3ee", rotation: 90 },
      cornerSquareType: "dot",
      cornerSquareColor: "#f0abfc",
      cornerDotColor: "#22d3ee",
      bgColor: "#0b0b18",
      bgTransparent: false,
    },
  },
];

export function cloneDesign(design?: Partial<DesignConfig> | null): DesignConfig {
  const base: DesignConfig = JSON.parse(JSON.stringify(DEFAULT_DESIGN));
  if (!design) return base;
  return {
    ...base,
    ...design,
    dotGradient: { ...base.dotGradient, ...(design.dotGradient ?? {}) },
    bgGradient: { ...base.bgGradient, ...(design.bgGradient ?? {}) },
    frame: { ...base.frame, ...(design.frame ?? {}) },
    iso: { ...base.iso, ...(design.iso ?? {}) },
  };
}
