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

/** Helper: planet-gemstone mapping */
function planetGemInfo(planet: string): string {
  const gems: Record<string, { primary: string; uparatna: string; metal: string; finger: string; day: string; mantra: string }> = {
    Sun: { primary: "Ruby (Manikya)", uparatna: "Red Garnet (Tamra Mani) / Red Spinel", metal: "Gold (Swarna)", finger: "Ring finger (Anamika)", day: "Sunday (Ravivaar)", mantra: "Om Hraam Hreem Hraum Sah Suryaya Namah" },
    Moon: { primary: "Natural Pearl (Moti)", uparatna: "Moonstone (Chandrakanta Mani)", metal: "Silver (Rajat)", finger: "Little finger (Kanishthika)", day: "Monday (Somvaar)", mantra: "Om Shraam Shreem Shraum Sah Chandraya Namah" },
    Mars: { primary: "Red Coral (Moonga/Praval)", uparatna: "Carnelian (Akik)", metal: "Gold or Copper (Tamba)", finger: "Ring finger (Anamika)", day: "Tuesday (Mangalvaar)", mantra: "Om Kraam Kreem Kraum Sah Bhaumaya Namah" },
    Mercury: { primary: "Emerald (Panna/Marakata)", uparatna: "Peridot (Zabarjad) / Green Tourmaline", metal: "Gold (Swarna)", finger: "Little finger (Kanishthika)", day: "Wednesday (Budhvaar)", mantra: "Om Braam Breem Braum Sah Budhaya Namah" },
    Jupiter: { primary: "Yellow Sapphire (Pukhraj/Pushparaag)", uparatna: "Yellow Topaz (Sunela) / Citrine", metal: "Gold (Swarna)", finger: "Index finger (Tarjani)", day: "Thursday (Guruvaar/Brihaspativaar)", mantra: "Om Graam Greem Graum Sah Gurave Namah" },
    Venus: { primary: "Diamond (Heera/Vajra)", uparatna: "White Sapphire (Safed Pukhraj) / White Zircon", metal: "Platinum or Silver (Rajat)", finger: "Middle finger (Madhyama) or Ring finger", day: "Friday (Shukravaar)", mantra: "Om Draam Dreem Draum Sah Shukraya Namah" },
    Saturn: { primary: "Blue Sapphire (Neelam/Neelmani)", uparatna: "Amethyst (Katela) / Iolite (Kaka Neeli)", metal: "Silver (Rajat) or Panchdhatu", finger: "Middle finger (Madhyama)", day: "Saturday (Shanivaar)", mantra: "Om Praam Preem Praum Sah Shanaischaraya Namah" },
    Rahu: { primary: "Hessonite Garnet (Gomed)", uparatna: "Orange Zircon / Spessartite Garnet", metal: "Silver (Rajat) or Ashtadhatu", finger: "Middle finger (Madhyama)", day: "Saturday (Shanivaar) during Rahu Kaal", mantra: "Om Bhram Bhreem Bhraum Sah Rahave Namah" },
    Ketu: { primary: "Cat's Eye (Lehsunia/Vaidurya)", uparatna: "Tiger's Eye / Chrysoberyl", metal: "Silver (Rajat) or Panchdhatu", finger: "Ring finger (Anamika) or Little finger", day: "Tuesday (Mangalvaar) or Saturday", mantra: "Om Shram Shreem Shraum Sah Ketave Namah" },
  };
  const g = gems[planet];
  if (!g) return "No gemstone data available for this planet";
  return `Primary: ${g.primary} | Substitute: ${g.uparatna} | Metal: ${g.metal} | Finger: ${g.finger} | Day: ${g.day} | Mantra: ${g.mantra}`;
}

