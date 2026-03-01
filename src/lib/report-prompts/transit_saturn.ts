import { ChartData } from "../astro-client";
import { formatPlanets, formatHouses, formatDashaSequence, formatYogas, formatAshtakavarga, safeHousePlanets } from "./_helpers";

/** Helper: format yogas involving Saturn */
function formatSaturnYogas(yogas: ChartData["yogas"]): string {
  if (!yogas || yogas.length === 0) return "No yogas detected";
  const saturnYogas = yogas.filter(
    (y) =>
      y?.planets?.includes("Saturn") ||
      y?.name?.toLowerCase()?.includes("shani") ||
      y?.name?.toLowerCase()?.includes("saturn") ||
      y?.name?.toLowerCase()?.includes("sasa") ||
      y?.name?.toLowerCase()?.includes("sade") ||
      y?.name?.toLowerCase()?.includes("panoti")
  );
  if (saturnYogas.length === 0) return "No Saturn-specific yogas detected";
  return saturnYogas
    .map(
      (y) =>
        `- **${y?.name || "Unknown"}** [${y?.type || "?"}/${y?.strength || "?"}]: ${y?.description || "N/A"} | Planets: ${(Array.isArray(y?.planets) ? y.planets.join(", ") : String(y?.planets ?? "?"))} | Effect: ${y?.effect || "N/A"}`
    )
    .join("\n");
}

/** Helper: extract Saturn-specific ashtakavarga */
function formatSaturnAshtakavarga(ashtakavarga: ChartData["ashtakavarga"]): string {
  if (!ashtakavarga) return "Saturn Ashtakavarga data not available";
  const saturnBindus = ashtakavarga?.["Saturn"];
  if (!saturnBindus) return "Saturn Ashtakavarga not available";
  const signs = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];
  const total = saturnBindus?.reduce((a, b) => a + b, 0) ?? 0;
  const breakdown = signs
    .map((sign, i) => `  - ${sign}: ${saturnBindus?.[i] ?? "?"} bindus${(saturnBindus?.[i] ?? 0) >= 5 ? " (STRONG — easier transit)" : (saturnBindus?.[i] ?? 0) <= 2 ? " (WEAK — harsh transit)" : ""}`)
    .join("\n");
  return `- **Saturn Ashtakavarga** (Total: ${total} bindus)\n${breakdown}`;
}

