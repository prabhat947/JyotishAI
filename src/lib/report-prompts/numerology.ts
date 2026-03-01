import { ChartData } from "../astro-client";
import { formatPlanets } from "./_helpers";

/** Helper: map number to ruling planet */
function rulingPlanet(num: number | undefined): string {
  if (num === undefined || num === null) return "Unknown";
  const map: Record<number, string> = {
    1: "Sun (Surya)",
    2: "Moon (Chandra)",
    3: "Jupiter (Guru/Brihaspati)",
    4: "Rahu (North Node)",
    5: "Mercury (Budha)",
    6: "Venus (Shukra)",
    7: "Ketu (South Node)",
    8: "Saturn (Shani)",
    9: "Mars (Mangal)",
  };
  return map[num] || "Unknown";
}

export default function numerologyPrompt(chartData: ChartData, language: "en" | "hi"): string {
  const { lagna, planets, dashas, yogas, numerology } = chartData;

  if (!numerology) {
    return "Numerology data is not available for this chart. The birth chart does not include numerological calculations (birth number, destiny number, name number). Please ensure numerology data is provided to generate this report.";
  }

  const birthNum = numerology?.birth_number;
  const destinyNum = numerology?.destiny_number;
  const nameNum = numerology?.name_number;

  return `
# COMPREHENSIVE NUMEROLOGY REPORT (Anka Jyotish / Sankhya Shastra)

You MUST produce a comprehensive, multi-chapter numerology report following the EXACT structure below. Each chapter must contain detailed, substantive analysis — NOT brief summaries. Aim for the depth and quality of a professional numerology consultation (~10 pages).

---

## CORE NUMEROLOGY DATA

### Primary Numbers
- **Birth Number (Moolank)**: ${birthNum ?? "Not calculated"} — Ruling Planet: ${rulingPlanet(birthNum)}
- **Destiny Number (Bhagyank)**: ${destinyNum ?? "Not calculated"} — Ruling Planet: ${rulingPlanet(destinyNum)}
- **Name Number (Namank)**: ${nameNum ?? "Not calculated"} — Ruling Planet: ${rulingPlanet(nameNum)}

### Astrological Context (for cross-reference)
- Lagna: ${lagna?.sign || "Unknown"} (${lagna?.sign_num ?? "?"}th sign), Lord: ${lagna?.lord || "Unknown"}
- Moon Sign: ${planets?.Moon?.sign || "Unknown"} in ${planets?.Moon?.house ?? "?"}th house, ${planets?.Moon?.nakshatra || "Unknown"}
- Sun Sign: ${planets?.Sun?.sign || "Unknown"} in ${planets?.Sun?.house ?? "?"}th house

### Complete Planetary Positions (for numerology-astrology correlation)
${formatPlanets(planets)}

### Current Dasha Period
- **Current Period**: ${dashas?.current?.mahadasha || "?"} Mahadasha / ${dashas?.current?.antardasha || "?"} Antardasha
  - Mahadasha: ${dashas?.current?.mahadasha_start || "?"} to ${dashas?.current?.mahadasha_end || "?"}
  - Antardasha: ${dashas?.current?.antardasha_start || "?"} to ${dashas?.current?.antardasha_end || "?"}

### Detected Yogas (${yogas?.length ?? 0} total — for cross-reference)
${yogas && yogas.length > 0 ? yogas.map((y) => `- **${y?.name || "Unknown"}** [${y?.type || "?"}/${y?.strength || "?"}]: ${y?.effect || "N/A"}`).join("\n") : "No yogas detected"}

---

## REQUIRED REPORT STRUCTURE — Generate ALL 8 Chapters

### Chapter 1: Core Numbers Overview (Mool Anka Parichay)
Provide a unified overview of the three core numbers and their interplay:
- **Birth Number ${birthNum ?? "?"}**: The personality number — derived from the day of birth. It reveals the inner self, natural traits, and the lens through which the native views the world. Ruled by ${rulingPlanet(birthNum)}.
- **Destiny Number ${destinyNum ?? "?"}**: The life-path number — derived from the full date of birth. It reveals the soul's mission, karmic direction, and the ultimate purpose of this incarnation. Ruled by ${rulingPlanet(destinyNum)}.
- **Name Number ${nameNum ?? "?"}**: The social number — derived from the full name using Chaldean/Vedic numerology. It reveals how others perceive the native, professional image, and social success. Ruled by ${rulingPlanet(nameNum)}.
- **Ruling Planet Alignment**: Are the ruling planets of all three numbers friendly, neutral, or enemy to each other? This determines internal harmony or conflict.
- **Number-Astrology correlation**: How do the numerological ruling planets compare with the actual natal positions of those planets in the birth chart? For example, if Birth Number is 1 (Sun), what is Sun's actual placement and strength in the horoscope?

### Chapter 2: Birth Number Deep Analysis (Moolank Vishleshana) — Number ${birthNum ?? "?"}
Provide exhaustive analysis of the Birth Number:
- **Core personality traits**: At least 10 specific personality characteristics associated with this number. Both positive and shadow traits.
- **Natural talents and abilities**: What does the native excel at without trying? Innate gifts from birth.
- **Behavioral patterns**: How the native approaches problems, relationships, decision-making, and stress.
- **Physical characteristics**: Body type, health tendencies, energy levels, and vitality patterns associated with this number.
- **Ruling planet connection**: ${rulingPlanet(birthNum)} governs this number — how does this planet's energy manifest in daily personality? Compare with the natal placement of this planet in the birth chart.
- **Strengths**: Top 5 strengths with detailed explanation of each.
- **Weaknesses/Challenges**: Top 5 challenges with practical advice for overcoming each.
- **Emotional nature**: How the native processes emotions, expresses feelings, and handles emotional crises.
- **Intellectual style**: Learning preferences, thinking patterns, analytical vs. creative orientation.
- **Spiritual inclination**: The spiritual dimension of this number — what form of spiritual practice suits the native.

### Chapter 3: Destiny Number Deep Analysis (Bhagyank Vishleshana) — Number ${destinyNum ?? "?"}
Provide exhaustive analysis of the Destiny Number:
- **Life purpose and karmic mission**: What is the soul here to achieve? What lessons must be learned?
- **Career paths**: At least 10 specific career fields/industries that align with this destiny number. Not generic — specific roles and domains.
- **Major life themes**: Recurring patterns and themes that will run through the native's life (wealth, relationships, health, spirituality, travel, leadership, service, etc.).
- **Destiny activation periods**: At what ages does the destiny number activate most powerfully? (Typically multiples of the destiny number and related ages.)
- **Karmic debts and credits**: What past-life karma does this number indicate? What must be balanced?
- **Relationship patterns**: What kind of partners does this destiny attract? What relationship lessons appear?
- **Wealth trajectory**: Financial patterns — early wealth vs. late wealth, steady vs. fluctuating income, types of wealth accumulation.
- **Health trajectory**: Long-term health patterns, body systems to watch, preventive measures.
- **Ruling planet connection**: ${rulingPlanet(destinyNum)} governs the destiny — how does this planet's energy shape the life path? Compare with natal chart placement.

### Chapter 4: Name Number Analysis (Namank Vishleshana) — Number ${nameNum ?? "?"}
${nameNum ? `Provide detailed analysis of the Name Number:
- **Social image and perception**: How the world sees the native — first impressions, public persona, professional reputation.
- **Professional persona**: How the name number shapes career success, business relationships, and workplace dynamics.
- **Name vibration quality**: Is the current name vibration harmonious with the birth and destiny numbers? Synergy or conflict?
- **Name number ruling planet**: ${rulingPlanet(nameNum)} — is this planet friendly or enemy to the birth number and destiny number rulers?
- **Name spelling optimization**: If the name number is not harmonious, suggest specific letter additions/changes (using Chaldean numerology values) that would create a more favorable vibration. Provide 2-3 alternative spellings with their resulting name numbers.
- **Business name guidance**: What name number is ideal for a business run by this native? What vibrations to seek and avoid.
- **Signature analysis**: How the signature style should reflect the name number for maximum benefit.
- **Social media and online presence**: How the name number affects digital presence, username selection, and online branding.` :
`Name Number was not calculated. This section cannot be analyzed without the name number. To get a complete analysis, the native's full name should be evaluated using the Chaldean numerology system to derive the name number. General guidance: Choose a name whose total vibration is friendly to birth number ${birthNum ?? "?"} and destiny number ${destinyNum ?? "?"}.`}

### Chapter 5: Number Synergy Analysis (Anka Samanvay)
Analyze the interaction between all three core numbers:
- **Birth + Destiny compatibility**: Are numbers ${birthNum ?? "?"} and ${destinyNum ?? "?"} naturally harmonious? Do their ruling planets (${rulingPlanet(birthNum)} and ${rulingPlanet(destinyNum)}) support each other?
  - Harmonious: The personality naturally aligns with the life purpose. Success comes more easily.
  - Conflicting: Internal tension between who the native IS and what they're MEANT to do. Requires conscious integration.
- **Birth + Name compatibility**: Do numbers ${birthNum ?? "?"} and ${nameNum ?? "?"} support each other? Social image vs. inner self alignment.
- **Destiny + Name compatibility**: Do numbers ${destinyNum ?? "?"} and ${nameNum ?? "?"} support each other? Life purpose vs. public projection alignment.
- **Triple harmony assessment**: Overall harmony score — are all three numbers working together or pulling in different directions?
- **Internal conflict resolution**: If numbers conflict, provide specific practices for integrating opposing energies.
- **Compound number analysis**: Any hidden influences from the compound (two-digit) numbers before reduction? (e.g., 29 reduces to 11 then 2 — the influence of 11 as a master number).
- **Master numbers**: If any core number is 11, 22, or 33 — explain the master number significance and heightened responsibility.

### Chapter 6: Lucky Elements (Shubh Tatva)
Provide comprehensive lucky/favorable elements:
- **Lucky Numbers**: Primary lucky numbers (based on birth + destiny), secondary lucky numbers, numbers to use in daily life (phone, vehicle, house).
- **Unlucky Numbers**: Numbers to avoid and why — based on enemy planet relationships.
- **Lucky Days of the Week**: Which days favor major decisions, business launches, travel, and spiritual practices. Map each day to its ruling planet and relationship with the native's numbers.
- **Lucky Dates of the Month**: Specific dates (1-31) that are most favorable for important activities. Dates to avoid.
- **Lucky Colors**: Primary color (based on birth number), secondary colors (destiny and name), colors to wear daily, colors to avoid.
- **Lucky Directions**: Cardinal and intercardinal directions favorable for sleeping, working, sitting, and traveling.
- **Lucky Gemstones**: Stones aligned with each core number's ruling planet — primary and substitute. Weight, metal, finger.
- **Lucky Metals**: Gold, silver, copper, iron — which metal is most favorable.
- **Compatible Numbers**: Which birth numbers make the best life partners, business partners, friends, and collaborators? Which to avoid?

### Chapter 7: Personal Year Forecast (Vyaktigat Varsh Phal)
Calculate and analyze the current personal year and full 9-year cycle:
- **Current Personal Year Number**: Calculate from the current date and the native's birth date. What does this year's number signify?
- **Detailed current year analysis**: Major themes, opportunities, challenges, and advice for the current personal year. At least 1 page of analysis covering career, finances, health, relationships, and spirituality.
- **9-Year Cycle Forecast**: For EACH of the next 9 personal years (current + 8 upcoming), provide:
  - Year number and ruling planet
  - Overall theme (e.g., Year 1 = new beginnings, Year 5 = change and freedom, Year 9 = completion)
  - Career outlook
  - Financial outlook
  - Relationship dynamics
  - Health focus areas
  - Best months within the year
  - Key advice
- **Peak years**: Which personal years in the cycle will be the strongest for this native based on birth/destiny number alignment?
- **Challenging years**: Which personal years will require extra care? What preparations can be made?

### Chapter 8: Practical Recommendations (Vyavaharik Anushan)
Provide actionable, real-world numerology-based guidance:
- **Business name selection**: What total number should the business name sum to? Provide a formula and examples.
- **Vehicle number selection**: What digits to seek and avoid in vehicle registration numbers.
- **Phone number selection**: Ideal digits and sums for mobile numbers.
- **House/flat number**: What residence numbers are favorable and which to avoid.
- **Important date selection**: How to pick auspicious dates for major events (marriage, business launch, travel, surgery) using personal numbers.
- **Bank account and financial timing**: Best dates for large transactions, investments, and financial commitments.
- **Color therapy**: Daily color schedule — which colors to wear each day of the week based on the native's numbers.
- **Meditation and mantras**: Number-specific mantras for the ruling planets of each core number. Jaap counts aligned with numerology.
- **Diet and health**: Foods and dietary habits aligned with the native's numerological profile.
- **Relationship advice**: How to handle key relationships (spouse, children, boss, colleagues) based on number compatibility.

---

Generate this COMPLETE 8-chapter report in ${language === "hi" ? "Hindi (use Devanagari script, with Sanskrit terms naturally as used in Hindi Jyotish texts)" : "English (include Sanskrit/Hindi terms in parentheses for key concepts)"}. Each chapter must be substantial and detailed — this should read like a professional numerology consultation providing deep insight into the native's life through the lens of numbers, not a brief overview.
  `.trim();
}
