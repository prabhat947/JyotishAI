import { ChartData } from "../astro-client";

/** Helper: format all planets into a detailed table */
function formatPlanets(planets: ChartData["planets"]): string {
  if (!planets) return "Planetary data not available";
  return Object.entries(planets)
    .map(
      ([name, p]) =>
        `- **${name}**: ${p?.sign || "?"} (${p?.degrees?.toFixed(2) ?? "?"}°) in ${p?.house ?? "?"}th house, ` +
        `${p?.nakshatra || "?"} Nakshatra Pada ${p?.pada ?? "?"}, Lord: ${p?.lord || "?"}` +
        `${p?.retrograde ? " [RETROGRADE]" : ""}${p?.combust ? " [COMBUST]" : ""}`
    )
    .join("\n");
}

/** Helper: format all 12 houses */
function formatHouses(houses: ChartData["houses"]): string {
  if (!houses) return "House data not available";
  return Object.entries(houses)
    .map(
      ([num, h]) =>
        `- **${num}th House**: ${h?.sign || "?"}, Lord: ${h?.lord || "?"}, ` +
        `Occupants: ${h?.planets?.length > 0 ? h.planets.join(", ") : "Empty"}`
    )
    .join("\n");
}

/** Helper: format dasha sequence */
function formatDashaSequence(dashas: ChartData["dashas"]): string {
  if (!dashas?.sequence) return "Dasha sequence not available";
  return dashas.sequence
    .map((d) => `- **${d?.planet || "?"}** Mahadasha: ${d?.start || "?"} → ${d?.end || "?"}`)
    .join("\n");
}

/** Helper: format yogas */
function formatYogas(yogas: ChartData["yogas"]): string {
  if (!yogas || yogas.length === 0) return "No yogas detected";
  return yogas
    .map(
      (y) =>
        `- **${y?.name || "Unknown"}** [${y?.type || "?"}/${y?.strength || "?"}]: ${y?.description || "N/A"} | Planets: ${y?.planets?.join(", ") || "?"} | Effect: ${y?.effect || "N/A"}`
    )
    .join("\n");
}

/** Helper: format ashtakavarga */
function formatAshtakavarga(ashtakavarga: ChartData["ashtakavarga"]): string {
  if (!ashtakavarga) return "Ashtakavarga data not available";
  return Object.entries(ashtakavarga)
    .map(
      ([planet, bindus]) =>
        `- **${planet}**: [${bindus?.join(", ") || "?"}] (Aries→Pisces) Total: ${bindus?.reduce((a, b) => a + b, 0) ?? "?"}`
    )
    .join("\n");
}