/** Helper: planet-rudraksha mapping */
function planetRudraksha(planet: string): string {
  const rudrakshas: Record<string, string> = {
    Sun: "1-Mukhi (Ek Mukhi) or 12-Mukhi Rudraksha — ruled by Sun, for leadership, confidence, and vitality",
    Moon: "2-Mukhi (Do Mukhi) Rudraksha — ruled by Moon, for emotional balance, relationships, and mental peace",
    Mars: "3-Mukhi (Teen Mukhi) Rudraksha — ruled by Mars, for courage, energy, and overcoming laziness/fear",
    Mercury: "4-Mukhi (Char Mukhi) Rudraksha — ruled by Mercury, for intelligence, speech, education, and business acumen",
    Jupiter: "5-Mukhi (Panch Mukhi) Rudraksha — ruled by Jupiter, for wisdom, spirituality, health, and overall well-being",
    Venus: "6-Mukhi (Cheh Mukhi) Rudraksha — ruled by Venus, for love, creativity, luxury, and artistic expression",
    Saturn: "7-Mukhi (Saat Mukhi) Rudraksha — ruled by Saturn, for discipline, wealth, and relief from Shani Dosha",
    Rahu: "8-Mukhi (Aath Mukhi) Rudraksha — ruled by Rahu, for removing obstacles, Kaal Sarpa Dosha, and unexpected gains",
    Ketu: "9-Mukhi (Nau Mukhi) Rudraksha — ruled by Ketu, for spiritual growth, past-life karma resolution, and Durga blessings",
  };
  return rudrakshas[planet] || "No specific Rudraksha mapped";
}

