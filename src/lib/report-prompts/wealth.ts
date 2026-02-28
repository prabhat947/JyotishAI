import { ChartData } from "../astro-client";

export default function wealthPrompt(chartData: ChartData, language: "en" | "hi"): string {
  const { lagna, planets, houses, dashas, yogas } = chartData;

  return `
# Wealth & Fortune Horoscope Analysis

## Birth Chart Data
- Lagna: ${lagna.sign}
- 2nd House (Wealth): ${houses["2"].sign}, Lord: ${houses["2"].lord}, Position: ${planets[houses["2"].lord]?.sign} in ${planets[houses["2"].lord]?.house}th
- 11th House (Gains): ${houses["11"].sign}, Lord: ${houses["11"].lord}, Position: ${planets[houses["11"].lord]?.sign} in ${planets[houses["11"].lord]?.house}th
- Jupiter (Karaka): ${planets.Jupiter.sign} in ${planets.Jupiter.house}th house, ${planets.Jupiter.nakshatra}
- Venus (Luxury): ${planets.Venus.sign} in ${planets.Venus.house}th house

## Dhana Yogas (Wealth Combinations)
${yogas.filter(y => y.type === "dhana" || y.name.includes("Wealth") || y.name.includes("Dhana")).map(y => `- ${y.name}: ${y.description} (Strength: ${y.strength})`).join("\n")}

## Current Dasha
- ${dashas.current.mahadasha} - ${dashas.current.antardasha}

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