export default function inDepthPrompt(chartData: ChartData, language: "en" | "hi"): string {
  const { lagna, planets, houses, dashas, yogas, ashtakavarga, numerology } = chartData;

  return `
# COMPLETE IN-DEPTH HOROSCOPE ANALYSIS (Brihat Kundali Phal)

You MUST produce a comprehensive, multi-chapter horoscope report following the EXACT structure below. Each chapter must contain detailed, substantive analysis — NOT brief summaries. Aim for the depth and quality of a professional ClickAstro/AstroVision report.

---

## BIRTH CHART DATA

### Lagna (Ascendant)
- Sign: ${lagna?.sign || "Unknown"} (${lagna?.sign_num ?? "?"}th sign)
- Degrees: ${lagna?.degrees?.toFixed(2) ?? "N/A"}°
- Lagna Lord: ${lagna?.lord || "Unknown"}

### Complete Planetary Positions
${formatPlanets(planets)}

### All 12 Houses (Bhavas)
${formatHouses(houses)}

### Vimshottari Dasha System
- **Balance at Birth**: ${dashas?.balance_at_birth?.planet || "?"} Dasha — ${dashas?.balance_at_birth?.years ?? "?"}Y ${dashas?.balance_at_birth?.months ?? "?"}M ${dashas?.balance_at_birth?.days ?? "?"}D remaining
- **Current Period**: ${dashas?.current?.mahadasha || "?"} Mahadasha / ${dashas?.current?.antardasha || "?"} Antardasha
  - Mahadasha: ${dashas?.current?.mahadasha_start || "?"} to ${dashas?.current?.mahadasha_end || "?"}
  - Antardasha: ${dashas?.current?.antardasha_start || "?"} to ${dashas?.current?.antardasha_end || "?"}

### Complete Dasha Sequence
${formatDashaSequence(dashas)}

### Detected Yogas (${yogas?.length ?? 0} total)
${formatYogas(yogas)}

### Ashtakavarga (Bindus per Sign: Aries to Pisces)
${formatAshtakavarga(ashtakavarga)}

${numerology ? `### Numerology
- Birth Number: ${numerology.birth_number}
- Destiny Number: ${numerology.destiny_number}
- Name Number: ${numerology.name_number || "Not calculated"}` : ""}

---

## REQUIRED REPORT STRUCTURE — Generate ALL 13 Chapters

### Chapter 1: Birth Profile & Panchang Analysis
- Lagna (Ascendant) sign, degree, lord, and its placement
- Moon sign (Rashi), Moon nakshatra, pada, and nakshatra lord
- Sun sign and its significance
- Birth nakshatra characteristics (deity, gana, nadi, yoni, varna)
- Ayushkaraka (longevity) assessment
- Overall chart strength assessment

### Chapter 2: Personality & Temperament (Swabhava Vichar)
- Lagna lord analysis — how the ascendant lord's placement shapes core personality
- Moon sign character — emotional nature, mental tendencies, instinctive reactions
- Sun sign ego structure — sense of self, vitality, authority style
- Nakshatra-based personality traits — birth star's influence on behavior
- Planetary aspects on Lagna — how aspects from benefics/malefics modify personality
- Mental constitution (Sattva/Rajas/Tamas assessment based on Moon and Mercury)
- Communication style (Mercury's influence), courage (Mars), wisdom (Jupiter)

### Chapter 3: Bhava Phala — House-by-House Life Predictions
For EACH of the 12 houses, provide detailed analysis covering:
- The sign on the house cusp, its lord, and where the lord is placed
- Any planets occupying the house and their effects
- Aspects received from other planets
- The house lord's dignity (exalted/own/friend/enemy/debilitated)
- Specific life predictions for that house's significations

Analyze ALL 12 houses:
1. **1st House (Tanu Bhava)** — Physical body, health, personality, general fortune
2. **2nd House (Dhana Bhava)** — Wealth, family, speech, food habits, right eye
3. **3rd House (Sahaja Bhava)** — Siblings, courage, communication, short travels, hands/arms
4. **4th House (Sukha Bhava)** — Mother, property, vehicles, education, mental peace, chest
5. **5th House (Putra Bhava)** — Children, intelligence, creativity, romance, past life merits, stomach
6. **6th House (Ripu Bhava)** — Enemies, diseases, debts, service, maternal uncle, obstacles
7. **7th House (Kalatra Bhava)** — Marriage, partnerships, spouse nature, business, travel abroad
8. **8th House (Ayur Bhava)** — Longevity, sudden events, inheritance, research, occult, reproductive organs
9. **9th House (Dharma Bhava)** — Fortune, father, guru, religion, long journeys, higher education
10. **10th House (Karma Bhava)** — Career, status, government favor, reputation, knees
11. **11th House (Labha Bhava)** — Gains, elder siblings, income, aspirations, social circle, ankles
12. **12th House (Vyaya Bhava)** — Losses, expenses, foreign lands, moksha, hospitalization, feet

### Chapter 4: Favorable & Unfavorable Periods (Shubha-Ashubha Kala)
- Rank all mahadasha periods from most favorable to least favorable for this chart
- Identify the best periods for: career advancement, wealth accumulation, marriage, children, spiritual growth
- Identify challenging periods: health concerns, financial losses, relationship difficulties
- Provide year-by-year highlight summary for the next 20 years

### Chapter 5: Vimshottari Dasha Predictions (Mahadasha Analysis)
For EACH mahadasha in the sequence, provide:
- The dasha lord's natal position (sign, house, dignity)
- General theme of the period (what life area gets activated)
- Career effects, wealth effects, health effects, relationship effects
- Key years within the mahadasha that are especially significant
- How the dasha lord relates to the lagna lord (friend/enemy/neutral)

### Chapter 6: Current Period Deep Dive (Antardasha & Pratyantardasha)
- Detailed analysis of the current Mahadasha-Antardasha combination
- How the mahadasha lord and antardasha lord interact (mutual aspects, sign exchange, etc.)
- Specific predictions for the current sub-period with timeline
- What to expect in the next 2-3 antardashas
- Pratyantardasha-level analysis for the next 12 months

### Chapter 7: Dosha Analysis (Planetary Afflictions)
Analyze each dosha — whether present, severity, and remedies:
- **Mangal Dosha (Kuja Dosha)**: Mars in 1st/2nd/4th/7th/8th/12th from Lagna/Moon/Venus. Check cancellation conditions.
- **Kaal Sarpa Dosha**: All planets between Rahu-Ketu axis. Partial or complete. Cancellation factors.
- **Pitru Dosha**: Sun afflicted by Rahu/Ketu/Saturn — ancestral karma indicators
- **Grahan Dosha**: Sun/Moon conjunct Rahu/Ketu — eclipse yoga effects
- **Shani Dosha**: Saturn's affliction on key houses
- For each dosha found: specify severity (mild/moderate/severe), effects on life, specific remedial measures

### Chapter 8: Nakshatra Analysis & Remedies
- Birth nakshatra in detail: deity, shakti (power), gana (nature), nadi, yoni (animal symbol), varna (caste), direction, ruling planet
- Nakshatra-based personality traits and life tendencies
- Favorable activities, colors, numbers, directions for the birth nakshatra
- Nakshatra deity worship recommendations
- Specific mantras for the birth nakshatra lord
- Fasting days associated with the nakshatra

### Chapter 9: Planet-Wise Remedies (Graha Shanti)
For EACH of the 9 planets, provide:
- Current status in the chart (benefic/malefic/neutral for this lagna)
- Whether the planet needs strengthening or pacification
- **Mantra**: Specific beej mantra or Vedic mantra with exact jaap count (e.g., "Om Graam Greem Graum Sah Gurave Namah — 19,000 times")
- **Gemstone**: Name (Sanskrit + English), carat weight, metal, wearing finger, day to start
- **Charity (Daan)**: Specific items to donate, day of donation, to whom
- **Yantra**: If applicable, which yantra to install
- **Color therapy**: Favorable colors to wear/use on specific days
- **Fasting**: Which day to fast for which planet

### Chapter 10: Yoga Analysis (Planetary Combinations)
For EACH detected yoga:
- Full explanation of how the yoga is formed in this chart (which planets, which houses)
- Classical reference (from BPHS/Brihat Jataka if applicable)
- Strength assessment (strong/moderate/weak) and why
- Specific effects on the native's life
- During which dasha period the yoga will give maximum results
- Any factors that enhance or diminish the yoga's effects

### Chapter 11: Ashtakavarga Analysis
- Sarvashtakavarga total for each house (sum of all planetary bindus)
- Houses with highest bindus (>28) — strongest areas of life
- Houses with lowest bindus (<25) — areas needing attention
- Planet-wise ashtakavarga strength — which planets are strongest in transit
- Transit prediction methodology: when benefic planets transit signs with high bindus, good results
- Specific favorable transit periods based on ashtakavarga

### Chapter 12: Major Transit Predictions
- Current and upcoming Jupiter transit — which house from Lagna and Moon, effects for next 2 years
- Current and upcoming Saturn transit — Sade Sati status, dhaiya status, effects
- Rahu-Ketu current transit — karmic themes being activated
- Eclipse impact — upcoming eclipses and their proximity to natal planets
- Key transit dates for the next 2-3 years

### Chapter 13: Calculation Summary & Reference Tables
- All planetary longitudes (degrees, minutes, seconds)
- All nakshatra positions with pada
- House cusp degrees
- Planetary dignities table (exaltation/own/friend/enemy/debilitation status)
- Dasha balance and complete sequence table

---

Generate this COMPLETE 13-chapter report in ${language === "hi" ? "Hindi (use Devanagari script, with Sanskrit terms naturally as used in Hindi Jyotish texts)" : "English (include Sanskrit/Hindi terms in parentheses for key concepts)"}. Each chapter must be substantial and detailed — this should read like a professional astrology consultation, not a brief overview.
  `.trim();
}
