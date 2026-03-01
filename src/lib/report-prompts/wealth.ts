import { ChartData } from "../astro-client";
import { formatPlanets, formatHouses, formatDashaSequence, formatYogas, formatAshtakavarga, safeHousePlanets } from "./_helpers";

/** Helper: filter wealth/dhana-relevant yogas */
function formatDhanaYogas(yogas: ChartData["yogas"]): string {
  if (!yogas || yogas.length === 0) return "No yogas detected";
  const wealthTypes = ["dhana", "raj", "lakshmi"];
  const wealthKeywords = ["wealth", "dhana", "lakshmi", "money", "fortune", "prosperity", "rich", "kubera", "income", "gain", "financial"];
  const dhanaYogas = yogas.filter(
    (y) =>
      wealthTypes.includes(y?.type || "") ||
      wealthKeywords.some((kw) => (y?.name || "").toLowerCase().includes(kw) || (y?.description || "").toLowerCase().includes(kw))
  );
  if (dhanaYogas.length === 0) return "No specific dhana yogas detected (see full yoga list below)";
  return dhanaYogas
    .map(
      (y) =>
        `- **${y?.name || "Unknown"}** [${y?.type || "?"}/${y?.strength || "?"}]: ${y?.description || "N/A"} | Planets: ${(Array.isArray(y?.planets) ? y.planets.join(", ") : String(y?.planets ?? "?"))} | Effect: ${y?.effect || "N/A"}`
    )
    .join("\n");
}

/** Helper: extract ashtakavarga bindus for a specific house (1-indexed) */
function getHouseBindus(ashtakavarga: ChartData["ashtakavarga"], houseNum: number, lagnaSignNum: number | undefined): string {
  if (!ashtakavarga || lagnaSignNum === undefined) return "N/A";
  const signIndex = ((lagnaSignNum - 1 + houseNum - 1) % 12); // 0-indexed sign for the house
  const entries = Object.entries(ashtakavarga);
  const binduValues = entries.map(([planet, bindus]) => {
    const val = bindus?.[signIndex];
    return `${planet}: ${val ?? "?"}`;
  });
  const total = entries.reduce((sum, [, bindus]) => sum + (bindus?.[signIndex] ?? 0), 0);
  return `${binduValues.join(", ")} | Sarvashtakavarga Total: ${total}`;
}

