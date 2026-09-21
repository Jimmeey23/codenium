import type { ContentFields, ContentType } from "./types";

export type ContentField = {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "textarea" | "select" | "number" | "datetime-local";
  options?: { value: string; label: string }[];
  half?: boolean;
};

export const CONTENT_TYPES: {
  id: ContentType;
  label: string;
  icon: string;
  hint: string;
  fields: ContentField[];
}[] = [
  {
    id: "url",
    label: "Website",
    icon: "🌐",
    hint: "Send people to any link",
    fields: [{ key: "url", label: "Destination URL", placeholder: "https://yourbrand.com" }],
  },
  {
    id: "text",
    label: "Text",
    icon: "📝",
    hint: "Plain text payload",
    fields: [{ key: "text", label: "Text", type: "textarea", placeholder: "Anything you like…" }],
  },
  {
    id: "wifi",
    label: "Wi‑Fi",
    icon: "📶",
    hint: "One-tap network join",
    fields: [
      { key: "ssid", label: "Network name (SSID)", placeholder: "Codenium-Guest" },
      { key: "password", label: "Password", placeholder: "••••••••", half: true },
      {
        key: "encryption",
        label: "Security",
        type: "select",
        half: true,
        options: [
          { value: "WPA", label: "WPA/WPA2" },
          { value: "WEP", label: "WEP" },
          { value: "nopass", label: "Open" },
        ],
      },
      {
        key: "hidden",
        label: "Hidden network",
        type: "select",
        options: [
          { value: "false", label: "No" },
          { value: "true", label: "Yes" },
        ],
      },
    ],
  },
  {
    id: "vcard",
    label: "vCard",
    icon: "👤",
    hint: "Digital business card",
    fields: [
      { key: "firstName", label: "First name", placeholder: "Ada", half: true },
      { key: "lastName", label: "Last name", placeholder: "Lovelace", half: true },
      { key: "org", label: "Company", placeholder: "Codenium Labs", half: true },
      { key: "title", label: "Job title", placeholder: "Head of Design", half: true },
      { key: "phone", label: "Phone", placeholder: "+1 555 0100", half: true },
      { key: "email", label: "Email", placeholder: "ada@codenium.dev", half: true },
      { key: "website", label: "Website", placeholder: "https://codenium.dev" },
      { key: "address", label: "Address", placeholder: "1 Infinite Loop, CA" },
    ],
  },
  {
    id: "email",
    label: "Email",
    icon: "✉️",
    hint: "Pre-filled email",
    fields: [
      { key: "to", label: "To", placeholder: "hello@codenium.dev" },
      { key: "subject", label: "Subject", placeholder: "Hey there" },
      { key: "body", label: "Message", type: "textarea", placeholder: "Write something…" },
    ],
  },
  {
    id: "sms",
    label: "SMS",
    icon: "💬",
    hint: "Pre-filled text message",
    fields: [
      { key: "phone", label: "Phone number", placeholder: "+1 555 0100" },
      { key: "message", label: "Message", type: "textarea", placeholder: "Hi!" },
    ],
  },
  {
    id: "phone",
    label: "Call",
    icon: "📞",
    hint: "Dial a number",
    fields: [{ key: "phone", label: "Phone number", placeholder: "+1 555 0100" }],
  },
  {
    id: "geo",
    label: "Location",
    icon: "📍",
    hint: "Drop a pin",
    fields: [
      { key: "lat", label: "Latitude", placeholder: "37.7749", half: true },
      { key: "lng", label: "Longitude", placeholder: "-122.4194", half: true },
    ],
  },
  {
    id: "event",
    label: "Event",
    icon: "📅",
    hint: "Add to calendar",
    fields: [
      { key: "title", label: "Event title", placeholder: "Product launch" },
      { key: "location", label: "Location", placeholder: "San Francisco" },
      { key: "start", label: "Starts", type: "datetime-local", half: true },
      { key: "end", label: "Ends", type: "datetime-local", half: true },
    ],
  },
  {
    id: "crypto",
    label: "Payment",
    icon: "🪙",
    hint: "Crypto / UPI request",
    fields: [
      {
        key: "network",
        label: "Network",
        type: "select",
        half: true,
        options: [
          { value: "bitcoin", label: "Bitcoin" },
          { value: "ethereum", label: "Ethereum" },
          { value: "upi", label: "UPI" },
        ],
      },
      { key: "amount", label: "Amount", placeholder: "0.01", half: true },
      { key: "address", label: "Address / VPA", placeholder: "bc1q… or name@bank" },
    ],
  },
];

