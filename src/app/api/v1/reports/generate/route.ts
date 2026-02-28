import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateStreamingReport } from "@/lib/report-generator";
import { chunkText, extractSectionTitle } from "@/lib/rag/chunker";
import { embedBatch } from "@/lib/rag/embedder";
import { enqueuePDFGeneration } from "@/lib/queue/queues";
import { z } from "zod";

const GenerateReportSchema = z.object({
  profileId: z.string().uuid(),
  reportType: z.enum([
    "in_depth",
    "career",
    "wealth",
    "yearly",
    "transit_jupiter",
    "transit_saturn",
    "transit_rahu_ketu",
    "numerology",
    "gem_recommendation",
  ]),
  language: z.enum(["en", "hi"]).default("en"),
  provider: z.enum(["google", "openrouter"]).optional(),
  model: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();

  // Explicit auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Zod validation
  const parseResult = GenerateReportSchema.safeParse(body);
  if (!parseResult.success) {
    return new Response(
      JSON.stringify({ error: "Validation failed", issues: parseResult.error.issues }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { profileId, reportType, language, provider, model } = parseResult.data;

  // Fetch profile with chart data — scoped to authenticated user
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    return new Response(JSON.stringify({ error: "Profile not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!profile.chart_data) {
    return new Response(JSON.stringify({ error: "Chart data not found. Calculate chart first." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Create report record with 'generating' status
  const { data: report, error: reportError } = await supabase
    .from("reports")
    .insert({
      profile_id: profileId,
      report_type: reportType,
      language,
      model_used: model || (provider === "openrouter" ? "google/gemini-2.0-flash" : "gemini-2.0-flash"),
      generation_status: "generating",
    })
    .select()
    .single();

  if (reportError) {
    return new Response(JSON.stringify({ error: reportError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Generate streaming report
  let stream: ReadableStream<Uint8Array>;
  try {
    stream = await generateStreamingReport({
      profileId,
      reportType,
      language,
      provider,
      model,
      chartData: profile.chart_data as any,
    });
  } catch (error: unknown) {
    // Mark report as failed if stream cannot be created
    await supabase
      .from("reports")
      .update({ generation_status: "failed" })
      .eq("id", report.id);

    const message = error instanceof Error ? error.message : "Failed to start report generation";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let fullContent = "";

  // Transform stream to SSE format and collect content
  const encoder = new TextEncoder();
  const transformedStream = new ReadableStream({
    async start(controller) {
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((line) => line.trim() !== "");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const json = JSON.parse(data);
                const content = json.choices[0]?.delta?.content;
                if (content) {
                  fullContent += content;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              } catch (e) {
                // Ignore parse errors for individual chunks
              }
            }
          }
        }

        // Save full content and chunk for RAG
        await saveReportContent(supabase, report.id, profileId, fullContent, reportType);

        // Enqueue PDF generation
        await enqueuePDFGeneration(report.id);

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        // Send error event to client via SSE
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", message: "Report generation failed" })}\n\n`
            )
          );
        } catch {
          // Controller may already be errored
        }

        // Mark report as failed in database
        await supabase
          .from("reports")
          .update({ generation_status: "failed" })
          .eq("id", report.id);

        controller.close();
      }
    },
  });

  return new Response(transformedStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

async function saveReportContent(
  supabase: any,
  reportId: string,
  profileId: string,
  content: string,
  reportType: string
) {
  // Update report with content and mark as complete
  await supabase
    .from("reports")
    .update({
      content,
      generation_status: "complete",
    })
    .eq("id", reportId);

  // Chunk and embed for RAG
  const chunks = chunkText(content, reportType);

  // Extract embeddings
  const texts = chunks.map((c) => c.content);
  const embeddings = await embedBatch(texts);

  // Insert chunks with embeddings
  const chunkRecords = chunks.map((chunk, idx) => ({
    report_id: reportId,
    profile_id: profileId,
    chunk_index: chunk.index,
    content: chunk.content,
    embedding: embeddings[idx],
    metadata: {
      ...chunk.metadata,
      section_title: extractSectionTitle(chunk.content),
    },
  }));

  await supabase.from("report_chunks").insert(chunkRecords);
}
