import { ChartData } from "../astro-client";

export default function careerPrompt(chartData: ChartData, language: "en" | "hi"): string {
  const { lagna, planets, houses, dashas, yogas } = chartData;

  return `
# Career & Business Horoscope Analysis

## Birth Chart Data
- Lagna (Ascendant): ${lagna.sign} at ${lagna.degrees.toFixed(2)}°
- 10th House (Career): ${houses["10"].sign}, Lord: ${houses["10"].lord}
- 10th Lord Position: ${planets[houses["10"].lord]?.sign} in ${planets[houses["10"].lord]?.house}th house
- 6th House (Service): ${houses["6"].sign}, Lord: ${houses["6"].lord}
- Sun (Authority): ${planets.Sun.sign} in ${planets.Sun.house}th house, ${planets.Sun.nakshatra}
- Saturn (Discipline): ${planets.Saturn.sign} in ${planets.Saturn.house}th house, ${planets.Saturn.retrograde ? "Retrograde" : "Direct"}
- Jupiter (Wisdom): ${planets.Jupiter.sign} in ${planets.Jupiter.house}th house
- Mercury (Intelligence): ${planets.Mercury.sign} in ${planets.Mercury.house}th house

## Current Dasha Period
- Mahadasha: ${dashas.current.mahadasha} (${dashas.current.mahadasha_start} to ${dashas.current.mahadasha_end})
- Antardasha: ${dashas.current.antardasha} (${dashas.current.antardasha_start} to ${dashas.current.antardasha_end})

## Detected Yogas (Career-Related)
${yogas.filter(y => y.type === "raj" || y.type === "dhana" || y.name.includes("Career")).map(y => `- ${y.name}: ${y.description}`).join("\n")}

## Analysis Request
Based on this Vedic astrology birth chart, provide a comprehensive career and business analysis covering:

1. **Natural Career Inclinations** - What fields/industries suit this person based on planetary placements?
2. **Professional Strengths** - Key talents and abilities in the workplace
3. **Career Challenges** - Potential obstacles and how to overcome them
4. **Best Career Periods** - Timing analysis based on dasha periods
5. **Business vs. Job** - Which path is more favorable?
6. **Authority & Leadership** - Potential for leadership roles
7. **Financial Success** - Wealth accumulation through career
8. **Current Period Analysis** - Specific guidance for the active ${dashas.current.mahadasha}-${dashas.current.antardasha} period
9. **Practical Recommendations** - Actionable career advice

Generate a detailed, well-structured report in ${language === "hi" ? "Hindi" : "English"}.
  `.trim();
}