export default function transitSaturnPrompt(chartData: ChartData, language: "en" | "hi"): string {
  const { lagna, planets, houses, dashas, yogas, ashtakavarga } = chartData;

  const saturnData = planets?.Saturn;
  const moonData = planets?.Moon;
  const sunData = planets?.Sun;

  // Saturn-related houses
  const house8 = houses?.["8"];
  const house10 = houses?.["10"];
  const house6 = houses?.["6"];
  const house12 = houses?.["12"];

  return `
# COMPREHENSIVE SATURN (SHANI) TRANSIT PREDICTIONS — SADE SATI & DHAIYA ANALYSIS

You MUST produce a detailed, multi-chapter Saturn transit report following the EXACT structure below. Each chapter must contain substantive analysis with specific predictions. Aim for ~25 pages of professional-quality content matching ClickAstro/AstroVision standards.

Saturn (Shani) is the planet of karma, discipline, delays, hardship, justice, longevity, and spiritual maturation. Its transit is the most feared and most transformative in Vedic astrology. Saturn takes ~29.5 years to complete one zodiac cycle, spending ~2.5 years in each sign. Its transit triggers Sade Sati (7.5 years of intense karmic reckoning) and Dhaiya (Small Panoti — 2.5-year challenge period).

---

## BIRTH CHART DATA

### Lagna (Ascendant)
- Sign: ${lagna?.sign || "Unknown"} (${lagna?.sign_num ?? "?"}th sign)
- Degrees: ${lagna?.degrees?.toFixed(2) ?? "N/A"}°
- Lagna Lord: ${lagna?.lord || "Unknown"}

### Natal Saturn (Shani) — Complete Profile
- Sign: ${saturnData?.sign || "Unknown"} (${saturnData?.sign_num ?? "?"}th sign)
- Degrees: ${saturnData?.degrees?.toFixed(2) ?? "?"}°
- House from Lagna: ${saturnData?.house ?? "?"}th house
- Nakshatra: ${saturnData?.nakshatra || "Unknown"}, Pada: ${saturnData?.pada ?? "?"}
- Nakshatra Lord: ${saturnData?.lord || "Unknown"}
- Status: ${saturnData?.retrograde ? "RETROGRADE" : "Direct"}${saturnData?.combust ? ", COMBUST" : ""}

### Natal Moon (Critical for Sade Sati Calculation)
- Sign: ${moonData?.sign || "Unknown"} (${moonData?.sign_num ?? "?"}th sign)
- Degrees: ${moonData?.degrees?.toFixed(2) ?? "?"}°
- House: ${moonData?.house ?? "?"}th
- Nakshatra: ${moonData?.nakshatra || "Unknown"}, Pada: ${moonData?.pada ?? "?"}
- Nakshatra Lord: ${moonData?.lord || "Unknown"}

### Natal Sun (Saturn's Natural Enemy)
- Sign: ${sunData?.sign || "Unknown"} (${sunData?.sign_num ?? "?"}th sign)
- House: ${sunData?.house ?? "?"}th
- Nakshatra: ${sunData?.nakshatra || "Unknown"}

### Complete Planetary Positions
${formatPlanets(planets)}

### All 12 Houses (Bhavas)
${formatHouses(houses)}

### Saturn-Related Houses
- **6th House (Enemies/Service)**: ${house6?.sign || "?"}, Lord: ${house6?.lord || "?"}, Occupants: ${safeHousePlanets(house6)}
- **8th House (Longevity/Transformation)**: ${house8?.sign || "?"}, Lord: ${house8?.lord || "?"}, Occupants: ${safeHousePlanets(house8)}
- **10th House (Karma/Career — Saturn's Dig Bala)**: ${house10?.sign || "?"}, Lord: ${house10?.lord || "?"}, Occupants: ${safeHousePlanets(house10)}
- **12th House (Losses/Moksha)**: ${house12?.sign || "?"}, Lord: ${house12?.lord || "?"}, Occupants: ${safeHousePlanets(house12)}

### Yogas Involving Saturn
${formatSaturnYogas(yogas)}

### All Detected Yogas (${yogas?.length ?? 0} total)
${formatYogas(yogas)}

### Vimshottari Dasha System
- **Balance at Birth**: ${dashas?.balance_at_birth?.planet || "?"} Dasha — ${dashas?.balance_at_birth?.years ?? "?"}Y ${dashas?.balance_at_birth?.months ?? "?"}M ${dashas?.balance_at_birth?.days ?? "?"}D remaining
- **Current Period**: ${dashas?.current?.mahadasha || "?"} Mahadasha / ${dashas?.current?.antardasha || "?"} Antardasha
  - Mahadasha: ${dashas?.current?.mahadasha_start || "?"} to ${dashas?.current?.mahadasha_end || "?"}
  - Antardasha: ${dashas?.current?.antardasha_start || "?"} to ${dashas?.current?.antardasha_end || "?"}

### Complete Dasha Sequence
${formatDashaSequence(dashas)}

### Ashtakavarga — Complete Data
${formatAshtakavarga(ashtakavarga)}

### Saturn-Specific Ashtakavarga
${formatSaturnAshtakavarga(ashtakavarga)}

---

## REQUIRED REPORT STRUCTURE — Generate ALL 8 Chapters

### Chapter 1: Natal Saturn Profile (Shani Swaroop)
- Saturn's sign placement: Is Saturn exalted (Libra), in own sign (Capricorn/Aquarius), in friend's sign, enemy's sign, or debilitated (Aries)? What dignity does natal Saturn hold?
- Saturn's house placement: What life areas does Saturn naturally restrict, delay, or mature from its natal position?
- Saturn's nakshatra analysis: How does the nakshatra lord influence Saturn's karmic expression?
- Saturn's special aspects: Saturn casts powerful aspects on the 3rd, 7th, and 10th houses from itself. Identify which houses receive Saturn's drishti and how they are affected — discipline, restriction, or delayed rewards in those areas.
- Saturn as house lord: Which houses does Saturn rule for this lagna (${lagna?.sign || "Unknown"})? Is Saturn a Yogakaraka (functional benefic) for this lagna? (Saturn is Yogakaraka for Taurus and Libra ascendants.)
- Saturn's conjunctions: Any planets conjunct natal Saturn? How does Saturn restrict or discipline those planets?
- Saturn's relationship with other planets: Saturn's natural friends (Mercury, Venus), enemies (Sun, Moon, Mars), and neutral (Jupiter). How do these relationships play out in this chart?
- Retrograde/combust analysis: If retrograde, Saturn intensifies its karmic lessons internally. If combust (rare), Saturn's authority is overshadowed by the Sun.

### Chapter 2: Sade Sati Analysis (Elinati Shani / 7.5 Years of Saturn)
Sade Sati occurs when Saturn transits the 12th house, 1st house (over natal Moon), and 2nd house from the Moon sign. This is a ~7.5 year period of intense karmic processing.

- **Moon sign identification**: The native's Moon is in ${moonData?.sign || "Unknown"}. Therefore:
  - **Sade Sati begins** when Saturn enters the sign BEFORE ${moonData?.sign || "the Moon sign"} (12th from Moon)
  - **Peak phase** when Saturn transits OVER ${moonData?.sign || "the Moon sign"} (1st from Moon)
  - **Ending phase** when Saturn enters the sign AFTER ${moonData?.sign || "the Moon sign"} (2nd from Moon)

- **Three Phases of Sade Sati — Detailed Analysis:**
  1. **Rising Phase (Saturn in 12th from Moon)**: ~2.5 years
     - Financial pressures, sleep disturbances, expenses increase
     - Loss of comfort, eye problems, spiritual restlessness
     - Foreign travel or displacement possible
     - Relationship with mother may be strained
  2. **Peak Phase (Saturn over Moon sign)**: ~2.5 years — THE MOST INTENSE
     - Mental pressure, emotional turbulence, self-doubt
     - Health challenges (especially if Moon is weak in the chart)
     - Major life restructuring — career changes, relocations
     - Relationship testing — marriages tested, separations possible
     - This is the "crucible" period — what survives it becomes permanent
  3. **Setting Phase (Saturn in 2nd from Moon)**: ~2.5 years
     - Financial restructuring, family tensions, speech-related issues
     - Dietary changes, eye/dental issues possible
     - Gradual easing of pressure — lessons crystallize
     - Wealth may actually increase if Saturn has high ashtakavarga bindus in the 2nd-from-Moon sign

- **Exact Sade Sati Dates**: Calculate approximate start/end dates for the current or next Sade Sati based on Moon in ${moonData?.sign || "Unknown"}
- **Previous Sade Sati periods**: Based on the ~29.5 year cycle, when were the native's past Sade Sati periods? What ages did they correspond to? What life events correlate?
- **Sade Sati severity modifiers**:
  - Is Saturn a Yogakaraka for this lagna? (reduces severity significantly)
  - Does Saturn have high ashtakavarga bindus in the Sade Sati signs?
  - Is natal Moon strong (full, in own/exalted sign) or weak (waning, in enemy sign)?
  - Any benefic aspects on Moon that protect during Sade Sati?

### Chapter 3: Dhaiya / Small Panoti (Kantaka Shani & Ashtama Shani)
Dhaiya is a 2.5-year challenging period when Saturn transits the 4th or 8th house from Moon.

- **Saturn in 4th from Moon (Kantaka Shani)**: ~2.5 years
  - Domestic upheaval, property disputes, vehicle troubles
  - Mother's health concerns, loss of mental peace
  - Educational obstacles, heart/chest-related health issues
  - Career instability, loss of status
  - Calculate exact dates based on Moon in ${moonData?.sign || "Unknown"}

- **Saturn in 8th from Moon (Ashtama Shani)**: ~2.5 years — Second most challenging after Sade Sati
  - Sudden obstacles, chronic health issues, accidents possible
  - Financial setbacks through unexpected events
  - Transformation of deep-seated patterns
  - Research, occult interests may develop
  - Longevity-related anxieties
  - Calculate exact dates based on Moon in ${moonData?.sign || "Unknown"}

- **Previous Dhaiya periods**: When were past Dhaiya periods? What happened?
- **Dhaiya vs Sade Sati**: Compare severity — Dhaiya is shorter but can be sharp and sudden
- **Mitigation factors**: Ashtakavarga bindus in the 4th and 8th signs from Moon

### Chapter 4: House-by-House Saturn Transit Analysis (Gochar Phala)
For EACH of the 12 houses, provide a complete analysis from BOTH Lagna and Moon sign:

**For each house, cover:**
- The sign Saturn transits through when in this house
- Approximate duration (~2.5 years) and date range
- **Career & profession effects**: Job stability, authority figures, government dealings, discipline at work
- **Financial effects**: Savings (Saturn favors savings), debts, long-term investments, property
- **Health effects**: Chronic conditions, bones/joints/teeth (Saturn-ruled), aging effects, stamina
- **Relationship effects**: Marriage stability, authority dynamics with spouse, elder relationships
- **Saturn's special aspects from this house**: 3rd, 7th, and 10th aspects — which natal planets/houses are aspected and what does that trigger?
- **Mental/emotional effects**: Discipline, depression, isolation, maturity, wisdom gained through hardship
- **Overall rating**: Highly challenging / Challenging / Neutral / Favorable / Growth through discipline

Classical Vedic reference:
- Saturn favorable in: 3rd, 6th, 11th from Moon (Upachaya houses)
- Saturn challenging in: 1st, 2nd, 4th, 5th, 7th, 8th, 9th, 10th, 12th from Moon
- Modify based on Saturn's ashtakavarga bindus in each transit sign

### Chapter 5: Saturn Return (Shani Ki Dhaiyya / Shani Prathyaavartana)
- Saturn's natal position: ${saturnData?.sign || "Unknown"} at ${saturnData?.degrees?.toFixed(2) ?? "?"}°
- **Saturn return cycle**: ~29.5 years
- **First Saturn Return (~age 29-30)**: Major life restructuring — career crystallization, relationship commitment or ending, taking on adult responsibilities. The "make or break" period.
- **Second Saturn Return (~age 58-60)**: Life review, retirement planning, legacy concerns, health reassessment, wisdom consolidation
- **Third Saturn Return (~age 87-89)**: End-of-life review, spiritual culmination
- **Calculate exact dates** for each Saturn return based on natal Saturn at ${saturnData?.degrees?.toFixed(2) ?? "?"}° ${saturnData?.sign || "Unknown"}
- **Previous Saturn returns**: What life events correlate with past returns?
- **Upcoming Saturn return**: When is the next return? What dasha will be active? How does the dasha lord interact with Saturn?
- **Preparing for Saturn return**: Actions to take 1-2 years before Saturn return to maximize its restructuring potential

### Chapter 6: Saturn's Aspects During Transit (Shani Drishti Analysis)
Saturn's 3rd, 7th, and 10th aspects are among the most powerful in Vedic astrology:

- **As Saturn transits each sign**, identify which NATAL PLANETS receive Saturn's aspect:
  - 3rd aspect: Pressure to act, forced courage, communication restrictions
  - 7th aspect (full aspect): Direct opposition — confrontation, relationship testing, partnership restructuring
  - 10th aspect: Career pressure, authority challenges, public scrutiny

- For EACH natal planet that receives Saturn's transit aspect, detail:
  - When the aspect becomes exact (degrees)
  - What life areas are pressured
  - Duration of the aspect's influence
  - Whether the natal planet is a friend or enemy of Saturn (modifies results)
  - Remedies specific to that aspect

- **Critical aspect combinations**: When does transiting Saturn aspect natal Sun (father/authority issues), Moon (mental pressure), Mars (accidents/conflicts), or Rahu/Ketu (karmic intensification)?

### Chapter 7: Ashtakavarga Saturn Analysis
- Saturn's bindus in each of the 12 signs (Aries through Pisces)
- **Strong transit signs** (5+ bindus): Even Saturn becomes tolerable or constructive when transiting signs with high bindus. Identify these signs and the corresponding houses — these are periods where Saturn's discipline yields tangible rewards.
- **Moderate transit signs** (3-4 bindus): Standard Saturn effects — challenges that build character
- **Weak transit signs** (0-2 bindus): MOST CHALLENGING — Saturn at its harshest. Identify these signs and warn about specific periods.
- **Sade Sati severity through Ashtakavarga**: Check Saturn's bindus in the 12th, 1st, and 2nd signs from Moon. High bindus = manageable Sade Sati. Low bindus = extremely difficult.
- **Sarvashtakavarga correlation**: Total bindus in each house — Saturn transit through low-total-bindu houses is doubly difficult
- **Transit timing predictions**: For the next 29.5 years, rank each ~2.5-year Saturn transit period from easiest to hardest based on ashtakavarga

### Chapter 8: Saturn (Shani) Transit Remedies (Shani Shanti Upaya)

**8a. Gemstone Remedies:**
- **Blue Sapphire (Neelam)**: THE most powerful and dangerous gemstone. EXTREME CAUTION required.
  - Should ONLY be worn if Saturn is a Yogakaraka or functional benefic for this lagna
  - Trial period: Wear tied in a blue cloth on the body for 3 days — observe for accidents, losses, bad dreams. If negative effects, DO NOT wear.
  - If suitable: 3-7 carat, set in silver or panchdhatu, worn on middle finger of right hand, start on a Saturday during Pushya nakshatra or Saturn hora
  - NEVER wear if Saturn is a functional malefic or if Sade Sati is at peak phase
- **Alternative stones**: Amethyst (safer substitute), Iolite (budget option), Lapis Lazuli (mild effect)
- For this chart specifically: Is Blue Sapphire recommended or not? Provide clear reasoning.

**8b. Mantra Remedies:**
- **Shani Beej Mantra**: "Om Praam Preem Praum Sah Shanaischaraya Namah" — 23,000 jaap for one mandala
- **Shani Vedic Mantra**: "Om Shanno Devir Abhishtaya Aapo Bhavantu Peetaye..." — for Sade Sati relief
- **Shani Gayatri**: "Om Shanaischaraya Vidmahe Mandamandaya Dheemahi Tanno Manda Prachodayat"
- **Dasharatha Shani Stotra**: Recitation of the stotra where King Dasharatha pacified Saturn — specific to Sade Sati relief
- Best chanted on Saturdays during Saturn hora, facing West

**8c. Saturday Fasting (Shanivar Vrat):**
- Procedure: Wake before sunrise, take oil bath (sesame oil on head), wear black/dark blue/purple clothes
- Eat one meal after sunset — black urad dal, sesame (til) items, black salt
- Light a sesame oil lamp (diya) at a Shani temple or under a Peepal tree at sunset
- Continue for 11 or 51 consecutive Saturdays for maximum effect

**8d. Oil & Sesame Donation (Tel Daan):**
- Donate mustard oil, black sesame seeds (til), iron items, black cloth, black urad dal on Saturdays
- Donate to laborers, servants, or the underprivileged (Saturn represents the working class)
- Pour mustard oil on a Shani idol or over an iron nail at a Shani temple

**8e. Hanuman Chalisa:**
- Recite Hanuman Chalisa daily, especially on Saturdays and Tuesdays
- Hanuman is the most powerful remedy for Saturn afflictions (Hanuman subdued Shani)
- Visit Hanuman temple on Saturdays, offer sindoor and jasmine oil

**8f. Black Sesame Charity (Til Daan):**
- Donate black sesame seeds wrapped in black cloth on Saturdays
- Feed crows (Shani's vehicle/vahana) with rice mixed with black sesame
- Donate footwear (chappal/shoes) to the poor — Saturn rules feet and the underprivileged

**8g. Specific Remedies Based on This Chart:**
- Based on Saturn's natal house and transit patterns for THIS chart, provide customized remedy schedule
- If Sade Sati is active/approaching: Intensified remedy regimen
- If Saturn dasha or antardasha is running concurrently: Double the remedy intensity
- Remedies for specific Saturn aspects on natal planets identified in Chapter 6

**8h. Service-Based Remedies (Seva):**
- Serve elderly people, especially on Saturdays (Saturn represents old age)
- Feed the disabled and underprivileged (Saturn represents suffering)
- Respect servants and workers — never disrespect anyone who serves you
- Practice patience and accept delays without frustration (Saturn's core lesson)
- Maintain discipline in daily routine — Saturn rewards structure and punishes chaos

---

Generate this COMPLETE 8-chapter Saturn transit report in ${language === "hi" ? "Hindi (Devanagari script, with Sanskrit terms naturally as used in Hindi Jyotish texts)" : "English (include Sanskrit/Hindi terms in parentheses for key Jyotish concepts)"}. Every prediction must reference this native's specific chart data — natal Saturn position, Moon sign for Sade Sati calculation, house placements, ashtakavarga bindus, and active dasha period. Do NOT give generic Saturn transit predictions. This report should be specific, actionable, and reflect the depth of a professional Jyotish consultation.
  `.trim();
}