export default function wealthPrompt(chartData: ChartData, language: "en" | "hi"): string {
  const { lagna, planets, houses, dashas, yogas, ashtakavarga } = chartData;

  const house2 = houses?.["2"];
  const house2Lord = house2?.lord ? planets?.[house2.lord] : undefined;
  const house11 = houses?.["11"];
  const house11Lord = house11?.lord ? planets?.[house11.lord] : undefined;
  const house5 = houses?.["5"];
  const house5Lord = house5?.lord ? planets?.[house5.lord] : undefined;
  const house8 = houses?.["8"];
  const house8Lord = house8?.lord ? planets?.[house8.lord] : undefined;
  const house9 = houses?.["9"];
  const house9Lord = house9?.lord ? planets?.[house9.lord] : undefined;
  const house10 = houses?.["10"];
  const house10Lord = house10?.lord ? planets?.[house10.lord] : undefined;
  const house12 = houses?.["12"];
  const house12Lord = house12?.lord ? planets?.[house12.lord] : undefined;
  const house4 = houses?.["4"];
  const house4Lord = house4?.lord ? planets?.[house4.lord] : undefined;
  const house6 = houses?.["6"];
  const house6Lord = house6?.lord ? planets?.[house6.lord] : undefined;
  const house7 = houses?.["7"];
  const house7Lord = house7?.lord ? planets?.[house7.lord] : undefined;
  const lagnaLord = lagna?.lord ? planets?.[lagna.lord] : undefined;

  return `
# WEALTH & FORTUNE HOROSCOPE ANALYSIS (Dhana Bhava Phal)

You MUST produce a comprehensive, multi-chapter wealth horoscope report following the EXACT structure below. Each chapter must contain detailed, substantive analysis with specific financial predictions and actionable prosperity guidance. Aim for the depth of a professional ClickAstro/AstroVision wealth report (~23 pages).

---

## BIRTH CHART DATA

### Lagna (Ascendant)
- Sign: ${lagna?.sign || "Unknown"} (${lagna?.sign_num ?? "?"}th sign)
- Degrees: ${lagna?.degrees?.toFixed(2) ?? "N/A"}°
- Lagna Lord: ${lagna?.lord || "Unknown"}
- Lagna Lord Position: ${lagnaLord?.sign || "?"} in ${lagnaLord?.house ?? "?"}th house, ${lagnaLord?.nakshatra || "?"} Nakshatra${lagnaLord?.retrograde ? " [RETROGRADE]" : ""}

### Primary Wealth Houses
- **2nd House (Dhana Bhava — Accumulated Wealth/Family Wealth)**: ${house2?.sign || "?"}, Lord: ${house2?.lord || "?"}, Occupants: ${safeHousePlanets(house2)}
- **2nd Lord Position**: ${house2Lord?.sign || "?"} in ${house2Lord?.house ?? "?"}th house, ${house2Lord?.nakshatra || "?"}${house2Lord?.retrograde ? " [RETROGRADE]" : ""}${house2Lord?.combust ? " [COMBUST]" : ""}
- **11th House (Labha Bhava — Gains/Income/Profits)**: ${house11?.sign || "?"}, Lord: ${house11?.lord || "?"}, Occupants: ${safeHousePlanets(house11)}
- **11th Lord Position**: ${house11Lord?.sign || "?"} in ${house11Lord?.house ?? "?"}th house, ${house11Lord?.nakshatra || "?"}${house11Lord?.retrograde ? " [RETROGRADE]" : ""}${house11Lord?.combust ? " [COMBUST]" : ""}

### Supporting Wealth Houses
- **5th House (Purva Punya — Speculation/Past Merit)**: ${house5?.sign || "?"}, Lord: ${house5?.lord || "?"}, Occupants: ${safeHousePlanets(house5)}
- **5th Lord Position**: ${house5Lord?.sign || "?"} in ${house5Lord?.house ?? "?"}th house${house5Lord?.retrograde ? " [RETROGRADE]" : ""}
- **8th House (Ayur Bhava — Inheritance/Sudden Gains/Insurance)**: ${house8?.sign || "?"}, Lord: ${house8?.lord || "?"}, Occupants: ${safeHousePlanets(house8)}
- **8th Lord Position**: ${house8Lord?.sign || "?"} in ${house8Lord?.house ?? "?"}th house${house8Lord?.retrograde ? " [RETROGRADE]" : ""}
- **9th House (Dharma Bhava — Fortune/Luck/Father's Wealth)**: ${house9?.sign || "?"}, Lord: ${house9?.lord || "?"}, Occupants: ${safeHousePlanets(house9)}
- **9th Lord Position**: ${house9Lord?.sign || "?"} in ${house9Lord?.house ?? "?"}th house${house9Lord?.retrograde ? " [RETROGRADE]" : ""}
- **10th House (Karma Bhava — Career Income)**: ${house10?.sign || "?"}, Lord: ${house10?.lord || "?"}, Occupants: ${safeHousePlanets(house10)}
- **10th Lord Position**: ${house10Lord?.sign || "?"} in ${house10Lord?.house ?? "?"}th house${house10Lord?.retrograde ? " [RETROGRADE]" : ""}

### Wealth-Draining Houses
- **6th House (Debts/Loans/Expenses)**: ${house6?.sign || "?"}, Lord: ${house6?.lord || "?"}, Occupants: ${safeHousePlanets(house6)}
- **6th Lord Position**: ${house6Lord?.sign || "?"} in ${house6Lord?.house ?? "?"}th house${house6Lord?.retrograde ? " [RETROGRADE]" : ""}
- **12th House (Vyaya Bhava — Losses/Expenditure/Foreign)**: ${house12?.sign || "?"}, Lord: ${house12?.lord || "?"}, Occupants: ${safeHousePlanets(house12)}
- **12th Lord Position**: ${house12Lord?.sign || "?"} in ${house12Lord?.house ?? "?"}th house${house12Lord?.retrograde ? " [RETROGRADE]" : ""}

### Additional Wealth-Related Houses
- **4th House (Property/Vehicles/Fixed Assets)**: ${house4?.sign || "?"}, Lord: ${house4?.lord || "?"}, Occupants: ${safeHousePlanets(house4)}
- **4th Lord Position**: ${house4Lord?.sign || "?"} in ${house4Lord?.house ?? "?"}th house${house4Lord?.retrograde ? " [RETROGRADE]" : ""}
- **7th House (Business/Trade/Partnerships)**: ${house7?.sign || "?"}, Lord: ${house7?.lord || "?"}, Occupants: ${safeHousePlanets(house7)}
- **7th Lord Position**: ${house7Lord?.sign || "?"} in ${house7Lord?.house ?? "?"}th house${house7Lord?.retrograde ? " [RETROGRADE]" : ""}

### Wealth Significator Planets (Dhana Karakas)
- **Jupiter (Karaka of Wealth & Expansion)**: ${planets?.Jupiter?.sign || "?"} (${planets?.Jupiter?.degrees?.toFixed(2) ?? "?"}°) in ${planets?.Jupiter?.house ?? "?"}th house, ${planets?.Jupiter?.nakshatra || "?"} Nakshatra Pada ${planets?.Jupiter?.pada ?? "?"}${planets?.Jupiter?.retrograde ? " [RETROGRADE]" : ""}
- **Venus (Karaka of Luxury & Material Comfort)**: ${planets?.Venus?.sign || "?"} (${planets?.Venus?.degrees?.toFixed(2) ?? "?"}°) in ${planets?.Venus?.house ?? "?"}th house, ${planets?.Venus?.nakshatra || "?"} Nakshatra${planets?.Venus?.combust ? " [COMBUST]" : ""}
- **Mercury (Karaka of Commerce & Trade)**: ${planets?.Mercury?.sign || "?"} (${planets?.Mercury?.degrees?.toFixed(2) ?? "?"}°) in ${planets?.Mercury?.house ?? "?"}th house, ${planets?.Mercury?.nakshatra || "?"}${planets?.Mercury?.retrograde ? " [RETROGRADE]" : ""}${planets?.Mercury?.combust ? " [COMBUST]" : ""}
- **Sun (Karaka of Gold & Government Wealth)**: ${planets?.Sun?.sign || "?"} (${planets?.Sun?.degrees?.toFixed(2) ?? "?"}°) in ${planets?.Sun?.house ?? "?"}th house, ${planets?.Sun?.nakshatra || "?"}
- **Moon (Karaka of Liquid Assets & Pearls)**: ${planets?.Moon?.sign || "?"} (${planets?.Moon?.degrees?.toFixed(2) ?? "?"}°) in ${planets?.Moon?.house ?? "?"}th house, ${planets?.Moon?.nakshatra || "?"} Pada ${planets?.Moon?.pada ?? "?"}
- **Saturn (Karaka of Labor Income & Real Estate)**: ${planets?.Saturn?.sign || "?"} (${planets?.Saturn?.degrees?.toFixed(2) ?? "?"}°) in ${planets?.Saturn?.house ?? "?"}th house, ${planets?.Saturn?.nakshatra || "?"}${planets?.Saturn?.retrograde ? " [RETROGRADE]" : ""}
- **Mars (Karaka of Property & Land)**: ${planets?.Mars?.sign || "?"} (${planets?.Mars?.degrees?.toFixed(2) ?? "?"}°) in ${planets?.Mars?.house ?? "?"}th house, ${planets?.Mars?.nakshatra || "?"}${planets?.Mars?.retrograde ? " [RETROGRADE]" : ""}
- **Rahu (Karaka of Sudden/Unconventional Wealth)**: ${planets?.Rahu?.sign || "?"} (${planets?.Rahu?.degrees?.toFixed(2) ?? "?"}°) in ${planets?.Rahu?.house ?? "?"}th house, ${planets?.Rahu?.nakshatra || "?"}
- **Ketu (Karaka of Spiritual/Past-Life Wealth)**: ${planets?.Ketu?.sign || "?"} (${planets?.Ketu?.degrees?.toFixed(2) ?? "?"}°) in ${planets?.Ketu?.house ?? "?"}th house, ${planets?.Ketu?.nakshatra || "?"}

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

### Detected Dhana (Wealth) Yogas
${formatDhanaYogas(yogas)}

### All Detected Yogas (${yogas?.length ?? 0} total)
${formatYogas(yogas)}

### Ashtakavarga (Bindus per Sign: Aries to Pisces)
${formatAshtakavarga(ashtakavarga)}

### Ashtakavarga for Key Wealth Houses
- **2nd House Bindus**: ${getHouseBindus(ashtakavarga, 2, lagna?.sign_num)}
- **11th House Bindus**: ${getHouseBindus(ashtakavarga, 11, lagna?.sign_num)}
- **5th House Bindus**: ${getHouseBindus(ashtakavarga, 5, lagna?.sign_num)}
- **9th House Bindus**: ${getHouseBindus(ashtakavarga, 9, lagna?.sign_num)}

---

## REQUIRED REPORT STRUCTURE — Generate ALL 8 Chapters

### Chapter 1: Wealth Significators — Dhana Bhava Analysis
Provide a thorough analysis of ALL wealth-determining factors:
- **2nd House (Dhana Bhava) Deep Analysis**: The sign on the 2nd house, its elemental nature, and what type of wealth accumulation it naturally supports. Analyze every planet occupying the 2nd house and its effect on savings, speech (which affects income), and family wealth
- **11th House (Labha Bhava) Deep Analysis**: The sign on the 11th house determines the nature of gains — regular salary, windfalls, or passive income. Analyze all occupants and aspects
- **2nd Lord Placement**: Where the 2nd lord sits is CRITICAL — 2nd lord in 11th = wealth grows, 2nd lord in 12th = wealth drains, etc. Provide detailed analysis of the actual placement
- **11th Lord Placement**: Similar analysis — 11th lord's house position determines the primary channel of income
- **Jupiter as Dhana Karaka**: Jupiter's placement, dignity, and aspects determine overall wealth potential. Jupiter in trines/kendras = strong wealth, Jupiter afflicted = erratic finances
- **Venus as Luxury Karaka**: Venus determines quality of life, material comforts, vehicles, jewelry, and artistic wealth. Analyze Venus's strength and placement
- **Mercury as Commerce Karaka**: Business acumen, trading ability, financial intelligence — Mercury's role in wealth creation
- **Sun as Gold/Authority Karaka**: Government income, gold investments, inheritance from father. Sun's dignity and placement
- **2nd-11th Lord Mutual Relationship**: Do the 2nd and 11th lords aspect each other? Are they in mutual signs? Exchange (parivartana)? This connection determines wealth flow consistency
- **Overall Wealth Potential Score**: Rate the chart's wealth potential as Exceptional/Strong/Moderate/Below Average with detailed justification

### Chapter 2: Dhana Yogas — Wealth Combinations in the Chart
Exhaustive analysis of ALL wealth-creating planetary combinations:
- **Classical Dhana Yogas**: Identify and analyze every dhana yoga present in the chart:
  - Lagna lord + 2nd lord conjunction/aspect/exchange
  - Lagna lord + 5th lord conjunction/aspect/exchange
  - Lagna lord + 9th lord conjunction/aspect/exchange
  - Lagna lord + 11th lord conjunction/aspect/exchange
  - 2nd lord + 5th lord, 2nd lord + 9th lord, 2nd lord + 11th lord combinations
  - 5th lord + 9th lord (Lakshmi Yoga)
  - 9th lord + 10th lord (Dharma-Karma Adhipati Yoga — wealth through righteous action)
- **Mahabhagya Yoga**: If applicable — born during day (male) with Sun, Moon, Lagna in odd signs, or born at night (female) with all three in even signs
- **Lakshmi Yoga**: Venus as 9th lord in own/exalted sign in a kendra — extraordinary wealth
- **Chandra-Mangal Yoga**: Moon-Mars conjunction — self-earned wealth through effort
- **Gaja Kesari Yoga**: Jupiter-Moon in kendras from each other — wealth and wisdom
- **Raja Yoga with Dhana Connection**: Any raja yoga where participating lords also rule wealth houses
- **Adhi Yoga**: Benefics in 6th, 7th, 8th from Moon — financial security and authority
- **Kahal Yoga, Amala Yoga, and Other Prosperity Yogas**: Identify all that apply
- **Strength Assessment for Each Yoga**: For every detected yoga, rate its strength (strong/moderate/weak) based on planetary dignity, aspects, and combustion. Specify WHEN each yoga will produce results (which dasha period activates it)
- **Yoga Cancellation/Enhancement Factors**: What factors in the chart enhance or diminish each yoga's effectiveness

### Chapter 3: Income Sources — Primary & Secondary Revenue Channels
Detailed analysis of WHERE wealth comes from:
- **Primary Income (10th Lord to 2nd/11th Connection)**: The 10th lord's relationship with the 2nd and 11th houses determines the main career-based income. Analyze whether the connection exists and its quality
- **Service/Job Income (6th House)**: Is the native destined for salaried employment? 6th house strength, its lord's placement, and connection to wealth houses
- **Business Income (7th House)**: Partnership and trading income. 7th lord's connection to 2nd/11th — is business a viable wealth path?
- **Inheritance & Unearned Income (8th House)**: Insurance payouts, spouse's wealth, inheritance from parents/in-laws, sudden windfalls. 8th lord's placement and its connection to wealth houses
- **Speculation & Investment Income (5th House)**: Stock market, lottery, gambling, creative pursuits. 5th house strength and its lord's dignity determine speculative success
- **Real Estate & Property Income (4th House/Mars)**: Land, buildings, rental income, construction. 4th lord + Mars analysis for property accumulation
- **Foreign Income (12th House/Rahu)**: Overseas earnings, export/import, foreign investments. 12th lord + Rahu placement for international wealth
- **Intellectual/Creative Income (5th House/Mercury)**: Writing, consulting, teaching, royalties, patents. Mercury-5th house connection
- **Passive/Recurring Income**: Which planetary combinations support building passive income streams (dividends, rent, interest)
- **Government/Public Sector Income**: Sun's strength and connection to wealth houses for government salary, contracts, or grants
- **Ranking**: Rank the top 3 most favorable income sources for this specific chart with justification

### Chapter 4: Wealth Timeline — Dasha-Period Financial Predictions
For EACH mahadasha in the complete dasha sequence, provide wealth-specific predictions:
- **Dasha Lord's Wealth Signification**: Is the dasha lord a wealth house ruler (2nd/5th/9th/11th)? Does it occupy a wealth house? Does it aspect wealth houses? What is its natural karaka-ship regarding money?
- **Financial Theme of Each Period**: What type of financial activity dominates (accumulation, spending, investment, loss, inheritance, sudden gain)
- **Wealth Rank of Each Dasha**: Rank ALL mahadasha periods from MOST to LEAST financially favorable, with percentage estimate of lifetime wealth earned in each period
- **Key Financial Events**: Major purchases (property, vehicle), windfalls, inheritances, business successes/failures, debts — predicted within each mahadasha with approximate year ranges
- **Income Level Trajectory**: Whether income rises, peaks, stagnates, or declines during each period — plotted as a narrative timeline
- **Best Antardasha Combinations for Wealth**: Within each mahadasha, which antardashas are the GOLDEN PERIODS for wealth accumulation
- **Financial Danger Periods**: Antardashas where loss, debt, theft, or financial crisis is indicated — specific warnings with timeframes
- **Year-by-Year Wealth Highlights**: For the next 20 years, provide a brief year-by-year financial forecast (1-2 lines per year) highlighting peak earning years and caution periods
- Use the ACTUAL dasha dates from the sequence provided above

### Chapter 5: Investment Guidance — Planetary Indicators for Asset Classes
Specific investment recommendations based on planetary placements:
- **Real Estate (4th House + Mars Analysis)**: 4th house sign, lord, Mars's placement — what type of property (residential, commercial, agricultural, foreign property)? Best periods for property purchase (Mars/4th lord dashas)
- **Stock Market & Equity (5th House + Rahu Analysis)**: 5th house determines speculative success. Rahu in 5th/11th = potential for sudden stock gains. Rahu-Mercury combinations for trading. Suitable sectors based on planetary indicators (Sun = energy/govt, Mars = steel/military, Mercury = IT/comm, Jupiter = finance/education, Venus = luxury/fashion/entertainment, Saturn = mining/oil/infrastructure)
- **Business Investment (7th House)**: Partnership businesses, franchise opportunities, trade. 7th lord's strength determines business investment success
- **Gold & Precious Metals (Sun + Jupiter)**: Sun's dignity for gold investments. Jupiter for silver. Venus for diamonds/precious stones. Timing for buying/selling precious metals
- **Fixed Deposits & Bonds (Saturn)**: Saturn determines success with conservative, long-term investments. Saturn's house placement and strength for fixed income instruments
- **Foreign Assets & International Investment (12th House + Rahu/Ketu)**: Overseas property, foreign currency, international stocks/ETFs
- **Cryptocurrency & Unconventional Assets (Rahu)**: Rahu's strength and placement for success with new-age, unconventional investment instruments
- **Agricultural Land (4th House + Moon + Venus)**: Farming, plantation, organic agriculture investment potential
- **Vehicle Purchase Timing**: 4th house + Venus analysis for favorable periods to buy vehicles
- **Risk Profile Assessment**: Based on the chart's overall planetary combinations, is the native suited for high-risk/high-reward or conservative/steady investing? Percentage allocation recommendation across asset classes
- **Unfavorable Investments**: Based on afflicted houses/planets, which investment types should be AVOIDED

### Chapter 6: Financial Challenges — Obstacles to Wealth Accumulation
Identification of wealth-blocking factors with detailed analysis:
- **12th House Expenditure Analysis**: The 12th house shows WHERE money drains — sign, lord, occupants determine the nature of expenses (hospital, foreign travel, donations, losses, bad habits, litigation). 12th lord in wealth houses = spending despite earning
- **6th House Debt Analysis**: Tendency toward debt, loans, financial disputes. 6th lord's placement determines the nature and severity of debt issues. 6th lord in 2nd/11th = debt affects savings
- **8th House Sudden Loss Potential**: Sudden financial reversals, insurance claims, partner's financial problems, hidden debts, tax troubles. 8th lord afflicting 2nd/11th = unexpected wealth destruction
- **Malefic Aspects on 2nd and 11th Houses**: Identify Saturn, Mars, Rahu, Ketu aspects on wealth houses — each malefic creates a different type of financial challenge (Saturn = delays, Mars = impulsive spending, Rahu = fraud/deception, Ketu = detachment from wealth)
- **Combustion of Wealth Lords**: If the 2nd/11th lord is combust (too close to Sun), the wealth-generating capacity is diminished. Analyze timing and severity
- **Debilitation of Wealth Planets**: Jupiter or Venus debilitated reduces overall prosperity. 2nd/11th lord debilitated creates specific challenges
- **Kemadruma Yoga**: If Moon has no planets in 2nd/12th from it — financial instability and loneliness. Check if cancellation exists
- **Daridra Yoga (Poverty Combinations)**: If any classical poverty yogas exist (11th lord in 6th/8th/12th, etc.) — identify, assess severity, and provide remedies
- **Maraka (Death-Like) Financial Periods**: Dasha periods that are specifically dangerous for finances — identify with exact date ranges
- **Recovery Strategies**: For each challenge identified, provide specific astrological timing for recovery and improvement

### Chapter 7: Ashtakavarga Wealth Analysis — Transit-Based Financial Timing
Detailed ashtakavarga analysis focused on wealth houses:
- **2nd House Sarvashtakavarga Score**: Total bindus in the 2nd house sign — above 28 = strong savings, below 25 = difficulty accumulating. Analyze each planet's contribution
- **11th House Sarvashtakavarga Score**: Total bindus in the 11th house sign — above 28 = excellent gains, below 25 = limited income growth. Planet-wise analysis
- **Jupiter's Ashtakavarga in Wealth Signs**: Jupiter's bindus in the 2nd, 5th, 9th, and 11th house signs — when Jupiter transits signs with high bindus (4+), wealth increases. Identify the BEST Jupiter transit signs for this chart
- **Saturn's Ashtakavarga in Wealth Signs**: Saturn's bindus in wealth house signs — when Saturn transits signs with high bindus, stable income. When low bindus, financial pressure
- **Transit Wealth Timing Method**: When a benefic planet (Jupiter/Venus) transits a sign with HIGH sarvashtakavarga bindus (28+) AND the transit activates wealth houses, it triggers financial gains. Identify the next 5-7 such favorable transit windows with approximate dates
- **Kaksha-Level Timing**: Within favorable transit signs, which planet's kaksha (sub-division) period gives maximum wealth results
- **Unfavorable Transit Windows**: When malefics (Saturn/Rahu) transit signs with LOW ashtakavarga bindus in wealth houses — financial caution periods
- **Annual Transit-Based Financial Forecast**: For the next 3 years, identify the best months for financial gains and caution months based on ashtakavarga transits

### Chapter 8: Prosperity Remedies — Lakshmi Upasana & Wealth Enhancement (Dhana Prapti Upaya)
Comprehensive remedial measures for wealth enhancement:
- **Lakshmi Mantra Sadhana**:
  - Mahalakshmi Mantra: "Om Shreem Mahalakshmiyei Namah" — jaap count: 1,25,000 (Sawa Lakh) over 40 days starting on a Friday during Shukla Paksha
  - Beej Mantra: "Om Shreem Hreem Kleem" — 108 times daily facing East during sunrise
  - Specific jaap count and starting conditions for maximum effect
- **Kubera Puja & Mantra**:
  - "Om Yakshaya Kuberaya Vaishravanaya Dhanadhanyadhipataye Dhanadhanyasamriddhim Me Dehi Dapaya Svaha" — 21 times daily facing North
  - Kubera Yantra installation instructions — North wall of house/office, on a Thursday
- **Planet-Specific Wealth Remedies**: For EACH planet that rules or occupies wealth houses (2nd, 5th, 9th, 11th):
  - **Mantra**: Beej mantra or Vedic mantra with exact jaap count (e.g., "Om Brim Brihaspataye Namah — 19,000 times for Jupiter")
  - **Gemstone**: Name (Sanskrit + English), minimum carat weight, metal setting, wearing finger, which day to start wearing, which nakshatra tithi is ideal
  - **Day & Color**: Favorable day of the week and color to wear/use for that planet
  - **Charity (Daan)**: Specific items to donate on the planet's day (e.g., yellow clothes/turmeric/chickpeas on Thursday for Jupiter, white items/rice/silver on Monday for Moon)
  - **Fasting (Vrat)**: Weekly fasting recommendation with guidelines
- **Yantra Recommendations**:
  - Shree Yantra for overall prosperity — installation method, daily worship procedure
  - Kuber Yantra for income growth
  - Planet-specific yantras for wealth house lords
- **Charitable Acts for Wealth (Daan Vidhi)**:
  - Specific items to donate based on the weakest wealth planets
  - Annadaan (food donation) on specific tithis for Lakshmi blessings
  - Cow donation/feeding (Godaan/Go-seva) for Jupiter strengthening
  - Feeding ants/fish/birds for specific planetary pacification
- **Vastu Recommendations for Wealth**:
  - Locker/safe placement direction based on chart
  - Wealth corner (North/North-East) activation
  - Water element placement for income flow
  - Kuber direction for the specific lagna
- **Stotra & Path (Scriptural Recitation)**:
  - Shri Suktam recitation — when and how (Friday evenings, facing Lakshmi idol/image)
  - Kanakadhara Stotram for removing financial obstacles
  - Vishnu Sahasranama for Jupiter strengthening
- **Festival-Based Wealth Rituals**:
  - Dhanteras puja vidhi (specific to this chart)
  - Akshaya Tritiya investments and puja
  - Diwali Lakshmi Puja alignment with chart's wealth houses
- **Daily Wealth Habits**: 5-7 simple daily practices based on the chart for continuous wealth attraction (e.g., specific morning affirmations, direction to face while working, items to keep at desk/wallet)

---

Generate this COMPLETE 8-chapter report in ${language === "hi" ? "Hindi (use Devanagari script, with Sanskrit terms naturally as used in Hindi Jyotish texts)" : "English (include Sanskrit/Hindi terms in parentheses for key concepts)"}. Each chapter must be substantial and detailed — this should read like a professional astrology wealth consultation of approximately 23 pages, not a brief overview. Provide specific predictions with timeframes, exact mantra counts, precise gemstone specifications, and actionable financial guidance grounded in Vedic astrology principles.
  `.trim();
}
