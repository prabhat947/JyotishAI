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

/** Helper: filter career-relevant yogas */
function formatCareerYogas(yogas: ChartData["yogas"]): string {
  if (!yogas || yogas.length === 0) return "No yogas detected";
  const careerTypes = ["raj", "dhana", "pancha_mahapurusha", "solar"];
  const careerKeywords = ["career", "profession", "authority", "power", "fame", "status", "government", "leadership", "raja", "amala", "budhaditya"];
  const careerYogas = yogas.filter(
    (y) =>
      careerTypes.includes(y?.type || "") ||
      careerKeywords.some((kw) => (y?.name || "").toLowerCase().includes(kw) || (y?.description || "").toLowerCase().includes(kw))
  );
  if (careerYogas.length === 0) return "No career-specific yogas detected (see full yoga list below)";
  return careerYogas
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

export default function careerPrompt(chartData: ChartData, language: "en" | "hi"): string {
  const { lagna, planets, houses, dashas, yogas, ashtakavarga } = chartData;

  const house10 = houses?.["10"];
  const house10Lord = house10?.lord ? planets?.[house10.lord] : undefined;
  const house6 = houses?.["6"];
  const house6Lord = house6?.lord ? planets?.[house6.lord] : undefined;
  const house7 = houses?.["7"];
  const house7Lord = house7?.lord ? planets?.[house7.lord] : undefined;
  const house3 = houses?.["3"];
  const house3Lord = house3?.lord ? planets?.[house3.lord] : undefined;
  const house2 = houses?.["2"];
  const house2Lord = house2?.lord ? planets?.[house2.lord] : undefined;
  const house11 = houses?.["11"];
  const house11Lord = house11?.lord ? planets?.[house11.lord] : undefined;
  const house9 = houses?.["9"];
  const house9Lord = house9?.lord ? planets?.[house9.lord] : undefined;
  const lagnaLord = lagna?.lord ? planets?.[lagna.lord] : undefined;

  return `
# CAREER & BUSINESS HOROSCOPE ANALYSIS (Karma Bhava Phal)

You MUST produce a comprehensive, multi-chapter career horoscope report following the EXACT structure below. Each chapter must contain detailed, substantive analysis with specific predictions and actionable guidance. Aim for the depth of a professional ClickAstro/AstroVision career report (~20 pages).

---

## BIRTH CHART DATA

### Lagna (Ascendant)
- Sign: ${lagna?.sign || "Unknown"} (${lagna?.sign_num ?? "?"}th sign)
- Degrees: ${lagna?.degrees?.toFixed(2) ?? "N/A"}°
- Lagna Lord: ${lagna?.lord || "Unknown"}
- Lagna Lord Position: ${lagnaLord?.sign || "?"} in ${lagnaLord?.house ?? "?"}th house, ${lagnaLord?.nakshatra || "?"} Nakshatra${lagnaLord?.retrograde ? " [RETROGRADE]" : ""}

### Key Career Houses
- **10th House (Karma Bhava — Career/Profession)**: ${house10?.sign || "?"}, Lord: ${house10?.lord || "?"}, Occupants: ${house10?.planets?.length ? house10.planets.join(", ") : "Empty"}
- **10th Lord Position**: ${house10Lord?.sign || "?"} in ${house10Lord?.house ?? "?"}th house, ${house10Lord?.nakshatra || "?"} Nakshatra${house10Lord?.retrograde ? " [RETROGRADE]" : ""}${house10Lord?.combust ? " [COMBUST]" : ""}
- **6th House (Ripu Bhava — Service/Competition)**: ${house6?.sign || "?"}, Lord: ${house6?.lord || "?"}, Occupants: ${house6?.planets?.length ? house6.planets.join(", ") : "Empty"}
- **6th Lord Position**: ${house6Lord?.sign || "?"} in ${house6Lord?.house ?? "?"}th house${house6Lord?.retrograde ? " [RETROGRADE]" : ""}
- **7th House (Kalatra Bhava — Partnerships/Business)**: ${house7?.sign || "?"}, Lord: ${house7?.lord || "?"}, Occupants: ${house7?.planets?.length ? house7.planets.join(", ") : "Empty"}
- **7th Lord Position**: ${house7Lord?.sign || "?"} in ${house7Lord?.house ?? "?"}th house${house7Lord?.retrograde ? " [RETROGRADE]" : ""}
- **3rd House (Sahaja Bhava — Self-Effort/Communication)**: ${house3?.sign || "?"}, Lord: ${house3?.lord || "?"}, Occupants: ${house3?.planets?.length ? house3.planets.join(", ") : "Empty"}
- **3rd Lord Position**: ${house3Lord?.sign || "?"} in ${house3Lord?.house ?? "?"}th house${house3Lord?.retrograde ? " [RETROGRADE]" : ""}
- **9th House (Dharma Bhava — Fortune/Higher Learning)**: ${house9?.sign || "?"}, Lord: ${house9?.lord || "?"}, Occupants: ${house9?.planets?.length ? house9.planets.join(", ") : "Empty"}
- **9th Lord Position**: ${house9Lord?.sign || "?"} in ${house9Lord?.house ?? "?"}th house${house9Lord?.retrograde ? " [RETROGRADE]" : ""}

### Wealth-Through-Career Houses
- **2nd House (Accumulated Wealth)**: ${house2?.sign || "?"}, Lord: ${house2?.lord || "?"}, Occupants: ${house2?.planets?.length ? house2.planets.join(", ") : "Empty"}
- **2nd Lord Position**: ${house2Lord?.sign || "?"} in ${house2Lord?.house ?? "?"}th house${house2Lord?.retrograde ? " [RETROGRADE]" : ""}
- **11th House (Gains/Income)**: ${house11?.sign || "?"}, Lord: ${house11?.lord || "?"}, Occupants: ${house11?.planets?.length ? house11.planets.join(", ") : "Empty"}
- **11th Lord Position**: ${house11Lord?.sign || "?"} in ${house11Lord?.house ?? "?"}th house${house11Lord?.retrograde ? " [RETROGRADE]" : ""}

### Career Significator Planets
- **Sun (Authority/Government)**: ${planets?.Sun?.sign || "?"} (${planets?.Sun?.degrees?.toFixed(2) ?? "?"}°) in ${planets?.Sun?.house ?? "?"}th house, ${planets?.Sun?.nakshatra || "?"} Nakshatra Pada ${planets?.Sun?.pada ?? "?"}${planets?.Sun?.combust ? " [COMBUST]" : ""}
- **Saturn (Discipline/Karma)**: ${planets?.Saturn?.sign || "?"} (${planets?.Saturn?.degrees?.toFixed(2) ?? "?"}°) in ${planets?.Saturn?.house ?? "?"}th house, ${planets?.Saturn?.nakshatra || "?"} Nakshatra${planets?.Saturn?.retrograde ? " [RETROGRADE]" : ""}
- **Mercury (Skills/Intellect)**: ${planets?.Mercury?.sign || "?"} (${planets?.Mercury?.degrees?.toFixed(2) ?? "?"}°) in ${planets?.Mercury?.house ?? "?"}th house, ${planets?.Mercury?.nakshatra || "?"}${planets?.Mercury?.retrograde ? " [RETROGRADE]" : ""}${planets?.Mercury?.combust ? " [COMBUST]" : ""}
- **Jupiter (Wisdom/Guidance)**: ${planets?.Jupiter?.sign || "?"} (${planets?.Jupiter?.degrees?.toFixed(2) ?? "?"}°) in ${planets?.Jupiter?.house ?? "?"}th house, ${planets?.Jupiter?.nakshatra || "?"}${planets?.Jupiter?.retrograde ? " [RETROGRADE]" : ""}
- **Mars (Drive/Energy)**: ${planets?.Mars?.sign || "?"} (${planets?.Mars?.degrees?.toFixed(2) ?? "?"}°) in ${planets?.Mars?.house ?? "?"}th house, ${planets?.Mars?.nakshatra || "?"}${planets?.Mars?.retrograde ? " [RETROGRADE]" : ""}
- **Venus (Creativity/Luxury)**: ${planets?.Venus?.sign || "?"} (${planets?.Venus?.degrees?.toFixed(2) ?? "?"}°) in ${planets?.Venus?.house ?? "?"}th house, ${planets?.Venus?.nakshatra || "?"}${planets?.Venus?.combust ? " [COMBUST]" : ""}
- **Rahu (Unconventional/Foreign)**: ${planets?.Rahu?.sign || "?"} (${planets?.Rahu?.degrees?.toFixed(2) ?? "?"}°) in ${planets?.Rahu?.house ?? "?"}th house, ${planets?.Rahu?.nakshatra || "?"}
- **Ketu (Spirituality/Research)**: ${planets?.Ketu?.sign || "?"} (${planets?.Ketu?.degrees?.toFixed(2) ?? "?"}°) in ${planets?.Ketu?.house ?? "?"}th house, ${planets?.Ketu?.nakshatra || "?"}

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

### Career-Related Yogas
${formatCareerYogas(yogas)}

### All Detected Yogas (${yogas?.length ?? 0} total)
${formatYogas(yogas)}

### Ashtakavarga (Bindus per Sign: Aries to Pisces)
${formatAshtakavarga(ashtakavarga)}

---

## REQUIRED REPORT STRUCTURE — Generate ALL 8 Chapters

### Chapter 1: Career Significators — Dasham Bhava Analysis (Karma Sthana)
Provide a thorough analysis of ALL career-determining factors:
- **10th House Analysis**: The sign on the 10th house cusp, its elemental nature (fire/earth/air/water), and what professions the sign naturally governs
- **10th Lord Placement**: Where the 10th lord sits by house and sign — this is the MOST IMPORTANT career indicator. Analyze its dignity (exalted/own/friend/enemy/debilitated), aspects it receives, conjunctions, and what this combination specifically indicates for profession
- **Planets in the 10th House**: Detailed effect of each occupant planet — e.g., Sun in 10th = government/authority, Saturn in 10th = slow but steady rise, Mars in 10th = engineering/military/surgery, etc.
- **Sun as Karaka of Authority**: Sun's house placement, sign, dignity, and nakshatra — how the native relates to authority, government, and power structures
- **Saturn as Karaka of Karma/Discipline**: Saturn's position determines work ethic, type of labor, responsibility, and delays/rewards in career
- **Mercury as Karaka of Intelligence/Skills**: Communication ability, analytical skills, business acumen, writing/teaching potential
- **Jupiter as Karaka of Wisdom/Expansion**: Higher knowledge application, advisory roles, teaching, finance, legal, and spiritual professions
- **Mars as Karaka of Drive/Technical Skill**: Engineering, surgery, military, sports, real estate, competitive drive
- **Navamsha confirmation**: If navamsha data is available, cross-check the 10th lord's navamsha position for career confirmation

### Chapter 2: Professional Aptitude — Natural Talents & Ideal Professions
Detailed analysis of the native's inherent professional strengths:
- **Lagna Lord's Career Influence**: The ascendant lord's placement determines the native's overall approach to career — which house it occupies and how it connects to the 10th house
- **Strongest Career-Determining Planet**: Identify which single planet most powerfully influences career (consider: 10th lord, 10th house occupant, planets aspecting 10th, Atmakaraka) and explain why
- **Elemental Career Mapping**: Based on the dominant element in career houses (fire = leadership/military, earth = finance/administration, air = communication/technology, water = healing/creative arts)
- **Nakshatra-Based Career Indicators**: The 10th lord's nakshatra and the Moon nakshatra together narrow down specific professions
- **Top 5 Most Suitable Professions**: List and explain 5 specific career paths ranked by suitability, with astrological justification for each
- **Professions to Avoid**: Careers that conflict with the chart's natural energy
- **Skills & Education**: What type of education/training will most benefit the native (technical, creative, academic, vocational)
- **Entrepreneurial vs. Service Temperament**: Whether the chart favors independent work or structured employment

### Chapter 3: Career Timeline — Dasha-Period Professional Predictions
For EACH mahadasha in the complete dasha sequence, provide career-specific predictions:
- **Dasha Lord's Relationship to the 10th House**: Is the dasha lord the 10th lord? Does it aspect the 10th? Does it occupy the 10th? What house does it rule from the 10th?
- **Career Theme of the Period**: What type of professional activity gets activated (e.g., Jupiter dasha = teaching/advisory, Venus dasha = creative/luxury, Saturn dasha = hard work/restructuring)
- **Key Career Events**: Job changes, promotions, transfers, business launches, retirements — predicted within each mahadasha with approximate year ranges
- **Rise vs. Stagnation**: Whether career will accelerate, stagnate, or face setbacks during each period
- **Best Sub-Periods (Antardashas) for Career**: Within each mahadasha, identify the most favorable antardashas for career advancement
- **Professional Risks**: Periods where job loss, conflict, demotion, or business failure are indicated
- Provide specific date ranges from the dasha sequence for each prediction

### Chapter 4: Business vs. Employment — Entrepreneurial Potential
Comprehensive analysis of business aptitude:
- **7th House Partnership Analysis**: The 7th house governs business partnerships — sign, lord, occupants, and aspects determine success in business ventures. Is the native suited for partnerships or solo ventures?
- **3rd House Self-Effort Analysis**: The 3rd house shows initiative, courage, and self-made success. Strong 3rd house = can build from scratch
- **10th House Combination**: 10th lord in 7th = business success, 10th lord in 6th = service/job success, 10th lord in 3rd = freelance/self-effort
- **Rahu's Role in Business**: Rahu in 7th, 10th, or 11th can indicate unconventional or foreign business. Rahu-Venus/Mercury combinations and entrepreneurship
- **Best Business Type**: Based on planetary combinations, what type of business would succeed (trading, manufacturing, services, technology, creative, consulting)
- **Business Partnership Compatibility**: Type of business partner that would complement the native
- **Business Timing**: Which dasha periods favor starting a business vs. staying in employment
- **Risk Assessment**: Financial risk tolerance and periods of potential business failure

### Chapter 5: Wealth Through Career — Income Potential & Financial Growth
Analysis of the 2nd-10th-11th house axis for career-linked wealth:
- **2nd-10th Connection**: Does the 2nd lord connect to the 10th? This shows wealth through profession. Analyze the connection quality
- **11th House Income Potential**: The 11th house reveals the magnitude of gains — sign, lord, occupants, and whether the 11th lord connects to the 10th
- **Dhana Yogas Affecting Career Income**: List all wealth combinations that specifically impact professional income (not inheritance or speculation)
- **Salary vs. Variable Income**: Whether the chart supports stable salary or commission/bonus/project-based income
- **Income Growth Trajectory**: When income will peak, when growth may stall, and lifetime earning potential assessment
- **Foreign Income Potential**: 12th house connection to 10th/11th for overseas earnings, Rahu/Ketu placements for foreign opportunities
- **Multiple Income Sources**: Whether the chart supports side businesses, consulting, or passive income alongside main career
- **Tax/Legal Issues**: 6th/8th house influences on financial disputes or legal matters related to career income

### Chapter 6: Workplace Dynamics — Professional Relationships & Environment
Analysis of interpersonal career dynamics:
- **6th House Service Analysis**: The 6th house governs service, competition, and enemies at work. Sign, lord, and occupants determine workplace experience — conflicts, subordinates, daily work routine
- **Relationship with Authority (Sun analysis)**: How the native interacts with bosses, managers, and government officials. Sun's strength determines ability to handle authority
- **3rd House Communication**: How the native communicates professionally — presentation skills, negotiation ability, persuasion power, written communication
- **Colleague & Team Dynamics**: 11th house (peer network), 3rd house (equals), 6th house (subordinates) — how the native manages each group
- **Government & Political Connections**: Sun and 9th house analysis for government favor, political patronage, bureaucratic success
- **Foreign Work Prospects**: 12th house, Rahu/Ketu axis, 9th house combinations for overseas career — whether relocation benefits the career
- **Workplace Conflict Patterns**: Mars/Saturn/Rahu influences that create professional disputes, and how to navigate them
- **Ideal Work Environment**: Based on planetary placements — structured (Saturn), creative (Venus), intellectual (Mercury), outdoor (Mars), etc.

### Chapter 7: Career Challenges & Astrological Remedies (Karma Shanti)
Identification of career obstacles with specific remedial measures:
- **Malefic Influences on 10th House**: Identify any malefic planets (Saturn, Mars, Rahu, Ketu, afflicted Sun) affecting the 10th house through occupation, aspect, or lordship — specify the exact challenge each creates
- **Saturn's Career Impact**: If Saturn aspects/occupies the 10th or connects to the 10th lord — delays, restructuring, hard lessons. Specific Shani remedies
- **Rahu's Career Impact**: If Rahu is connected to career houses — sudden changes, unconventional paths, deception risk. Specific Rahu remedies
- **10th Lord Afflictions**: Combustion, debilitation, retrograde motion of the 10th lord — what challenges arise and when
- **Kaal Sarpa/Mangal Dosha Career Effects**: If these doshas exist, how they specifically impact career progression
- **Career Remedy Package**:
  - **Mantras**: Specific mantras for career success (Vishnu Sahasranama, planet-specific beej mantras) with exact jaap counts
  - **Gemstones**: Primary and secondary gemstones for career enhancement — stone name, carat, metal, finger, starting day
  - **Charitable Acts (Daan)**: Specific charities on specific weekdays to pacify career-blocking planets
  - **Puja/Havan**: Recommended pujas (Navagraha Shanti, specific planet pujas) for career breakthroughs
  - **Fasting (Vrat)**: Weekly fasting recommendations for career planets
  - **Yantra**: Career-enhancing yantras to install (Shree Yantra for prosperity, specific planetary yantras)
  - **Color & Direction Therapy**: Favorable colors to wear to work, favorable seating direction in office

### Chapter 8: Current Period Career Guidance — Active Dasha Deep Dive
Highly specific, actionable career guidance for the current period:
- **Current Mahadasha-Antardasha Career Analysis**: The ${dashas?.current?.mahadasha || "current"} Mahadasha and ${dashas?.current?.antardasha || "current"} Antardasha combination — how these two planets interact regarding career matters
- **Mahadasha Lord's Career Signification**: Where the current mahadasha lord sits, what it rules, and its natural career karaka-ship
- **Antardasha Lord's Modifying Influence**: How the antardasha lord modifies, enhances, or challenges the mahadasha lord's career effects
- **Specific Career Predictions for This Period**:
  - Job change likelihood (percentage estimate)
  - Promotion/advancement chances
  - Business opportunity window
  - Salary/income trajectory
  - Professional recognition potential
  - Career risk factors to watch for
- **Month-by-Month Career Highlights**: For the remaining months of the current antardasha, provide monthly career outlook
- **Next 2-3 Antardasha Preview**: Brief career outlook for the upcoming sub-periods with date ranges
- **Immediate Action Items**: 5-7 specific, practical career actions the native should take RIGHT NOW based on the active dasha period

---

Generate this COMPLETE 8-chapter report in ${language === "hi" ? "Hindi (use Devanagari script, with Sanskrit terms naturally as used in Hindi Jyotish texts)" : "English (include Sanskrit/Hindi terms in parentheses for key concepts)"}. Each chapter must be substantial and detailed — this should read like a professional astrology career consultation of approximately 20 pages, not a brief overview. Provide specific predictions with timeframes, not vague generalizations.
  `.trim();
}