export default function gemRecommendationPrompt(chartData: ChartData, language: "en" | "hi"): string {
  const { lagna, planets, houses, dashas, yogas, ashtakavarga } = chartData;

  const lagnaLord = lagna?.lord;
  const lagnaLordData = lagnaLord ? planets?.[lagnaLord] : undefined;
  const currentDashaLord = dashas?.current?.mahadasha;
  const currentDashaLordData = currentDashaLord ? planets?.[currentDashaLord] : undefined;

  // Build planet-gemstone reference table
  const planetNames = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
  const gemstoneTable = planetNames
    .map((p) => `- **${p}**: ${planetGemInfo(p)}`)
    .join("\n");

  const rudrakshaTable = planetNames
    .map((p) => `- **${p}**: ${planetRudraksha(p)}`)
    .join("\n");

  return `
# COMPREHENSIVE GEMSTONE RECOMMENDATION REPORT (Ratna Pariksha — Planetary Gemology)

You MUST produce a comprehensive, multi-chapter gemstone report following the EXACT structure below. Each chapter must contain detailed, substantive analysis — NOT brief summaries. Aim for the depth and quality of a professional Vedic gemology consultation (~12 pages).

---

## BIRTH CHART DATA

### Lagna (Ascendant)
- Sign: ${lagna?.sign || "Unknown"} (${lagna?.sign_num ?? "?"}th sign)
- Degrees: ${lagna?.degrees?.toFixed(2) ?? "N/A"}°
- Lagna Lord: ${lagnaLord || "Unknown"}
- Lagna Lord Position: ${lagnaLordData?.sign || "Unknown"} in ${lagnaLordData?.house ?? "?"}th house, ${lagnaLordData?.nakshatra || "Unknown"}${lagnaLordData?.retrograde ? " [RETROGRADE]" : ""}${lagnaLordData?.combust ? " [COMBUST]" : ""}

### Current Dasha Lord
- Mahadasha Lord: ${currentDashaLord || "Unknown"}
- Mahadasha Lord Position: ${currentDashaLordData?.sign || "Unknown"} in ${currentDashaLordData?.house ?? "?"}th house${currentDashaLordData?.retrograde ? " [RETROGRADE]" : ""}${currentDashaLordData?.combust ? " [COMBUST]" : ""}
- Antardasha: ${dashas?.current?.antardasha || "Unknown"}
- Period: ${dashas?.current?.mahadasha_start || "?"} to ${dashas?.current?.mahadasha_end || "?"}

### Complete Planetary Positions (CRITICAL for gemstone analysis)
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

### Gemstone Reference Data (Planet → Stone Mapping)
${gemstoneTable}

### Rudraksha Reference Data (Planet → Mukhi Mapping)
${rudrakshaTable}

---

## REQUIRED REPORT STRUCTURE — Generate ALL 8 Chapters

### Chapter 1: Planetary Strength Assessment (Graha Bala Pariksha)
For EACH of the 9 planets (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu), provide a detailed strength analysis:

For each planet, evaluate:
- **Dignity status**: Is the planet exalted (uchcha), own sign (swa-kshetra), friend's sign (mitra-kshetra), neutral (sama), enemy's sign (shatru-kshetra), or debilitated (neecha)? This is the MOST critical factor.
- **House placement**: Which house does it occupy? Is it in a kendra (1,4,7,10), trikona (1,5,9), dusthana (6,8,12), or upachaya (3,6,10,11)?
- **Combustion status**: Is it combust (too close to Sun)? Combust planets lose strength and their gemstone may need activation.
- **Retrograde status**: Is it retrograde? Retrograde planets have intensified energy — gemstones amplify this further. Consider carefully.
- **Aspects received**: Which planets aspect this planet? Benefic aspects (Jupiter, Venus, Mercury, waxing Moon) strengthen; malefic aspects (Saturn, Mars, Rahu, Ketu) afflict.
- **Conjunctions**: Is it conjunct benefics (strengthened) or malefics (afflicted)?
- **Lordship for this Lagna**: Which houses does this planet rule FOR THIS SPECIFIC LAGNA (${lagna?.sign || "Unknown"})? A planet ruling kendras + trikonas = yogakaraka (BEST for gemstone). A planet ruling dusthanas (6,8,12) = functional malefic (gemstone usually AVOIDED).
- **Overall verdict**: Does this planet need STRENGTHENING (wear its gemstone) or PACIFICATION (donate its gemstone, do not wear)?

After analyzing all 9 planets, rank them:
1. **Strongest benefics** (yogakarakas, well-placed functional benefics) — FIRST priority for gemstones
2. **Moderate benefics** (decently placed, would benefit from support) — SECOND priority
3. **Neutral planets** (neither strongly benefic nor malefic) — gemstone optional
4. **Functional malefics** (6th/8th/12th lords, afflicted planets) — gemstone usually AVOIDED
5. **Strongest malefics** (planets causing harm) — gemstone STRICTLY AVOIDED, pacification remedies instead

### Chapter 2: Primary Gemstone Recommendation (Pradhan Ratna)
Based on the planetary strength assessment, recommend the SINGLE most important gemstone:

Selection criteria (in order of priority):
1. **Lagna Lord gemstone** — if the lagna lord (${lagnaLord || "Unknown"}) is reasonably well-placed, its gemstone is almost always the safest first recommendation
2. **Yogakaraka planet gemstone** — if a yogakaraka exists for this lagna, its gemstone provides exceptional results
3. **Current Dasha Lord gemstone** — if the active mahadasha lord (${currentDashaLord || "Unknown"}) is a functional benefic, wearing its stone during its period amplifies positive results
4. **5th or 9th lord gemstone** — trinal lords are naturally benefic for any chart

For the primary gemstone, provide ALL of the following:
- **Gemstone name**: Sanskrit name and English name (e.g., Pukhraj / Yellow Sapphire)
- **Ruling planet**: Which planet this stone channels
- **Why this stone**: Detailed justification based on the chart analysis — why this planet needs strengthening, what benefits to expect
- **Minimum carat weight**: Specific recommendation (e.g., "minimum 3 carats for Yellow Sapphire, ideally 5+ carats for strong effect")
- **Quality requirements**: Clarity, color depth, inclusions to avoid, natural vs. treated (MUST be natural, untreated for Jyotish purposes)
- **Metal setting**: Gold (Swarna), Silver (Rajat), Platinum, Panchdhatu, or Ashtadhatu — which is best for this stone and why
- **Wearing finger**: Which finger on which hand, with Vedic reasoning (e.g., ring finger = Sun/Apollo energy)
- **Day to first wear**: Specific day of the week, ideally in the hora (planetary hour) of the ruling planet
- **Auspicious time (Muhurta)**: Shukla Paksha (waxing moon), specific nakshatra if possible, early morning after bath
- **Activation mantra**: The exact beej mantra to chant while wearing, with jaap count (typically 108 times)
- **Pran Pratishtha ritual**: Step-by-step activation ceremony — wash stone in Gangajal or raw milk, place on the relevant yantra, chant mantra 108 times, wear on the prescribed finger during the prescribed hora

### Chapter 3: Secondary Gemstone Recommendation (Dvitiya Ratna)
Recommend a second gemstone for additional support:

Selection criteria:
- **Current Dasha Lord** (if different from primary recommendation and is a functional benefic)
- **Complementary planet** — a planet whose gemstone works in synergy with the primary (friendly planets only)
- **Weakened benefic** — a naturally benefic planet that is afflicted and would benefit from gemstone support

Provide the SAME level of detail as Chapter 2:
- Stone name (Sanskrit + English), carat weight, quality, metal, finger, day, time, mantra, Pran Pratishtha
- Clear explanation of why this is the second priority and what additional benefits it provides
- Whether it can be worn SIMULTANEOUSLY with the primary gemstone (check planetary friendship)

### Chapter 4: Uparatna — Substitute Gemstones (Vikalp Ratna)
For each recommended gemstone (primary and secondary), provide budget-friendly alternatives:

For each Uparatna:
- **Substitute stone name**: Sanskrit and English (e.g., Sunela / Yellow Topaz as substitute for Pukhraj / Yellow Sapphire)
- **Efficacy comparison**: How does the substitute compare to the primary? (typically 60-70% effectiveness)
- **Carat weight**: Usually needs to be LARGER than the primary to compensate (e.g., 5+ carats for Topaz vs. 3 carats for Sapphire)
- **Price comparison**: Approximate cost ratio (e.g., "Yellow Topaz is approximately 1/20th the cost of Yellow Sapphire")
- **Same wearing rules**: Finger, metal, day, mantra remain the same as the primary
- **When Uparatna is acceptable**: For those who cannot afford the primary stone, the Uparatna provides meaningful benefit
- **When Uparatna is NOT enough**: Severe afflictions or dasha periods may require the primary stone for full effect

### Chapter 5: Gemstones to AVOID (Varjit Ratna — CRITICAL SAFETY)
This is one of the MOST IMPORTANT chapters — wearing the wrong gemstone can cause significant harm:

For each gemstone that should be AVOIDED, explain:
- **Stone name and its ruling planet**
- **Why it must be avoided**: Specific reasoning based on the chart:
  - Planet is a functional malefic (lords of 6th, 8th, or 12th house for ${lagna?.sign || "this"} Lagna)
  - Planet is a maraka (lords of 2nd or 7th house — death-inflicting houses)
  - Planet is severely afflicted and strengthening it would amplify negative results
  - Planet is an enemy of the lagna lord
- **What harm it can cause**: Specific negative effects if worn — health issues, financial losses, relationship problems, legal troubles, accidents
- **Common mistakes**: People often wear Blue Sapphire (Neelam) or Hessonite (Gomed) without proper chart analysis — explain why this is dangerous
- **Exception cases**: Are there any conditions under which this stone COULD be worn? (e.g., during a specific favorable dasha period only)

List ALL gemstones that should be avoided — typically 3-5 stones. Be explicit and firm about the dangers.

### Chapter 6: Combination Rules (Ratna Sanyojan Niyam)
Vedic gemology has strict rules about which stones can and cannot be worn together:

**Friendly Planet Groups (CAN be worn together):**
- Sun + Moon + Jupiter + Mars group (Ruby + Pearl + Yellow Sapphire + Red Coral)
- Mercury + Venus + Saturn group (Emerald + Diamond + Blue Sapphire)
- Explain which specific combinations from the above groups are relevant for THIS chart

**Enemy Planet Groups (CANNOT be worn together):**
- Sun's gem (Ruby) vs. Saturn's gem (Blue Sapphire) — bitter enemies
- Sun's gem (Ruby) vs. Venus's gem (Diamond) — enemies
- Moon's gem (Pearl) vs. Rahu's gem (Gomed) — conflicting energies
- Jupiter's gem (Yellow Sapphire) vs. Venus's gem (Diamond) — guru vs. pleasure
- Mars's gem (Red Coral) vs. Mercury's gem (Emerald) — aggression vs. intellect

For the native's specific recommendations:
- **Can the primary and secondary gems be worn together?** Detailed analysis.
- **Ring placement**: If wearing multiple rings, which hand and which fingers? Ensure no conflicting energies on the same hand.
- **Timing**: Can both be started on the same day or should they be staggered?
- **Metal compatibility**: If one gem requires gold and another silver, how to handle?

### Chapter 7: Rudraksha Alternatives (Rudraksha Vikalp)
For natives who prefer Rudraksha beads over gemstones (equally powerful Vedic remedy):

For each relevant planet (especially those matching the primary and secondary gemstone recommendations):
- **Mukhi count**: Which mukhi Rudraksha corresponds to this planet
- **Ruling deity**: Which deity presides over this Rudraksha
- **Benefits**: Specific benefits for the native based on the chart
- **Wearing method**: Throat (kanthamala), wrist (bracelet), or worshipped on altar
- **Mantra**: Activation mantra specific to the mukhi
- **Day to start wearing**: Same as the corresponding gemstone
- **Combination wearing**: Multiple Rudraksha beads can be strung together — which combinations are best for this chart?
- **Comparison with gemstone**: How does wearing the Rudraksha compare to the gemstone in efficacy?

Provide specific Rudraksha recommendations:
${rudrakshaTable}

### Chapter 8: Dasha-Based Gemstone Rotation (Dasha Anusaar Ratna Parivartan)
Gemstone needs change as dasha periods change — provide a complete rotation schedule:

For EACH upcoming dasha period in the sequence:
- **Dasha period**: Planet name, start date, end date
- **Is this planet a functional benefic for ${lagna?.sign || "this"} Lagna?** If yes, wearing its gemstone during this period is recommended.
- **Recommended gemstone for this period**: Name, carat, metal, finger — or "Continue current gemstone" if the primary recommendation covers this period too.
- **When to START wearing**: Ideally at the beginning of the mahadasha, on the appropriate day/hora.
- **When to STOP wearing**: At the end of the mahadasha, or if adverse effects are noticed.
- **Transition guidance**: When moving from one dasha to the next, how to transition gemstones — remove old stone ceremonially, purify, store respectfully. Begin new stone with fresh Pran Pratishtha.

**Current period focus**:
- Active ${dashas?.current?.mahadasha || "current"} Mahadasha / ${dashas?.current?.antardasha || "current"} Antardasha
- Is the primary recommended gemstone aligned with this dasha? If not, should an additional dasha-specific stone be worn?
- How does the antardasha lord affect gemstone choice?

**Long-term gemstone plan**: Map the next 20-30 years of dasha periods to a gemstone rotation schedule.

---

Generate this COMPLETE 8-chapter report in ${language === "hi" ? "Hindi (use Devanagari script, with Sanskrit terms naturally as used in Hindi Jyotish texts)" : "English (include Sanskrit/Hindi terms in parentheses for key concepts)"}. Each chapter must be substantial and detailed — this should read like a professional Vedic gemology consultation by an experienced Ratna Shastra expert, not a brief overview. Safety warnings about avoided gemstones must be EMPHATIC and clear.
  `.trim();
}
