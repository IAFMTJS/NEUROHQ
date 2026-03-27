import { redirect } from "next/navigation";
import { profileSettingsHref } from "@/lib/profile-routes";

export const dynamic = "force-dynamic";

/** Instellingen staan onder Profiel (`/profile?view=settings`). */
export default function SettingsPage() {
  redirect(profileSettingsHref("system"));
}
