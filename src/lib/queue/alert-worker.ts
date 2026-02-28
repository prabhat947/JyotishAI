/**
 * BullMQ worker for transit alert generation
 * Run with: npm run alert-worker
 */

import { Worker } from "bullmq";
import { createClient } from "@supabase/supabase-js";
import { getCurrentTransits, getTransitsVsNatal } from "../astro-client";
import { redisConnection } from "./connection";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Alert orb threshold in degrees — aspects tighter than this trigger alerts
const ALERT_ORB_THRESHOLD = 2.0;

const worker = new Worker(
  "transit-alerts",
  async (job) => {
    console.log(`Processing alert job ${job.id}`);

    if (job.name === "generate-alerts") {
      const { profileId } = job.data;

      // Fetch profile with chart data
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .single();

      if (error || !profile) {
        throw new Error(`Profile not found: ${profileId}`);
      }

      // Skip profiles without chart data
      if (!profile.chart_data) {
        console.log(`Skipping profile ${profileId}: no chart data`);
        return { success: true, alertCount: 0, skipped: true };
      }

      // Get current transits
      const transits = await getCurrentTransits();

      // Calculate aspects between transits and natal chart
      const aspects = await getTransitsVsNatal(profile.chart_data, transits);

      // Filter significant aspects by orb threshold only
      // Note: the astro-engine does not return an `applying` field reliably,
      // so we filter purely on orb tightness.
      const significantAspects = aspects.filter(
        (aspect) => Math.abs(aspect.orb) <= ALERT_ORB_THRESHOLD
      );

      // Create alert for each significant aspect
      for (const aspect of significantAspects) {
        const alertTitle = `${aspect.transiting_planet} ${aspect.aspect_type} Natal ${aspect.natal_planet}`;
        const alertContent = `Transiting ${aspect.transiting_planet} is forming a ${aspect.aspect_type} aspect with your natal ${aspect.natal_planet}. Orb: ${aspect.orb.toFixed(2)}\u00B0`;

        await supabase.from("transit_alerts").insert({
          profile_id: profileId,
          alert_type: "planet_transit",
          title: alertTitle,
          content: alertContent,
          trigger_date: new Date().toISOString().split("T")[0],
          planet: aspect.transiting_planet,
          natal_planet: aspect.natal_planet,
          orb: aspect.orb,
        });
      }

      console.log(
        `Generated ${significantAspects.length} alerts for profile ${profileId}`
      );
      return { success: true, alertCount: significantAspects.length };
    }
  },
  { connection: redisConnection }
);

worker.on("completed", (job) => {
  console.log(`Alert job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Alert job ${job?.id} failed:`, err.message);
});

console.log("Alert worker started");
