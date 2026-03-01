import { ChartData } from "../astro-client";

export default function transitJupiterPrompt(chartData: ChartData, language: "en" | "hi"): string {
  const { lagna, planets, houses } = chartData;

  return `
# Jupiter Transit Predictions

## Natal Jupiter Position
- Sign: ${planets?.Jupiter?.sign || "Unknown"}
- House: ${planets?.Jupiter?.house || "?"}th
- Nakshatra: ${planets?.Jupiter?.nakshatra || "Unknown"}
- ${planets?.Jupiter?.retrograde ? "Retrograde" : "Direct"}

## Lagna & Key Houses
- Lagna: ${lagna?.sign || "Unknown"}
- 9th House (Jupiter's domain): ${houses?.["9"]?.sign || "Unknown"}
- 12th House (Jupiter's other domain): ${houses?.["12"]?.sign || "Unknown"}

## Analysis Request
Jupiter takes 12 years to complete one zodiac cycle. Provide transit analysis covering:

1. **Current Transit Position** - Where is Jupiter now?
2. **House-by-House Effects** - As Jupiter moves through each house from Lagna
3. **Natal Jupiter Impact** - How transiting Jupiter aspects natal Jupiter
4. **Best Transit Periods** - Most auspicious houses (2, 5, 7, 9, 11 from Moon/Lagna)
5. **Challenging Periods** - Difficult transits (6, 8, 12)
6. **Career Impact** - Professional growth opportunities
7. **Wealth Impact** - Financial expansion
8. **Spiritual Growth** - Learning and wisdom
9. **Key Dates** - When Jupiter enters new signs
10. **Recommendations** - How to maximize positive transit effects

Generate in ${language === "hi" ? "Hindi" : "English"}.
  `.trim();
}
