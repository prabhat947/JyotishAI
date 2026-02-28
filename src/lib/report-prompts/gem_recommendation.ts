import { ChartData } from "../astro-client";

export default function gemRecommendationPrompt(chartData: ChartData, language: "en" | "hi"): string {
  const { lagna, planets, houses, dashas } = chartData;

  return `
# Gemstone Recommendation Report

## Birth Chart Summary
- Lagna: ${lagna.sign}, Lord: ${lagna.lord}
- Moon: ${planets.Moon.sign}, Nakshatra: ${planets.Moon.nakshatra}
- Lagna Lord Position: ${planets[lagna.lord]?.sign} in ${planets[lagna.lord]?.house}th house

## Current Dasha
- Mahadasha: ${dashas.current.mahadasha}
- Antardasha: ${dashas.current.antardasha}

## All Planetary Positions
${Object.entries(planets).map(([name, data]) =>
  `- ${name}: ${data.sign} in ${data.house}th house${data.retrograde ? " (R)" : ""}`
).join("\n")}

## Analysis Request
Gemstones (Ratnas) are powerful Vedic remedies that channel planetary energies.

Provide comprehensive gemstone guidance:

### Primary Gemstone Recommendation
1. **Main Gemstone** - Which planet needs strengthening most?
   - Gemstone name (Sanskrit and English)
   - Ruling planet
   - Why this planet needs support
   - Expected benefits
   - Weight in carats
   - Metal setting (gold, silver, panchdhatu)
   - Finger to wear
   - Day and time to wear
   - Mantra to chant while wearing

### Secondary Gemstone (if applicable)
2. **Alternate Gemstone** - Second priority planet
   - Same details as above

### Planetary Analysis
3. **Strong Planets** - Well-placed planets (no gemstone needed)
4. **Weak Planets** - Debilitated/afflicted planets (gemstone helpful)
5. **Malefic Planets** - Planets causing problems (cautious approach)

### Gemstone Details
6. **Quality Guidelines**
   - How to identify authentic gemstones
   - Flawless vs. flawed stones
   - Activation ritual (Pran Pratishtha)
   - Wearing muhurta (auspicious time)

### Alternative Remedies
7. **Uparatnas** - Substitute gemstones (if primary too expensive)
8. **Rudraksha** - Specific beads for planets
9. **Other Remedies** - Mantras, yantras, donations

### Important Warnings
10. **Gemstones to Avoid** - Planets that are enemies or harmful
11. **Combination Rules** - Which gemstones can be worn together
12. **When to Remove** - If adverse effects occur

### Dasha-Specific Recommendations
13. **Current Period Gems** - For active ${dashas.current.mahadasha}-${dashas.current.antardasha}
14. **Future Preparation** - Gems for upcoming dashas

Generate detailed gemstone report in ${language === "hi" ? "Hindi" : "English"}.
  `.trim();
}
