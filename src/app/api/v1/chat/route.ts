import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateChatResponse, buildSourcesMetadata } from "@/lib/rag/chat";
import { searchReportChunks } from "@/lib/rag/retriever";
import { z } from "zod";

const ChatSchema = z.object({
  profileId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  message: z.string().min(1).max(2000),
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
  const parseResult = ChatSchema.safeParse(body);
  if (!parseResult.success) {
    return new Response(
      JSON.stringify({ error: "Validation failed", issues: parseResult.error.issues }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { profileId, sessionId, message, provider, model } = parseResult.data;

  // Verify profile belongs to authenticated user
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

  // Get or create session, with ownership verification
  let currentSessionId = sessionId;
  if (currentSessionId) {
    // Verify session belongs to this profile (which belongs to the authenticated user)
    const { data: existingSession, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("id, profile_id")
      .eq("id", currentSessionId)
      .single();

    if (sessionError || !existingSession) {
      return new Response(JSON.stringify({ error: "Chat session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (existingSession.profile_id !== profileId) {
      return new Response(JSON.stringify({ error: "Session does not belong to this profile" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  } else {
    const { data: newSession } = await supabase
      .from("chat_sessions")
      .insert({
        profile_id: profileId,
        title: message.slice(0, 100),
      })
      .select()
      .single();

    currentSessionId = newSession?.id;
  }

  if (!currentSessionId) {
    return new Response(JSON.stringify({ error: "Failed to create chat session" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Fetch conversation history
  const { data: messages } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("session_id", currentSessionId)
    .order("created_at", { ascending: true })
    .limit(10);

  const conversationHistory = messages || [];

  // Retrieve search results for sources
  const searchResults = await searchReportChunks(profileId, message, 5);
  const sources = buildSourcesMetadata(searchResults);

  // Generate streaming response
  let stream: ReadableStream<Uint8Array>;
  try {
    stream = await generateChatResponse({
      profileId,
      chartData: profile.chart_data as any,
      query: message,
      conversationHistory: conversationHistory.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      provider,
      model,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Failed to generate chat response";
    return new Response(JSON.stringify({ error: errMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let fullResponse = "";

  // Transform stream to SSE format
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
                  fullResponse += content;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              } catch (e) {
                // Ignore parse errors for individual chunks
              }
            }
          }
        }

        // Send completion signal to client first
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ sources, sessionId: currentSessionId, done: true })}\n\n`)
        );
        controller.close();

        // Save messages to database (fire-and-forget after stream closes)
        supabase.from("chat_messages").insert([
          {
            session_id: currentSessionId,
            role: "user",
            content: message,
          },
          {
            session_id: currentSessionId,
            role: "assistant",
            content: fullResponse,
            sources,
            model_used: model || (provider === "openrouter" ? "google/gemini-2.0-flash" : "gemini-2.0-flash"),
          },
        ]).then(() => {}).catch((err: unknown) => console.error("[Chat] Save messages failed:", err));
      } catch (error) {
        console.error("[Chat] Stream processing error:", error);

        // Send error event to client via SSE
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", message: "Chat response generation failed" })}\n\n`
            )
          );
        } catch {
          // Controller may already be errored
        }
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
