import { buildIsoScene, buildMatrix, clearCenter, isoSceneToSvg } from "@/lib/iso3d";
import { cloneDesign, type Ecc } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Server-rendered isometric 3D QR code as SVG — handy for emails, embeds and OG images.
 * e.g. /api/qr?data=https://example.com&from=%237c3aed&to=%2322d3ee&size=800
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const data = url.searchParams.get("data") ?? url.origin;
  const size = Math.min(2400, Math.max(200, Number(url.searchParams.get("size") ?? 800)));
  const ecc = (url.searchParams.get("ecc") ?? "H") as Ecc;
  const logo = url.searchParams.get("logo") !== "0";

  const design = cloneDesign({
    engine: "iso3d",
    size,
    ecc: ["L", "M", "Q", "H"].includes(ecc) ? ecc : "H",
    bgTransparent: url.searchParams.get("bg") === "none",
    logoEnabled: logo,
  });
  design.iso.topFrom = url.searchParams.get("from") ?? design.iso.topFrom;
  design.iso.topTo = url.searchParams.get("to") ?? design.iso.topTo;
  design.iso.heightMode =
    (url.searchParams.get("profile") as typeof design.iso.heightMode) ?? design.iso.heightMode;

  let matrix = buildMatrix(data, design.ecc);
  if (logo) matrix = clearCenter(matrix, design.logoSize + 0.06);
  const scene = buildIsoScene(matrix, design.iso, size, design.margin, logo ? design.logoSize : null);
  const svg = isoSceneToSvg(scene, design, logo ? `${url.origin}/brand/logo.png` : null);

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
