import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-[#0d1117]">
      <div className="mx-auto flex min-h-screen max-w-[420px] flex-col items-center justify-center p-6">
        <div className="card-modern w-full max-w-[360px] p-8 text-center">
          <Image src="/app-icon.png" alt="" width={64} height={64} className="mx-auto h-16 w-16 rounded-lg object-contain" priority />
          <Image src="/logo-naam.png" alt="NEUROHQ" width={180} height={48} className="mx-auto mt-4 h-10 w-auto object-contain" priority />
          <p className="mt-2 text-xs font-medium uppercase tracking-wider text-neuro-muted">Your daily HQ</p>
          <p className="mt-4 text-sm text-neuro-muted">
            The place you open every day. Tasks, energy, learning, finances.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/login" className="btn-primary inline-flex items-center justify-center px-5 py-2.5 text-sm">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg border border-neuro-border bg-transparent px-5 py-2.5 text-sm font-medium text-neuro-silver hover:bg-neuro-border/50"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
