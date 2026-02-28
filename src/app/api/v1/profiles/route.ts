import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const CreateProfileSchema = z.object({
  name: z.string().min(1).max(100),
  relation: z.enum(["self", "spouse", "parent", "child", "sibling", "other"]).optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "birth_date must be YYYY-MM-DD"),
  birth_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "birth_time must be HH:MM or HH:MM:SS"),
  birth_place: z.string().min(1).max(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().min(1),
  avatar_url: z.string().url().optional(),
});

export async function GET(request: NextRequest) {
  const supabase = await createServerClient();

  // Explicit auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(profiles);
}

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
  const parseResult = CreateProfileSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parseResult.error.issues },
      { status: 400 }
    );
  }

  // Destructure only allowed fields (prevents mass-assignment)
  const { name, relation, birth_date, birth_time, birth_place, latitude, longitude, timezone, avatar_url } = parseResult.data;

  const { data: profile, error } = await supabase
    .from("profiles")
    .insert({
      user_id: user.id,
      name,
      relation,
      birth_date,
      birth_time,
      birth_place,
      latitude,
      longitude,
      timezone,
      avatar_url,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(profile, { status: 201 });
}
