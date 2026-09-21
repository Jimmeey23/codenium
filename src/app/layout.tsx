import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Codenium — 3D QR Studio with smart landings",
  description:
    "Design stunning branded QR codes with real 3D extrusion, centre logos, expiry rules, smart device routing and hosted landing pages. Export to PNG, SVG, PDF, JPG and WEBP.",
  icons: { icon: "/brand/logo.png", apple: "/brand/logo.png" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#050505] font-sans text-white antialiased selection:bg-cyan-400/30">
        {children}
      </body>
    </html>
  );
}