const esc = (value = "") => value.replace(/([\\;,:"])/g, "\\$1");

function toIcsDate(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

export function buildPayload(type: ContentType, f: ContentFields): string {
  switch (type) {
    case "url": {
      const raw = (f.url ?? "").trim();
      if (!raw) return "";
      return /^[a-zA-Z][\w+.-]*:/.test(raw) ? raw : `https://${raw}`;
    }
    case "text":
      return f.text ?? "";
    case "wifi":
      return `WIFI:T:${f.encryption || "WPA"};S:${esc(f.ssid)};P:${esc(f.password)};${
        f.hidden === "true" ? "H:true;" : ""
      };`;
    case "vcard":
      return [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `N:${esc(f.lastName)};${esc(f.firstName)}`,
        `FN:${[f.firstName, f.lastName].filter(Boolean).join(" ")}`,
        f.org ? `ORG:${esc(f.org)}` : "",
        f.title ? `TITLE:${esc(f.title)}` : "",
        f.phone ? `TEL;TYPE=CELL:${f.phone}` : "",
        f.email ? `EMAIL:${f.email}` : "",
        f.website ? `URL:${f.website}` : "",
        f.address ? `ADR:;;${esc(f.address)}` : "",
        "END:VCARD",
      ]
        .filter(Boolean)
        .join("\n");
    case "email":
      return `mailto:${f.to ?? ""}?subject=${encodeURIComponent(
        f.subject ?? "",
      )}&body=${encodeURIComponent(f.body ?? "")}`;
    case "sms":
      return `SMSTO:${f.phone ?? ""}:${f.message ?? ""}`;
    case "phone":
      return `tel:${f.phone ?? ""}`;
    case "geo":
      return `geo:${f.lat || "0"},${f.lng || "0"}`;
    case "event":
      return [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        `SUMMARY:${esc(f.title)}`,
        f.location ? `LOCATION:${esc(f.location)}` : "",
        f.start ? `DTSTART:${toIcsDate(f.start)}` : "",
        f.end ? `DTEND:${toIcsDate(f.end)}` : "",
        "END:VEVENT",
        "END:VCALENDAR",
      ]
        .filter(Boolean)
        .join("\n");
    case "crypto": {
      if (f.network === "upi") {
        return `upi://pay?pa=${f.address ?? ""}&am=${f.amount ?? ""}&cu=INR`;
      }
      const scheme = f.network === "ethereum" ? "ethereum" : "bitcoin";
      return `${scheme}:${f.address ?? ""}${f.amount ? `?amount=${f.amount}` : ""}`;
    }
    default:
      return "";
  }
}

export function defaultContent(type: ContentType): ContentFields {
  switch (type) {
    case "url":
      return { url: "https://codenium.qr/studio" };
    case "text":
      return { text: "Hello from Codenium ✨" };
    case "wifi":
      return { ssid: "Codenium-Guest", password: "scanme123", encryption: "WPA", hidden: "false" };
    case "vcard":
      return {
        firstName: "Ada",
        lastName: "Lovelace",
        org: "Codenium Labs",
        title: "Head of Design",
        phone: "+1 555 0100",
        email: "ada@codenium.dev",
        website: "https://codenium.dev",
        address: "",
      };
    case "email":
      return { to: "hello@codenium.dev", subject: "Hi Codenium", body: "I scanned your code!" };
    case "sms":
      return { phone: "+1 555 0100", message: "Hey!" };
    case "phone":
      return { phone: "+1 555 0100" };
    case "geo":
      return { lat: "37.7749", lng: "-122.4194" };
    case "event":
      return { title: "Product launch", location: "San Francisco", start: "", end: "" };
    case "crypto":
      return { network: "bitcoin", address: "bc1qexampleaddress", amount: "0.01" };
    default:
      return {};
  }
}

/** Rough capacity guard so users get a warning before the encoder fails. */
export function payloadWarning(payload: string, ecc: string): string | null {
  const limits: Record<string, number> = { L: 2953, M: 2331, Q: 1663, H: 1273 };
  const limit = limits[ecc] ?? 1273;
  if (!payload) return "Add some content to generate a code.";
  if (payload.length > limit) {
    return `Payload is ${payload.length} characters — the max for level ${ecc} is ${limit}.`;
  }
  if (payload.length > limit * 0.75) {
    return "Payload is very dense. Consider a dynamic short link for reliable scanning.";
  }
  return null;
}
