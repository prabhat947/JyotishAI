import { ChartData } from "../astro-client";

export default function transitSaturnPrompt(chartData: ChartData, language: "en" | "hi"): string {
  const { planets } = chartData;

  return `
# Saturn Transit Predictions (Sade Sati & Dhaiya)

## Natal Saturn Position
- Sign: ${planets?.Saturn?.sign || "Unknown"}
- House: ${planets?.Saturn?.house || "?"}th
- Nakshatra: ${planets?.Saturn?.nakshatra || "Unknown"}
- ${planets?.Saturn?.retrograde ? "Retrograde" : "Direct"}

## Natal Moon (for Sade Sati calculation)
- Moon Sign: ${planets?.Moon?.sign || "Unknown"}
- Moon House: ${planets?.Moon?.house || "?"}th
- Moon Nakshatra: ${planets?.Moon?.nakshatra || "Unknown"}

## Analysis Request
Saturn takes 30 years for one zodiac cycle. Critical periods:
- **Sade Sati**: 7.5 years when Saturn transits 12th, 1st, 2nd from Moon
- **Dhaiya**: 2.5 years when Saturn transits 4th or 8th from Moon

Provide comprehensive analysis:

1. **Current Transit Status** - Is Sade Sati or Dhaiya active?
2. **Sade Sati Phases** - If applicable:
   - Rising phase (12th from Moon)
   - Peak phase (over Moon)
   - Setting phase (2nd from Moon)
3. **Impact on Life Areas**
   - Career and profession
   - Health and vitality
   - Relationships and family
   - Mental state
4. **Previous Saturn Returns** - Lessons from past transits
5. **Upcoming Critical Periods** - Next Sade Sati, Dhaiya, Saturn Return
6. **House-by-House Effects** - Saturn's transit through each house
7. **Natal Saturn Activation** - When transiting Saturn aspects natal Saturn
8. **Remedies & Mitigations** - Specific actions to reduce hardships
9. **Silver Linings** - Growth opportunities through discipline
10. **Timeline** - Exact dates for phase changes

Generate in ${language === "hi" ? "Hindi" : "English"}.
  `.trim();
}
