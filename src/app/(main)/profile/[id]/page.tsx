import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CalculateChartButton from "@/components/profile/CalculateChartButton";
import ProfileChartTabs from "@/components/profile/ProfileChartTabs";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) {
    notFound();
  }

  const chart = profile.chart_data as Record<string, unknown> | null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/dashboard"
          className="p-2 rounded-md hover:bg-muted/50 transition text-muted-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-0.5">{profile.name}</h1>
          <p className="text-muted-foreground text-sm">
            {profile.relation && (
              <span className="inline-block mr-2 px-2 py-0.5 rounded-full text-xs bg-secondary/20 text-secondary">
                {profile.relation}
              </span>
            )}
            Birth Chart &amp; Analysis
          </p>
        </div>
        {/* Navigation links */}
        {chart && (
          <div className="flex gap-2">
            <Link
              href={`/profile/${id}/reports`}
              className="px-4 py-2 rounded-md border border-border hover:bg-muted/50 transition text-sm font-medium"
            >
              Reports
            </Link>
            <Link
              href={`/profile/${id}/chat`}
              className="px-4 py-2 rounded-md border border-border hover:bg-muted/50 transition text-sm font-medium"
            >
              AI Chat
            </Link>
          </div>
        )}
      </div>

      {/* Birth Details */}
      <div className="glass rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Birth Details</h2>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <dt className="text-xs text-muted-foreground mb-1">Date of Birth</dt>
            <dd className="font-medium">{new Date(profile.birth_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground mb-1">Time of Birth</dt>
            <dd className="font-medium">{profile.birth_time}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground mb-1">Place of Birth</dt>
            <dd className="font-medium">{profile.birth_place}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground mb-1">Coordinates</dt>
            <dd className="font-medium text-sm">{profile.latitude}°N, {profile.longitude}°E</dd>
          </div>
        </dl>
      </div>

      {chart ? (
        <>
          {/* Lagna & Key Points */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {(chart.planets as Array<{ name: string; sign: string; nakshatra?: string; house?: number }> | undefined)
              ?.filter((p) => ["Ascendant", "Moon", "Sun"].includes(p.name))
              .map((p) => (
                <div key={p.name} className="glass rounded-lg p-5">
                  <p className="text-xs text-muted-foreground mb-1">{p.name === "Ascendant" ? "Lagna (Ascendant)" : p.name}</p>
                  <p className="text-2xl font-bold text-primary">{p.sign}</p>
                  {p.nakshatra && (
                    <p className="text-sm text-muted-foreground mt-1">{p.nakshatra}</p>
                  )}
                  {p.house && (
                    <p className="text-xs text-muted-foreground">House {p.house}</p>
                  )}
                </div>
              ))}
          </div>

          {/* Tabbed Visualization Section */}
          <ProfileChartTabs chartData={chart} profileId={id} />

          {/* Action links */}
          <div className="flex gap-3 mt-6">
            <CalculateChartButton profileId={profile.id} profile={profile} />
            <Link
              href={`/profile/${id}/reports`}
              className="px-4 py-2 rounded-md border border-border hover:bg-muted/50 transition text-sm"
            >
              Generate Full Report
            </Link>
          </div>
        </>
      ) : (
        <div className="glass rounded-lg p-12 text-center">
          <p className="text-muted-foreground mb-6">
            Chart not yet calculated. Click below to generate the Vedic birth chart.
          </p>
          <CalculateChartButton profileId={profile.id} profile={profile} primary />
        </div>
      )}
    </div>
  );
}
