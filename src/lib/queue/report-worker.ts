/**
 * BullMQ worker for PDF report generation
 * Run with: npm run worker
 */

import { Worker } from "bullmq";
import { createClient } from "@supabase/supabase-js";
import { redisConnection } from "./connection";

const ASTRO_ENGINE_URL = process.env.ASTRO_ENGINE_URL || "http://localhost:8000";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const worker = new Worker(
  "report-generation",
  async (job) => {
    console.log(`Processing job ${job.id}: ${job.name}`);

    if (job.name === "generate-pdf") {
      const { reportId } = job.data;

      // Fetch report content from database
      const { data: report, error } = await supabase
        .from("reports")
        .select("*, profiles(name)")
        .eq("id", reportId)
        .single();

      if (error || !report) {
        throw new Error(`Report not found: ${reportId}`);
      }

      if (!report.content) {
        throw new Error(`Report ${reportId} has no content yet`);
      }

      const profileName = (report.profiles as any)?.name || "Unknown";
      const reportType = report.report_type || "general";

      // Generate PDF via astro-engine — payload matches ReportRequest schema
      const pdfResponse = await fetch(`${ASTRO_ENGINE_URL}/pdf/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${reportType.replace(/_/g, " ").toUpperCase()} \u2014 ${profileName}`,
          content: report.content,
          author: "JyotishAI",
          subject: `Vedic Astrology Report \u2014 ${reportType}`,
        }),
      });

      if (!pdfResponse.ok) {
        const errText = await pdfResponse.text();
        throw new Error(`PDF generation failed (${pdfResponse.status}): ${errText}`);
      }

      const pdfBuffer = await pdfResponse.arrayBuffer();

      // Upload to Supabase Storage
      const fileName = `reports/${reportId}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("reports")
        .upload(fileName, Buffer.from(pdfBuffer), {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`PDF upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("reports").getPublicUrl(fileName);

      // Update report with PDF URL
      await supabase
        .from("reports")
        .update({
          pdf_url: publicUrl,
          pdf_generated_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      console.log(`PDF generated for report ${reportId}: ${publicUrl}`);
      return { success: true, pdfUrl: publicUrl };
    }
  },
  { connection: redisConnection }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

console.log("Report worker started");
