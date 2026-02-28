/**
 * Report generation with multi-provider streaming (Google Gemini / OpenRouter)
 */

import { ChartData } from "./astro-client";
import { createStreamingCompletion, resolveConfig } from "./llm/provider";
import type { LLMProvider } from "./llm/constants";

export interface ReportGenerationOptions {
  profileId: string;
  reportType: string;
  language: "en" | "hi";
  provider?: LLMProvider;
  model?: string;
  chartData: ChartData;
}

/**
 * Generate streaming report via the configured LLM provider.
 * Returns a ReadableStream for SSE — the format is identical
 * regardless of whether Google or OpenRouter is used.
 */
export async function generateStreamingReport(
  options: ReportGenerationOptions
): Promise<ReadableStream<Uint8Array>> {
  const { reportType, language, provider, model, chartData } = options;

  // Import the appropriate prompt template
  const prompt = await getReportPrompt(reportType, chartData, language);

  const config = resolveConfig({ provider, model });

  return createStreamingCompletion(config, [
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
  ]);
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
