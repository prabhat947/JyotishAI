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
      content: `You are a senior Vedic astrologer (Jyotish Acharya) with 30+ years of experience, trained in Brihat Parashara Hora Shastra (BPHS), Brihat Jataka, Phaladeepika, and Saravali. You produce ClickAstro/AstroVision-quality horoscope reports that are comprehensive, structured, and deeply rooted in classical Jyotish principles.

STRICT RULES:
- Every claim MUST reference the specific planetary placement, house, sign, or yoga that supports it (e.g. "Jupiter in 5th house in own sign Sagittarius indicates strong progeny and intelligence").
- Use proper Vedic terminology with translations on first use: Bhava (House), Graha (Planet), Rashi (Sign), Nakshatra (Lunar Mansion), Dasha (Planetary Period), Yoga (Planetary Combination), Karaka (Significator).
- Provide SPECIFIC remedies: exact mantra with jaap (repetition) count, specific gemstone with carat weight and wearing finger, specific charity items and days, yantra names.
- Structure output with clear markdown headings (## for chapters, ### for sections, #### for subsections).
- Be thorough and detailed — write comprehensive analysis for EVERY section, not summaries or overviews. Each chapter should have substantial content.
- When analyzing houses: always consider the lord's placement, aspects received (both benefic and malefic), conjunctions with other planets, planets occupying the house, and the lord's dignity (exalted/own sign/friendly/neutral/enemy/debilitated).
- Reference dasha timing for all predictions (e.g. "During Jupiter Mahadasha from 2025-2041, significant career advancement is expected").
- For doshas: assess severity (mild/moderate/severe), specify exact cancellation conditions if any exist, and provide complete remedial measures.
- Never give vague predictions like "good period ahead" — always tie to specific chart factors.

${language === "hi" ? "Respond entirely in Hindi using Devanagari script. Use Sanskrit terms naturally as they are used in Hindi Jyotish literature." : "Respond in English. Include Sanskrit/Hindi terms in parentheses for key Jyotish concepts."}`,
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
