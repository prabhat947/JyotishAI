"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, MapPin } from "lucide-react";
import Link from "next/link";

const RELATIONS = [
  { label: "Self", value: "self" },
  { label: "Spouse", value: "spouse" },
  { label: "Parent", value: "parent" },
  { label: "Child", value: "child" },
  { label: "Sibling", value: "sibling" },
  { label: "Other", value: "other" },
];

interface GeoResult {
  latitude: number;
  longitude: number;
  timezone: string;
  display_name: string;
}

async function geocodePlace(place: string): Promise<GeoResult | null> {
  try {
    // Nominatim geocode
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const geoData = await geoRes.json();
    if (!geoData.length) return null;

    const { lat, lon, display_name } = geoData[0];
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    // Timezone lookup via timeapi.io (free, no key)
    const tzRes = await fetch(
      `https://timeapi.io/api/timezone/coordinate?latitude=${latitude}&longitude=${longitude}`
    );
    const tzData = await tzRes.json();
    const timezone = tzData.timeZone ?? "Asia/Kolkata";

    return { latitude, longitude, timezone, display_name };
  } catch {
    return null;
  }
}

export default function NewProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    relation: "self",
    birth_date: "",
    birth_time: "",
    birth_place: "",
    latitude: "",
    longitude: "",
    timezone: "Asia/Kolkata",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleGeocode = async () => {
    if (!form.birth_place.trim()) return;
    setGeoLoading(true);
    setError(null);
    const result = await geocodePlace(form.birth_place);
    if (result) {
      setForm((f) => ({
        ...f,
        latitude: result.latitude.toFixed(4),
        longitude: result.longitude.toFixed(4),
        timezone: result.timezone,
        birth_place: result.display_name.split(",").slice(0, 2).join(",").trim(),
      }));
    } else {
      setError("Could not find that place. Please check the name or enter coordinates manually.");
    }
    setGeoLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.latitude || !form.longitude) {
      setError("Please geocode the birth place first (click the pin icon).");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          relation: form.relation,
          birth_date: form.birth_date,
          birth_time: form.birth_time,
          birth_place: form.birth_place,
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
          timezone: form.timezone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create profile");

      // Auto-calculate chart immediately after creation
      await fetch("/api/v1/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: data.id,
          birthData: {
            name: form.name,
            dateOfBirth: form.birth_date,
            timeOfBirth: form.birth_time,
            placeOfBirth: form.birth_place,
            latitude: parseFloat(form.latitude),
            longitude: parseFloat(form.longitude),
            timezone: form.timezone,
          },
        }),
      });

      router.push(`/profile/${data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/dashboard"
          className="p-2 rounded-md hover:bg-muted/50 transition text-muted-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Add Profile</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Enter birth details to generate a Vedic chart
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-lg p-8 space-y-5">

        {/* Name + Relation */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Prabhat"
              className="w-full px-3 py-2 rounded-md bg-muted/30 border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Relation</label>
            <select
              value={form.relation}
              onChange={(e) => set("relation", e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-muted/30 border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {RELATIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date + Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Date of Birth *</label>
            <input
              type="date"
              required
              value={form.birth_date}
              onChange={(e) => set("birth_date", e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-muted/30 border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Time of Birth *</label>
            <input
              type="time"
              required
              value={form.birth_time}
              onChange={(e) => set("birth_time", e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-muted/30 border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Birth Place */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Birth Place *</label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={form.birth_place}
              onChange={(e) => set("birth_place", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleGeocode())}
              placeholder="e.g. Raipur, Chhattisgarh, India"
              className="flex-1 px-3 py-2 rounded-md bg-muted/30 border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              type="button"
              onClick={handleGeocode}
              disabled={geoLoading || !form.birth_place.trim()}
              title="Auto-detect coordinates"
              className="px-3 py-2 rounded-md bg-secondary/20 hover:bg-secondary/30 border border-border transition disabled:opacity-50"
            >
              {geoLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Type city name then click 📍 to auto-fill coordinates
          </p>
        </div>

        {/* Coordinates */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Latitude</label>
            <input
              type="number"
              step="0.0001"
              value={form.latitude}
              onChange={(e) => set("latitude", e.target.value)}
              placeholder="21.1458"
              className="w-full px-3 py-2 rounded-md bg-muted/30 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Longitude</label>
            <input
              type="number"
              step="0.0001"
              value={form.longitude}
              onChange={(e) => set("longitude", e.target.value)}
              placeholder="81.3824"
              className="w-full px-3 py-2 rounded-md bg-muted/30 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Timezone</label>
            <input
              type="text"
              value={form.timezone}
              onChange={(e) => set("timezone", e.target.value)}
              placeholder="Asia/Kolkata"
              className="w-full px-3 py-2 rounded-md bg-muted/30 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating profile...
            </>
          ) : (
            "Create Profile & Calculate Chart"
          )}
        </button>
      </form>
    </div>
  );
}
