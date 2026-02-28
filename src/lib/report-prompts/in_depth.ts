import { ChartData } from "../astro-client";

export default function inDepthPrompt(chartData: ChartData, language: "en" | "hi"): string {
  const { lagna, planets, houses, dashas, yogas, numerology } = chartData;

  return `
# Complete In-Depth Horoscope Analysis

## Personal Details
- Lagna (Ascendant): ${lagna.sign} at ${lagna.degrees.toFixed(2)}°, Lord: ${lagna.lord}
- Birth Nakshatra: ${planets.Moon.nakshatra}, Pada ${planets.Moon.pada}
${numerology ? `- Birth Number: ${numerology.birth_number}, Destiny Number: ${numerology.destiny_number}` : ""}

## All Planetary Positions
${Object.entries(planets).map(([name, data]) =>
  `- ${name}: ${data.sign} (${data.degrees.toFixed(2)}°) in ${data.house}th house, ${data.nakshatra} nakshatra${data.retrograde ? " (Retrograde)" : ""}`
).join("\n")}

## House Analysis
${Object.entries(houses).map(([num, data]) =>
  `- ${num}th House: ${data.sign}, Lord ${data.lord}, Planets: ${data.planets.length > 0 ? data.planets.join(", ") : "Empty"}`
).join("\n")}

## Vimshottari Dasha
- Balance at Birth: ${dashas.balance_at_birth.planet} ${dashas.balance_at_birth.years}Y ${dashas.balance_at_birth.months}M ${dashas.balance_at_birth.days}D
- Current Period: ${dashas.current.mahadasha} - ${dashas.current.antardasha}
- Next 5 Major Periods:
${dashas.sequence.slice(0, 5).map(d => `  ${d.planet}: ${d.start} to ${d.end}`).join("\n")}

## Detected Yogas (${yogas.length} total)
${yogas.map(y => `- **${y.name}** (${y.type}, ${y.strength}): ${y.description}`).join("\n")}

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
