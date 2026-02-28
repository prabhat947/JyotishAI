/**
 * Report generation with OpenRouter streaming
 */

import { ChartData } from "./astro-client";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

export interface ReportGenerationOptions {
  profileId: string;
  reportType: string;
  language: "en" | "hi";
  model?: string;
  chartData: ChartData;
}

/**
 * Generate streaming report via OpenRouter
 * Returns a ReadableStream for SSE
 */
export async function generateStreamingReport(
  options: ReportGenerationOptions
): Promise<ReadableStream<Uint8Array>> {
  const { reportType, language, model, chartData } = options;

  // Import the appropriate prompt template
  const prompt = await getReportPrompt(reportType, chartData, language);

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "JyotishAI",
    },
    body: JSON.stringify({
      model: model || "anthropic/claude-sonnet-4-5",
      messages: [
        {
          role: "system",
          content: `You are an expert Vedic astrologer. Generate detailed, insightful horoscope reports based on birth chart data. ${
            language === "hi" ? "Respond in Hindi." : "Respond in English."
          }`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`);
  }

  return response.body!;
}

/**
 * Get report prompt for a specific report type
 */
async function getReportPrompt(
  reportType: string,
  chartData: ChartData,
  language: "en" | "hi"
): Promise<string> {
  // Dynamically import the appropriate prompt template
  const promptModule = await import(`./report-prompts/${reportType}`);
  return promptModule.default(chartData, language);
}
