import { ChartData } from "../astro-client";

export default function wealthPrompt(chartData: ChartData, language: "en" | "hi"): string {
  const { lagna, planets, houses, dashas, yogas } = chartData;

  const house2 = houses?.["2"];
  const house11 = houses?.["11"];
  const house2Lord = house2?.lord ? planets?.[house2.lord] : undefined;
  const house11Lord = house11?.lord ? planets?.[house11.lord] : undefined;

  return `
# Wealth & Fortune Horoscope Analysis

## Birth Chart Data
- Lagna: ${lagna?.sign || "Unknown"}
- 2nd House (Wealth): ${house2?.sign || "Unknown"}, Lord: ${house2?.lord || "Unknown"}, Position: ${house2Lord?.sign || "Unknown"} in ${house2Lord?.house ?? "?"}th
- 11th House (Gains): ${house11?.sign || "Unknown"}, Lord: ${house11?.lord || "Unknown"}, Position: ${house11Lord?.sign || "Unknown"} in ${house11Lord?.house ?? "?"}th
- Jupiter (Karaka): ${planets?.Jupiter?.sign || "Unknown"} in ${planets?.Jupiter?.house ?? "?"}th house, ${planets?.Jupiter?.nakshatra || "Unknown"}
- Venus (Luxury): ${planets?.Venus?.sign || "Unknown"} in ${planets?.Venus?.house ?? "?"}th house

## Dhana Yogas (Wealth Combinations)
${yogas?.filter(y => y.type === "dhana" || y.name?.includes("Wealth") || y.name?.includes("Dhana")).map(y => `- ${y.name}: ${y.description} (Strength: ${y.strength})`).join("\n") || "No specific dhana yogas detected"}

## Current Dasha
- ${dashas?.current?.mahadasha || "Unknown"} - ${dashas?.current?.antardasha || "Unknown"}

## Analysis Request
Provide comprehensive wealth and financial fortune analysis covering:

1. **Wealth Potential** - Overall capacity for wealth accumulation
2. **Primary Income Sources** - Career vs. investments vs. inheritance
3. **Financial Strengths** - Natural money-making abilities
4. **Financial Challenges** - Areas of potential loss or obstacles
5. **Best Wealth Periods** - Timing for major financial gains
6. **Investment Guidance** - Favorable investment types (real estate, stocks, business, etc.)
7. **Savings vs. Spending** - Natural tendencies and balance needed
8. **Current Period Analysis** - Financial outlook for active dasha
9. **Wealth Remedies** - Astrological recommendations for enhancing prosperity

Generate in ${language === "hi" ? "Hindi" : "English"}.
  `.trim();
}
