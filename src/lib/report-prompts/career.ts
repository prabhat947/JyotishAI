import { ChartData } from "../astro-client";

export default function careerPrompt(chartData: ChartData, language: "en" | "hi"): string {
  const { lagna, planets, houses, dashas, yogas } = chartData;

  const house10 = houses?.["10"];
  const house6 = houses?.["6"];
  const house10Lord = house10?.lord ? planets?.[house10.lord] : undefined;

  return `
# Career & Business Horoscope Analysis

## Birth Chart Data
- Lagna (Ascendant): ${lagna?.sign || "Unknown"} at ${lagna?.degrees?.toFixed(2) ?? "N/A"}°
- 10th House (Career): ${house10?.sign || "Unknown"}, Lord: ${house10?.lord || "Unknown"}
- 10th Lord Position: ${house10Lord?.sign || "Unknown"} in ${house10Lord?.house ?? "?"}th house
- 6th House (Service): ${house6?.sign || "Unknown"}, Lord: ${house6?.lord || "Unknown"}
- Sun (Authority): ${planets?.Sun?.sign || "Unknown"} in ${planets?.Sun?.house ?? "?"}th house, ${planets?.Sun?.nakshatra || "Unknown"}
- Saturn (Discipline): ${planets?.Saturn?.sign || "Unknown"} in ${planets?.Saturn?.house ?? "?"}th house, ${planets?.Saturn?.retrograde ? "Retrograde" : "Direct"}
- Jupiter (Wisdom): ${planets?.Jupiter?.sign || "Unknown"} in ${planets?.Jupiter?.house ?? "?"}th house
- Mercury (Intelligence): ${planets?.Mercury?.sign || "Unknown"} in ${planets?.Mercury?.house ?? "?"}th house

## Current Dasha Period
- Mahadasha: ${dashas?.current?.mahadasha || "Unknown"} (${dashas?.current?.mahadasha_start || "?"} to ${dashas?.current?.mahadasha_end || "?"})
- Antardasha: ${dashas?.current?.antardasha || "Unknown"} (${dashas?.current?.antardasha_start || "?"} to ${dashas?.current?.antardasha_end || "?"})

## Detected Yogas (Career-Related)
${yogas?.filter(y => y.type === "raj" || y.type === "dhana" || y.name?.includes("Career")).map(y => `- ${y.name}: ${y.description}`).join("\n") || "No career-specific yogas detected"}

## Analysis Request
Based on this Vedic astrology birth chart, provide a comprehensive career and business analysis covering:

1. **Natural Career Inclinations** - What fields/industries suit this person based on planetary placements?
2. **Professional Strengths** - Key talents and abilities in the workplace
3. **Career Challenges** - Potential obstacles and how to overcome them
4. **Best Career Periods** - Timing analysis based on dasha periods
5. **Business vs. Job** - Which path is more favorable?
6. **Authority & Leadership** - Potential for leadership roles
7. **Financial Success** - Wealth accumulation through career
8. **Current Period Analysis** - Specific guidance for the active ${dashas?.current?.mahadasha || "current"}-${dashas?.current?.antardasha || "current"} period
9. **Practical Recommendations** - Actionable career advice

Generate a detailed, well-structured report in ${language === "hi" ? "Hindi" : "English"}.
  `.trim();
}
