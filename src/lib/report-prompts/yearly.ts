import { ChartData } from "../astro-client";

export default function yearlyPrompt(chartData: ChartData, language: "en" | "hi"): string {
  const currentYear = new Date().getFullYear();
  const { lagna, planets, dashas } = chartData;

  return `
# ${currentYear} Yearly Horoscope

## Birth Chart Summary
- Lagna: ${lagna?.sign || "Unknown"}
- Sun: ${planets?.Sun?.sign || "Unknown"} in ${planets?.Sun?.house || "?"}th house
- Moon: ${planets?.Moon?.sign || "Unknown"} in ${planets?.Moon?.house || "?"}th house, ${planets?.Moon?.nakshatra || "Unknown"}

## Current Dasha Period (${currentYear})
- Mahadasha: ${dashas?.current?.mahadasha || "Unknown"}
- Antardasha: ${dashas?.current?.antardasha || "Unknown"}
- Period: ${dashas?.current?.antardasha_start || "?"} to ${dashas?.current?.antardasha_end || "?"}

## Major Planetary Positions
${planets ? Object.entries(planets).map(([name, data]) => `- ${name}: ${data?.sign || "?"} (${data?.house || "?"}th house)`).join("\n") : "Not available"}

## Analysis Request
Provide a detailed year-by-year forecast for ${currentYear} covering:

1. **Overall Theme** - Main focus areas for the year
2. **Month-by-Month Highlights** - Key events and periods to watch
3. **Career & Profession** - Work-related developments
4. **Finance & Wealth** - Income, expenses, investments
5. **Health & Vitality** - Physical and mental well-being
6. **Relationships & Family** - Personal life dynamics
7. **Opportunities & Challenges** - What to pursue and what to avoid
8. **Important Dates** - Auspicious and inauspicious periods
9. **Yearly Remedies** - Specific recommendations for ${currentYear}

Generate in ${language === "hi" ? "Hindi" : "English"}.
  `.trim();
}
