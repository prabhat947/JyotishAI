import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const PatchAlertSchema = z.object({
  alertId: z.string().uuid(),
  is_read: z.boolean(),
});

export async function GET(request: NextRequest) {
  const supabase = await createServerClient();

  // Explicit auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const profileId = searchParams.get("profileId");

  // If profileId is provided, verify it belongs to the authenticated user
  if (profileId) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", profileId)
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
  }

  // Fetch alerts scoped to user's profiles
  let query = supabase
    .from("transit_alerts")
    .select("*, profiles!inner(user_id)")
    .eq("profiles.user_id", user.id)
    .order("created_at", { ascending: false });

  if (profileId) {
    query = query.eq("profile_id", profileId);
  }

  const { data: alerts, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(alerts);
}

export async function PATCH(request: NextRequest) {
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

  // Zod validation — only is_read is updatable
  const parseResult = PatchAlertSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parseResult.error.issues },
      { status: 400 }
    );
  }

  const { alertId, is_read } = parseResult.data;

  // Verify alert belongs to a profile owned by the authenticated user
  const { data: alert, error: alertError } = await supabase
    .from("transit_alerts")
    .select("id, profile_id, profiles!inner(user_id)")
    .eq("id", alertId)
    .eq("profiles.user_id", user.id)
    .single();

  if (alertError || !alert) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  // Update only the is_read field (prevents mass-assignment)
  const { data, error } = await supabase
    .from("transit_alerts")
    .update({ is_read })
    .eq("id", alertId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
