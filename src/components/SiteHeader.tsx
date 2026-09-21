import Image from "next/image";
import Link from "next/link";

export function SiteHeader({ active }: { active?: "studio" | "dashboard" }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#05040f]/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <span className="relative">
            <span className="absolute -inset-1.5 rounded-xl bg-violet-500/30 blur-md transition group-hover:bg-violet-400/50" />
            <Image
              src="/brand/logo.png"
              alt="Codenium"
              width={40}
              height={40}
              className="relative h-9 w-9 rounded-xl bg-white object-contain p-1 ring-1 ring-white/15"
              priority
            />
          </span>
          <span>
            <span className="block text-sm font-bold leading-tight tracking-tight text-white">
              Codenium
            </span>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-white/35">
              3D QR Studio
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1.5">
          <Link
            href="/"
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${
              active === "studio"
                ? "bg-white/10 text-white"
                : "text-white/55 hover:bg-white/5 hover:text-white"
            }`}
          >
            Studio
          </Link>
          <Link
            href="/dashboard"
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${
              active === "dashboard"
                ? "bg-white/10 text-white"
                : "text-white/55 hover:bg-white/5 hover:text-white"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/#studio"
            className="btn-primary ml-1 rounded-xl px-4 py-2 text-xs font-semibold text-white sm:text-sm"
          >
            New code
          </Link>
        </nav>
      </div>
    </header>
  );
}
