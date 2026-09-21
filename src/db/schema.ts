import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type {
  ContentFields,
  ContentType,
  DesignConfig,
  LandingConfig,
  RoutingConfig,
} from "@/lib/types";

export const qrCodes = pgTable(
  "qr_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull().default("Untitled code"),
    contentType: text("content_type").$type<ContentType>().notNull().default("url"),
    content: jsonb("content").$type<ContentFields>().notNull().default({}),
    staticPayload: text("static_payload").notNull().default(""),
    dynamic: boolean("dynamic").notNull().default(true),
    mode: text("mode").$type<"redirect" | "landing" | "router">().notNull().default("redirect"),
    targetUrl: text("target_url").notNull().default(""),
    landing: jsonb("landing").$type<LandingConfig | null>(),
    routing: jsonb("routing").$type<RoutingConfig | null>(),
    design: jsonb("design").$type<DesignConfig>().notNull(),
    password: text("password"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    activeFrom: timestamp("active_from", { withTimezone: true }),
    maxScans: integer("max_scans"),
    scanCount: integer("scan_count").notNull().default(0),
    active: boolean("active").notNull().default(true),
    expiredUrl: text("expired_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("qr_codes_created_idx").on(t.createdAt)],
);

export const qrScans = pgTable(
  "qr_scans",
  {
    id: serial("id").primaryKey(),
    codeId: uuid("code_id")
      .notNull()
      .references(() => qrCodes.id, { onDelete: "cascade" }),
    scannedAt: timestamp("scanned_at", { withTimezone: true }).notNull().defaultNow(),
    device: text("device").notNull().default("unknown"),
    os: text("os").notNull().default("unknown"),
    browser: text("browser").notNull().default("unknown"),
    referrer: text("referrer"),
    outcome: text("outcome").notNull().default("ok"),
  },
  (t) => [index("qr_scans_code_idx").on(t.codeId)],
);

export type QrCodeRow = typeof qrCodes.$inferSelect;
export type QrScanRow = typeof qrScans.$inferSelect;
