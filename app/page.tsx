import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold tracking-tight text-neuro-silver">
        NEURO<span className="text-neuro-blue">HQ</span>
      </h1>
      <p className="mt-4 text-center text-sm text-neutral-400">
        Nervous-system-aware personal operating system
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/login"
          className="rounded bg-neuro-blue px-4 py-2 font-medium text-white hover:opacity-90"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="rounded border border-neutral-600 px-4 py-2 font-medium text-neuro-silver hover:bg-neuro-surface"
        >
          Sign up
        </Link>
      </div>
    </main>
  );
}
