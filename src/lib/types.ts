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

/** Custom finder-pattern shapes drawn by `lib/eyes.ts` ("auto" = library default). */
export type EyeFrameStyle =
  | "auto"
  | "square"
  | "rounded"
  | "circle"
  | "leaf"
  | "leaf-flip"
  | "shield"
  | "cut"
  | "diamond"
  | "bars"
  | "dotted";

export type EyeBallStyle =
  | "square"
  | "dot"
  | "rounded"
  | "leaf"
  | "leaf-flip"
  | "diamond"
  | "cut";
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
  eyeFrameStyle: EyeFrameStyle;
  eyeBallStyle: EyeBallStyle;
  /** Give the top-right and bottom-left eyes their own accent colour. */
  eyeTwoTone: boolean;
  eyeAccentColor: string;
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
  dotColor: "#0a0a0a",
  dotGradient: {
    enabled: false,
    type: "linear",
    from: "#0a0a0a",
    to: "#1f2937",
    rotation: 45,
  },
  cornerSquareType: "extra-rounded",
  cornerSquareColor: "#050505",
  cornerDotType: "dot",
  cornerDotColor: "#1d4ed8",
  eyeFrameStyle: "leaf",
  eyeBallStyle: "rounded",
  eyeTwoTone: true,
  eyeAccentColor: "#1d4ed8",
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
    swatch: ["#0a0a0a", "#1d4ed8"],
    design: {
      dotType: "extra-rounded",
      dotColor: "#0a0a0a",
      dotGradient: { enabled: false, type: "linear", from: "#0a0a0a", to: "#1f2937", rotation: 45 },
      cornerSquareType: "extra-rounded",
      cornerSquareColor: "#050505",
      cornerDotColor: "#1d4ed8",
      eyeFrameStyle: "leaf",
      eyeBallStyle: "rounded",
      eyeTwoTone: true,
      eyeAccentColor: "#1d4ed8",
      bgColor: "#ffffff",
      bgTransparent: false,
    },
  },
  {
    id: "carbon",
    name: "Carbon",
    swatch: ["#0a0a0a", "#38bdf8"],
    design: {
      dotType: "square",
      dotColor: "#0a0a0a",
      dotGradient: { enabled: false, type: "linear", from: "#0a0a0a", to: "#0a0a0a", rotation: 0 },
      cornerSquareType: "square",
      cornerSquareColor: "#0a0a0a",
      cornerDotColor: "#0284c7",
      eyeFrameStyle: "cut",
      eyeBallStyle: "cut",
      eyeTwoTone: true,
      eyeAccentColor: "#0284c7",
      bgColor: "#ffffff",
      bgTransparent: false,
    },
  },
  {
    id: "circuit",
    name: "Circuit",
    swatch: ["#111827", "#2563eb"],
    design: {
      dotType: "dots",
      dotColor: "#111827",
      dotGradient: { enabled: false, type: "linear", from: "#111827", to: "#111827", rotation: 0 },
      cornerSquareType: "dot",
      cornerSquareColor: "#111827",
      cornerDotColor: "#2563eb",
      eyeFrameStyle: "dotted",
      eyeBallStyle: "dot",
      eyeTwoTone: true,
      eyeAccentColor: "#2563eb",
      bgColor: "#ffffff",
      bgTransparent: false,
    },
  },
  {
    id: "mono",
    name: "Mono",
    swatch: ["#000000", "#6b7280"],
    design: {
      dotType: "square",
      dotGradient: { enabled: false, type: "linear", from: "#000000", to: "#000000", rotation: 0 },
      dotColor: "#000000",
      cornerSquareType: "square",
      cornerSquareColor: "#000000",
      cornerDotColor: "#000000",
      eyeFrameStyle: "square",
      eyeBallStyle: "square",
      eyeTwoTone: false,
      eyeAccentColor: "#000000",
      bgColor: "#ffffff",
      bgTransparent: false,
    },
  },
  {
    id: "neon",
    name: "Neon",
    swatch: ["#00e5ff", "#0b0b0b"],
    design: {
      dotType: "classy",
      dotColor: "#e6fbff",
      dotGradient: { enabled: true, type: "linear", from: "#00e5ff", to: "#7c3aed", rotation: 90 },
      cornerSquareType: "dot",
      cornerSquareColor: "#00e5ff",
      cornerDotColor: "#f0abfc",
      eyeFrameStyle: "circle",
      eyeBallStyle: "dot",
      eyeTwoTone: true,
      eyeAccentColor: "#f0abfc",
      bgColor: "#0b0b0b",
      bgTransparent: false,
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    swatch: ["#f97316", "#db2777"],
    design: {
      dotType: "classy-rounded",
      dotColor: "#db2777",
      dotGradient: { enabled: true, type: "linear", from: "#f97316", to: "#db2777", rotation: 30 },
      cornerSquareType: "dot",
      cornerSquareColor: "#1f1013",
      cornerDotColor: "#f97316",
      eyeFrameStyle: "leaf-flip",
      eyeBallStyle: "leaf-flip",
      eyeTwoTone: true,
      eyeAccentColor: "#db2777",
      bgColor: "#fff7ed",
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
