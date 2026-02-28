import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getCurrentTransits } from "@/lib/astro-client";

export async function GET(request: NextRequest) {
  const supabase = await createServerClient();

  // Explicit auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const transits = await getCurrentTransits();
    return NextResponse.json(transits);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch transits";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
