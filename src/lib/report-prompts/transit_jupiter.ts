import { ChartData } from "../astro-client";

/** Helper: format all planets into a detailed listing */
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

/** Helper: format yogas involving Jupiter */
function formatJupiterYogas(yogas: ChartData["yogas"]): string {
  if (!yogas || yogas.length === 0) return "No yogas detected";
  const jupiterYogas = yogas.filter(
    (y) =>
      y?.planets?.includes("Jupiter") ||
      y?.type === "raj" ||
      y?.type === "dhana" ||
      y?.name?.toLowerCase()?.includes("guru") ||
      y?.name?.toLowerCase()?.includes("jupiter") ||
      y?.name?.toLowerCase()?.includes("hamsa") ||
      y?.name?.toLowerCase()?.includes("gajakesari")
  );
  if (jupiterYogas.length === 0) return "No Jupiter-specific yogas detected";
  return jupiterYogas
    .map(
      (y) =>
        `- **${y?.name || "Unknown"}** [${y?.type || "?"}/${y?.strength || "?"}]: ${y?.description || "N/A"} | Planets: ${y?.planets?.join(", ") || "?"} | Effect: ${y?.effect || "N/A"}`
    )
    .join("\n");
}

/** Helper: format all yogas */
function formatAllYogas(yogas: ChartData["yogas"]): string {
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
        `- **${planet}**: [${bindus?.join(", ") || "?"}] (Aries to Pisces) Total: ${bindus?.reduce((a, b) => a + b, 0) ?? "?"}`
    )
    .join("\n");
}

/** Helper: extract Jupiter-specific ashtakavarga */
function formatJupiterAshtakavarga(ashtakavarga: ChartData["ashtakavarga"]): string {
  if (!ashtakavarga) return "Jupiter Ashtakavarga data not available";
  const jupiterBindus = ashtakavarga?.["Jupiter"];
  if (!jupiterBindus) return "Jupiter Ashtakavarga not available";
  const signs = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];
  const total = jupiterBindus?.reduce((a, b) => a + b, 0) ?? 0;
  const breakdown = signs
    .map((sign, i) => `  - ${sign}: ${jupiterBindus?.[i] ?? "?"} bindus${(jupiterBindus?.[i] ?? 0) >= 5 ? " (STRONG)" : (jupiterBindus?.[i] ?? 0) <= 2 ? " (WEAK)" : ""}`)
    .join("\n");
  return `- **Jupiter Ashtakavarga** (Total: ${total} bindus)\n${breakdown}`;
}

