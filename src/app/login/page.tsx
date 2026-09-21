import Link from "next/link";
import { Suspense } from "react";
import { AuthBackdrop } from "@/components/auth/AuthBackdrop";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata = { title: "Sign in — Codenium" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const raw = params.next ?? "/dashboard";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <AuthBackdrop />
      <div className="relative flex w-full max-w-md flex-col items-center">
        <Suspense>
          <AuthForm next={next} initialError={params.error} />
        </Suspense>
        <Link
          href="/"
          className="mt-6 text-xs font-medium text-white/35 transition hover:text-white/70"
        >
          ← Back to the studio
        </Link>
      </div>
    </main>
  );
}
