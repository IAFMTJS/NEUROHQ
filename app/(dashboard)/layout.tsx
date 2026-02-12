import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ensureUserProfile } from "@/app/actions/auth";
import { AppHeader, BottomNav } from "@/components/DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await ensureUserProfile(user.id, user.email);

  return (
    <div className="min-h-screen bg-neuro-dark">
      <div className="mx-auto flex min-h-screen max-w-[420px] flex-col bg-neuro-dark md:min-h-[640px]">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AppHeader />
        <main id="main-content" className="main-with-footer flex-1 overflow-auto p-4" tabIndex={-1}>
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
