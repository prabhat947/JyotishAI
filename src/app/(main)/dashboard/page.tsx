import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import DashboardProfileGrid from "@/components/dashboard/DashboardProfileGrid";

export default async function DashboardPage() {
  const supabase = await createServerClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Family Profiles</h1>
          <p className="text-muted-foreground">
            Manage birth charts for your family members
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition"
        >
          <Plus className="w-4 h-4" />
          Add Profile
        </Link>
      </div>

      {profiles && profiles.length > 0 ? (
        <DashboardProfileGrid profiles={profiles} />
      ) : (
        <div className="glass rounded-lg p-12 text-center">
          <p className="text-muted-foreground mb-4">
            No profiles yet. Add your first family member to get started.
          </p>
          <Link
            href="/dashboard/new"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition"
          >
            <Plus className="w-5 h-5" />
            Add First Profile
          </Link>
        </div>
      )}
    </div>
  );
}
