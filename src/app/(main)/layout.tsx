import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MainShell from "@/components/layout/MainShell";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <MainShell>{children}</MainShell>;
}
