import { ChartData } from "../astro-client";

export default function transitRahuKetuPrompt(chartData: ChartData, language: "en" | "hi"): string {
  const { lagna, planets } = chartData;

  return `
# Rahu-Ketu Transit Predictions (Nodal Transits)

## Natal Nodal Axis
- Rahu: ${planets?.Rahu?.sign || "Unknown"} in ${planets?.Rahu?.house || "?"}th house, ${planets?.Rahu?.nakshatra || "Unknown"}
- Ketu: ${planets?.Ketu?.sign || "Unknown"} in ${planets?.Ketu?.house || "?"}th house, ${planets?.Ketu?.nakshatra || "Unknown"}

## Lagna & Moon
- Lagna: ${lagna?.sign || "Unknown"}
- Moon: ${planets?.Moon?.sign || "Unknown"} in ${planets?.Moon?.house || "?"}th house

## Analysis Request
Rahu and Ketu transit in reverse (retrograde) through the zodiac, spending 18 months in each sign.

Provide comprehensive analysis:

1. **Current Nodal Transit** - Current signs and houses for Rahu-Ketu
2. **Rahu Transit Effects**
   - Material desires and worldly ambitions
   - Unexpected opportunities
   - Areas of obsession or confusion
   - Technology and innovation
3. **Ketu Transit Effects**
   - Spiritual detachment
   - Past life karmas manifesting
   - Losses or letting go
   - Mystical experiences
4. **Nodal Return** - When Rahu-Ketu return to natal positions (every 18.6 years)
5. **Karmic Axis Activation** - When transiting nodes cross natal planets
6. **Eclipse Impact** - Eclipses on natal Rahu-Ketu axis
7. **House-by-House Analysis** - Effects as nodes transit each house
8. **Rahu Mahadasha Connection** - If in Rahu or Ketu dasha, special significance
9. **Remedies** - Mantras, donations, spiritual practices
10. **Timeline** - Next sign changes and major nodal events

Generate in ${language === "hi" ? "Hindi" : "English"}.
  `.trim();
}