export default function transitJupiterPrompt(chartData: ChartData, language: "en" | "hi"): string {
  const { lagna, planets, houses, dashas, yogas, ashtakavarga } = chartData;

  const jupiterData = planets?.Jupiter;
  const moonData = planets?.Moon;

  // Determine Jupiter's relationship houses
  const jupiterHouse = jupiterData?.house ?? "?";
  const moonSign = moonData?.sign || "Unknown";
  const lagnaSign = lagna?.sign || "Unknown";

  // Houses Jupiter rules (Sagittarius = 9th natural, Pisces = 12th natural)
  const house9 = houses?.["9"];
  const house5 = houses?.["5"];
  const house2 = houses?.["2"];
  const house11 = houses?.["11"];

  return `
# COMPREHENSIVE JUPITER (GURU/BRIHASPATI) TRANSIT PREDICTIONS

You MUST produce a detailed, multi-chapter Jupiter transit report following the EXACT structure below. Each chapter must contain substantive analysis with specific predictions. Aim for ~18 pages of professional-quality content matching ClickAstro/AstroVision standards.

Jupiter (Guru) is the greatest benefic — planet of wisdom, fortune, expansion, dharma, children, and spiritual growth. Its transit through each house from the natal Lagna and Moon sign profoundly shapes life events over its ~12-year cycle (approximately 1 year per sign).

---

## BIRTH CHART DATA

### Lagna (Ascendant)
- Sign: ${lagnaSign} (${lagna?.sign_num ?? "?"}th sign)
- Degrees: ${lagna?.degrees?.toFixed(2) ?? "N/A"}°
- Lagna Lord: ${lagna?.lord || "Unknown"}

### Natal Jupiter (Guru) — Complete Profile
- Sign: ${jupiterData?.sign || "Unknown"} (${jupiterData?.sign_num ?? "?"}th sign)
- Degrees: ${jupiterData?.degrees?.toFixed(2) ?? "?"}°
- House from Lagna: ${jupiterHouse}th house
- Nakshatra: ${jupiterData?.nakshatra || "Unknown"}, Pada: ${jupiterData?.pada ?? "?"}
- Nakshatra Lord: ${jupiterData?.lord || "Unknown"}
- Status: ${jupiterData?.retrograde ? "RETROGRADE" : "Direct"}${jupiterData?.combust ? ", COMBUST" : ""}

### Natal Moon (for transit from Chandra Lagna)
- Sign: ${moonSign} (${moonData?.sign_num ?? "?"}th sign)
- House: ${moonData?.house ?? "?"}th
- Nakshatra: ${moonData?.nakshatra || "Unknown"}, Pada: ${moonData?.pada ?? "?"}

### Complete Planetary Positions
${formatPlanets(planets)}

### All 12 Houses (Bhavas)
${formatHouses(houses)}

### Jupiter-Related Houses
- **5th House (Putra Bhava — Jupiter's joy)**: ${house5?.sign || "?"}, Lord: ${house5?.lord || "?"}, Occupants: ${house5?.planets?.length ? house5.planets.join(", ") : "Empty"}
- **9th House (Dharma Bhava — Jupiter's own signification)**: ${house9?.sign || "?"}, Lord: ${house9?.lord || "?"}, Occupants: ${house9?.planets?.length ? house9.planets.join(", ") : "Empty"}
- **2nd House (Dhana Bhava — Jupiter as Dhana karaka)**: ${house2?.sign || "?"}, Lord: ${house2?.lord || "?"}, Occupants: ${house2?.planets?.length ? house2.planets.join(", ") : "Empty"}
- **11th House (Labha Bhava — Gains)**: ${house11?.sign || "?"}, Lord: ${house11?.lord || "?"}, Occupants: ${house11?.planets?.length ? house11.planets.join(", ") : "Empty"}

### Yogas Involving Jupiter
${formatJupiterYogas(yogas)}

### All Detected Yogas (${yogas?.length ?? 0} total)
${formatAllYogas(yogas)}

### Current Dasha Period
- Mahadasha: ${dashas?.current?.mahadasha || "?"} (${dashas?.current?.mahadasha_start || "?"} to ${dashas?.current?.mahadasha_end || "?"})
- Antardasha: ${dashas?.current?.antardasha || "?"} (${dashas?.current?.antardasha_start || "?"} to ${dashas?.current?.antardasha_end || "?"})

### Ashtakavarga — Complete Data
${formatAshtakavarga(ashtakavarga)}

### Jupiter-Specific Ashtakavarga
${formatJupiterAshtakavarga(ashtakavarga)}

---

## REQUIRED REPORT STRUCTURE — Generate ALL 7 Chapters

### Chapter 1: Natal Jupiter Profile (Guru Swaroop)
- Jupiter's sign placement: Is Jupiter exalted (Cancer), in own sign (Sagittarius/Pisces), in friend's sign, enemy's sign, or debilitated (Capricorn)? What dignity does natal Jupiter hold?
- Jupiter's house placement: What life areas does Jupiter naturally activate from its natal position?
- Jupiter's nakshatra analysis: How does the nakshatra lord influence Jupiter's expression?
- Jupiter's aspects: From its natal position, Jupiter casts special aspects on the 5th, 7th, and 9th houses from itself. Identify which houses receive Jupiter's drishti and what life areas benefit.
- Jupiter as house lord: Which houses does Jupiter rule for this lagna? How does its placement affect those house significations?
- Jupiter's conjunctions: Any planets conjunct natal Jupiter? How do they modify its results?
- Jupiter's relationship with the Mahadasha lord: Is the current dasha lord a friend/enemy/neutral of Jupiter? How does this affect Jupiter transit results?
- Retrograde/combust status: If retrograde, how does this internalize Jupiter's energy? If combust, how is Jupiter's beneficence diminished?

### Chapter 2: Current Jupiter Transit Position
- **Current transit sign and house**: Which sign is Jupiter currently transiting? Which house does this fall in from Lagna? Which house from Moon sign (Chandra Lagna)?
- **Transit dates**: When did Jupiter enter the current sign? When will it move to the next sign?
- **Retrograde periods**: Any retrograde periods during the current transit? Dates and effects of retrograde Jupiter.
- **Nakshatra traversal**: Which nakshatras will Jupiter traverse in the current sign? Different results for each nakshatra.
- **Aspects from current position**: Which natal planets does transiting Jupiter aspect (5th, 7th, 9th) from its current position? Specific effects of each aspect.
- **Interaction with natal planets**: Does transiting Jupiter conjunct, oppose, or trine any natal planets? Detailed effects.

### Chapter 3: House-by-House Transit Analysis (Gochar Phala)
For EACH of the 12 houses, provide a complete analysis from BOTH Lagna and Moon sign:

**For each house, cover:**
- The sign Jupiter transits through when in this house
- Duration/approximate dates of Jupiter's transit through this house
- **Career effects**: Job changes, promotions, business expansion, professional reputation
- **Financial effects**: Income, gains, losses, investments, property
- **Relationship effects**: Marriage, partnerships, family dynamics, children
- **Health effects**: Physical vitality, specific health areas influenced
- **Spiritual/educational effects**: Learning, wisdom, guru-blessings, dharma
- **Jupiter's special aspects from this house**: What houses receive Jupiter's 5th, 7th, and 9th aspects, and what do those aspects activate?
- **Overall rating**: Highly favorable / Favorable / Neutral / Challenging

Classical Vedic transit results reference:
- Jupiter in 2nd, 5th, 7th, 9th, 11th from Moon = Favorable (Shubha Gochar)
- Jupiter in 1st, 3rd, 4th, 6th, 8th, 10th, 12th from Moon = Unfavorable or mixed
- Modify these classical results based on ashtakavarga bindus for accurate prediction

### Chapter 4: Vedha Points (Classical Obstructions)
- Explain the concept of Vedha (obstruction) in Jupiter's transit
- Jupiter's Vedha points: Transit in 2nd is obstructed by planets in 12th. Transit in 5th is obstructed by planets in 4th. Transit in 7th is obstructed by planets in 3rd. Transit in 9th is obstructed by planets in 10th. Transit in 11th is obstructed by planets in 8th.
- For THIS chart: Identify which favorable Jupiter transits will be obstructed by natal planetary placements
- Explain how Vedha modifies or cancels otherwise favorable transit results
- Any Vedha-free favorable transits (strongest positive periods)

### Chapter 5: Ashtakavarga Jupiter Analysis
- Jupiter's bindus in each of the 12 signs (Aries through Pisces)
- **Strong transit signs** (5+ bindus): When Jupiter transits these signs, maximum positive results. Identify specific signs and what house they represent.
- **Moderate transit signs** (3-4 bindus): Average results with some fluctuation
- **Weak transit signs** (0-2 bindus): Challenging transit despite Jupiter being a benefic. Identify specific signs and caution periods.
- **Sarvashtakavarga correlation**: Total bindus in each house — Jupiter transit through high-bindu houses amplifies good results
- **Transit timing using Ashtakavarga**: Predict the relative strength of Jupiter's transit through each upcoming sign for the next 12 years
- **Kaksha (sub-division) analysis**: Within each sign, Jupiter's results vary based on which planet's kaksha it occupies

### Chapter 6: Jupiter Return (Guru Peyarchi / Brihaspati Prathyaavartana)
- Jupiter's natal position: ${jupiterData?.sign || "Unknown"} at ${jupiterData?.degrees?.toFixed(2) ?? "?"}°
- **Jupiter return cycle**: ~12 years. Calculate approximate dates of previous and next Jupiter return.
- **Significance of Jupiter return**: A major life milestone — reassessment of dharma, wisdom, fortune, and life direction
- **Previous Jupiter returns**: What life themes emerged during past returns (ages ~12, ~24, ~36, ~48, ~60)?
- **Upcoming Jupiter return**: When will Jupiter next return to ${jupiterData?.sign || "its natal sign"}? What dasha period will be active at that time?
- **Preparation guidance**: How to harness Jupiter return energy for maximum benefit
- **Jupiter return in context of dasha**: How does the active dasha lord at the time of Jupiter return color the experience?

### Chapter 7: Jupiter Transit Remedies (Guru Shanti Upaya)
- **Gemstone**: Yellow Sapphire (Pukhraj) — carat weight recommendation, gold or panchdhatu setting, wearing on index finger (right hand), start on a Thursday in Pushya or Guru's hora. Caution: Should be worn ONLY if Jupiter is a functional benefic for this lagna.
- **Mantra**: "Om Graam Greem Graum Sah Gurave Namah" — 19,000 jaap for one mandala. Best chanted on Thursdays during Jupiter hora. Beej mantra: "Om Brim Brihaspataye Namah."
- **Thursday Fasting (Guruvar Vrat)**: Procedure — wake before sunrise, wear yellow, eat one meal after sunset (yellow foods: chana dal, kesar, turmeric rice), offer yellow flowers at Vishnu temple
- **Banana Charity (Kela Daan)**: Donate bananas and yellow items to Brahmins or temple on Thursdays
- **Vishnu/Brihaspati Worship**: Recite Vishnu Sahasranama or Brihaspati Stotram on Thursdays
- **Yantra**: Guru Yantra — copper plate, energize on a Thursday during Pushya nakshatra
- **Specific remedies for challenging transit houses**: Custom recommendations based on which houses have low ashtakavarga bindus
- **Educational/charitable acts**: Teaching, sponsoring education, donating to libraries — Jupiter remedies through knowledge-sharing
- **Guru Dakshinamurthy puja**: For enhanced wisdom and spiritual growth during Jupiter transit
- **Transit-specific timing**: When to intensify remedies (during challenging transit signs) and when to express gratitude (during favorable transits)

---

Generate this COMPLETE 7-chapter Jupiter transit report in ${language === "hi" ? "Hindi (Devanagari script, with Sanskrit terms naturally as used in Hindi Jyotish texts)" : "English (include Sanskrit/Hindi terms in parentheses for key Jyotish concepts)"}. Every prediction must reference this native's specific chart data — natal Jupiter position, house placements, ashtakavarga bindus, and active dasha period. Do NOT give generic Jupiter transit predictions.
  `.trim();
}
