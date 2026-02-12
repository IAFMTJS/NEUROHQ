import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-neuro-silver">Settings</h1>
      <div className="rounded-lg border border-neutral-700 bg-neuro-surface p-4">
        <h2 className="text-sm font-medium text-neuro-silver">Account</h2>
        <p className="mt-2 text-sm text-neutral-400">{user.email}</p>
      </div>
      <div className="rounded-lg border border-neutral-700 bg-neuro-surface p-4">
        <h2 className="text-sm font-medium text-neuro-silver">About</h2>
        <p className="mt-2 text-sm text-neutral-400">
          NEUROHQ — nervous-system-aware personal operating system. Version 1.0.0.
        </p>
      </div>
    </div>
  );
}
