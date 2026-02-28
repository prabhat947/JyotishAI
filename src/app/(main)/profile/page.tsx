import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProfileIndexPage() {
  const supabase = await createServerClient();

  // Redirect to first profile, or dashboard if none exist
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1);

  if (profiles && profiles.length > 0) {
    redirect(`/profile/${profiles[0].id}`);
  }

  redirect("/dashboard");
}
