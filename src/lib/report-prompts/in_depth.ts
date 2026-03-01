import { ChartData } from "../astro-client";

export default function inDepthPrompt(chartData: ChartData, language: "en" | "hi"): string {
  const { lagna, planets, houses, dashas, yogas, numerology } = chartData;

  return `
# Complete In-Depth Horoscope Analysis

## Personal Details
- Lagna (Ascendant): ${lagna?.sign || "Unknown"} at ${lagna?.degrees?.toFixed(2) ?? "N/A"}°, Lord: ${lagna?.lord || "Unknown"}
- Birth Nakshatra: ${planets?.Moon?.nakshatra || "Unknown"}, Pada ${planets?.Moon?.pada ?? "N/A"}
${numerology ? `- Birth Number: ${numerology.birth_number}, Destiny Number: ${numerology.destiny_number}` : ""}

## All Planetary Positions
${planets ? Object.entries(planets).map(([name, data]) =>
  `- ${name}: ${data?.sign || "Unknown"} (${data?.degrees?.toFixed(2) ?? "N/A"}°) in ${data?.house ?? "?"}th house, ${data?.nakshatra || "Unknown"} nakshatra${data?.retrograde ? " (Retrograde)" : ""}`
).join("\n") : "Planetary data not available"}

## House Analysis
${houses ? Object.entries(houses).map(([num, data]) =>
  `- ${num}th House: ${data?.sign || "Unknown"}, Lord ${data?.lord || "Unknown"}, Planets: ${data?.planets?.length > 0 ? data.planets.join(", ") : "Empty"}`
).join("\n") : "House data not available"}

## Vimshottari Dasha
- Balance at Birth: ${dashas?.balance_at_birth?.planet || "Unknown"} ${dashas?.balance_at_birth?.years ?? "?"}Y ${dashas?.balance_at_birth?.months ?? "?"}M ${dashas?.balance_at_birth?.days ?? "?"}D
- Current Period: ${dashas?.current?.mahadasha || "Unknown"} - ${dashas?.current?.antardasha || "Unknown"}
- Next 5 Major Periods:
${dashas?.sequence?.slice(0, 5)?.map(d => `  ${d.planet}: ${d.start} to ${d.end}`).join("\n") || "  Dasha sequence not available"}

## Detected Yogas (${yogas?.length ?? 0} total)
${yogas?.map(y => `- **${y.name}** (${y.type}, ${y.strength}): ${y.description}`).join("\n") || "No yogas detected"}

## Analysis Request
This is the most comprehensive report. Provide an exhaustive 50+ page analysis covering:

### Part 1: Personality & Character
1. Core personality traits
2. Mental and emotional nature
3. Strengths and weaknesses
4. Life purpose and dharma

### Part 2: Life Areas
5. Family and early life
6. Education and learning
7. Career and profession (detailed)
8. Wealth and finances (detailed)
9. Love, marriage, and relationships
10. Children and progeny
11. Health and longevity
12. Spiritual inclinations

### Part 3: Timing Analysis
13. Complete dasha analysis (Mahadasha effects)
14. Past life karmas (based on nodes)
15. Future predictions (next 10 years)

### Part 4: Yogas & Special Combinations
16. All detected yogas explained in detail
17. Ashtakavarga analysis
18. Navamsa chart insights

### Part 5: Remedies & Recommendations
19. Gemstone recommendations
20. Mantra suggestions
21. Charitable acts
22. Lifestyle guidance

Generate an extremely detailed, well-structured report in ${language === "hi" ? "Hindi" : "English"}.
  `.trim();
}
