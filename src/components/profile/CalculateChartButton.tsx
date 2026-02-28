"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  birth_date: string;
  birth_time: string;
  birth_place: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

interface Props {
  profileId: string;
  profile: Profile;
  primary?: boolean;
}

export default function CalculateChartButton({ profileId, profile, primary }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          birthData: {
            name: profile.name,
            dateOfBirth: profile.birth_date,
            timeOfBirth: profile.birth_time,
            placeOfBirth: profile.birth_place,
            latitude: profile.latitude,
            longitude: profile.longitude,
            timezone: profile.timezone,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Calculation failed");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleCalculate}
        disabled={loading}
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition disabled:opacity-50
          ${primary
            ? "bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3"
            : "border border-border hover:bg-muted/50"
          }
        `}
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Calculating...</>
        ) : (
          <><RefreshCw className="w-4 h-4" /> {primary ? "Calculate Birth Chart" : "Recalculate"}</>
        )}
      </button>
      {error && (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
