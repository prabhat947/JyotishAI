"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import type { PlanetName } from "@/types/astro";
import { PLANET_COLORS } from "@/types/astro";

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

interface TransitPlanet {
  sign: string;
  sign_num: number;
  degrees: number;
  nakshatra: string;
  pada: number;
  retrograde: boolean;
  lord: string;
}

const planetOrder: PlanetName[] = [
  "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu",
];

export default function TransitsPage() {
  const [transits, setTransits] = useState<Record<string, TransitPlanet> | null>(null);
  const [transitDate, setTransitDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransits = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/transits");
      if (!res.ok) throw new Error("Failed to fetch transits");
      const data = await res.json();

      // Engine returns planets as an array — convert to keyed object and map field names
      const planetsArray: any[] = data.planets || [];
      const mapped: Record<string, TransitPlanet> = {};
      for (const p of planetsArray) {
        mapped[p.name] = {
          sign: p.sign,
          sign_num: p.sign_num ?? 0,
          degrees: p.degree_in_sign ?? p.degrees ?? 0,
          nakshatra: p.nakshatra,
          pada: p.pada,
          retrograde: p.is_retrograde ?? p.retrograde ?? false,
          lord: p.sign_lord ?? p.lord ?? "",
        };
      }
      setTransits(mapped);
      setTransitDate(data.calculated_at || data.date || new Date().toISOString().split("T")[0]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load transits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransits();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Current Transits</h1>
          <p className="text-muted-foreground">
            Real-time planetary positions
            {transitDate && ` — ${new Date(transitDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`}
          </p>
        </div>
        <button
          onClick={fetchTransits}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-md border border-border hover:bg-muted/50 transition text-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="glass rounded-lg p-8 text-center">
          <p className="text-red-400 mb-2">{error}</p>
          <p className="text-muted-foreground text-sm">
            Make sure the astro-engine is running on the configured port.
          </p>
        </div>
      ) : transits ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {planetOrder.map((name) => {
              const planet = transits[name];
              if (!planet) return null;
              return (
                <div
                  key={name}
                  className="glass rounded-lg p-5 border-l-4"
                  style={{ borderLeftColor: PLANET_COLORS[name] }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg" style={{ color: PLANET_COLORS[name] }}>
                      {name}
                      {planet.retrograde && (
                        <span className="ml-2 text-xs text-red-400 font-normal">Rx</span>
                      )}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {planet.degrees.toFixed(2)}°
                    </span>
                  </div>
                  <p className="text-xl font-bold mb-1">{planet.sign}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{planet.nakshatra} (Pada {planet.pada})</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Lord: {planet.lord}</p>
                </div>
              );
            })}
          </div>

          <div className="glass rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Sign Distribution</h2>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
              {ZODIAC_SIGNS.map((sign) => {
                const planetsInSign = planetOrder.filter(
                  (name) => transits[name]?.sign === sign
                );
                return (
                  <div
                    key={sign}
                    className={`p-3 rounded-lg text-center text-sm ${
                      planetsInSign.length > 0
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-muted/20 border border-border"
                    }`}
                  >
                    <p className="font-medium text-xs mb-1">{sign}</p>
                    <div className="flex flex-wrap justify-center gap-1">
                      {planetsInSign.map((name) => (
                        <span
                          key={name}
                          className="text-xs px-1 rounded"
                          style={{ color: PLANET_COLORS[name] }}
                        >
                          {name.substring(0, 2)}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
