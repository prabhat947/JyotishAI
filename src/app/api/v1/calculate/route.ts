import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { calculateChart } from "@/lib/astro-client";
import { z } from "zod";

const CalculateSchema = z.object({
  profileId: z.string().uuid(),
  birthData: z.object({
    name: z.string().min(1),
    dateOfBirth: z.string(),
    timeOfBirth: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
    placeOfBirth: z.string().min(1),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    timezone: z.string().min(1),
  }),
});

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();

  // Explicit auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Zod validation
  const parseResult = CalculateSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parseResult.error.issues },
      { status: 400 }
    );
  }

  const { profileId, birthData } = parseResult.data;

  try {
    // Verify profile belongs to user (defense-in-depth)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", profileId)
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Calculate chart via astro-engine (map camelCase Zod fields → snake_case BirthData)
    const chartData = await calculateChart({
      name: birthData.name,
      birth_date: birthData.dateOfBirth,
      birth_time: birthData.timeOfBirth,
      latitude: birthData.latitude,
      longitude: birthData.longitude,
      timezone: birthData.timezone,
    });

    // Update profile with calculated chart
    const { error } = await supabase
      .from("profiles")
      .update({
        chart_data: chartData as unknown as import("@/lib/supabase/types").Json,
        chart_calculated_at: new Date().toISOString(),
      })
      .eq("id", profileId)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, chartData });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Chart calculation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
