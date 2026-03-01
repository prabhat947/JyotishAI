import { ChartData } from "../astro-client";
import { formatPlanets, formatHouses, formatDashaSequence, formatYogas, formatAshtakavarga } from "./_helpers";

export default function yearlyPrompt(chartData: ChartData, language: "en" | "hi"): string {
  const currentYear = new Date().getFullYear();
  const { lagna, planets, houses, dashas, yogas, ashtakavarga } = chartData;

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const monthChapterInstructions = months
    .map(
      (month, idx) => `### Chapter ${idx + 2}: ${month} ${currentYear} Predictions
- Active antardasha/pratyantardasha during this month
- **Career & Profession**: Workplace developments, promotions, job changes, business opportunities
- **Financial Outlook**: Income, expenses, investment gains/losses, unexpected money
- **Health Alerts**: Physical and mental health, specific vulnerable body areas this month
- **Relationships & Family**: Spouse, children, parents, social dynamics
- **Auspicious Dates**: Best dates for important decisions, new beginnings, ceremonies
- **Challenges to Watch**: Specific planetary triggers, malefic transits affecting this month
- **Travel & Movement**: Short and long-distance travel prospects
- **Spiritual & Personal Growth**: Inner development opportunities`
    )
    .join("\n\n");

  return `
# COMPREHENSIVE YEARLY HOROSCOPE FOR ${currentYear} (Varshaphala)

You MUST produce a detailed, multi-chapter yearly horoscope report following the EXACT structure below. Each chapter must contain substantive month-by-month analysis with specific predictions. Aim for ~42 pages of professional-quality content matching ClickAstro/AstroVision standards.

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

---

## REQUIRED REPORT STRUCTURE — Generate ALL 14 Chapters

### Chapter 1: Year ${currentYear} Overview & Annual Theme
- **Active Dasha Context**: Which mahadasha and antardasha govern ${currentYear}? What is the dasha lord's natal position, dignity, and relationship with the lagna lord? How does this color the entire year?
- **Annual Varshaphala Theme**: The overarching theme for the native this year — growth, consolidation, challenges, transformation, or harvest period?
- **Major Transit Summary for ${currentYear}**: Jupiter's transit sign and house from lagna/moon throughout the year. Saturn's transit and Sade Sati/Dhaiya status. Rahu-Ketu axis position. Any major retrograde periods of Jupiter/Saturn.
- **Key Turning Points**: Identify the 3-5 most significant dates/periods in ${currentYear} based on transit ingresses, dasha transitions, and eclipse impacts.
- **Year-at-a-Glance**: Rate each life area for ${currentYear} (career, wealth, health, relationships, spiritual growth) on a scale of favorable/neutral/challenging with brief reasoning.

${monthChapterInstructions}

### Chapter 14: Annual Remedies for ${currentYear}
- **Dasha-Lord Specific Remedies**: Based on the active mahadasha and antardasha lords for ${currentYear}:
  - Specific mantra with exact jaap count (e.g., "Om Namah Shivaya — 1,25,000 jaap for Saturn mahadasha")
  - Gemstone recommendation: stone name, carat weight, metal, wearing finger, auspicious day to start
  - Charity (Daan): What items to donate, on which day, to whom
  - Fasting: Which day(s) to observe fast throughout the year
- **Transit-Based Remedies**: Remedies for challenging transits active during ${currentYear}
- **Nakshatra-Based Worship**: Birth nakshatra deity worship, favorable colors, numbers, and directions for the year
- **Yantra Recommendations**: Any specific yantras to install or energize for ${currentYear}
- **Monthly Ritual Calendar**: One key remedy or ritual for each month of ${currentYear}
- **Favorable Colors, Numbers, Directions**: Day-by-day favorable elements for important decisions
- **Auspicious Muhurtas**: Best periods in ${currentYear} for major life events (marriage, business start, property purchase, travel)

---

Generate this COMPLETE 14-chapter yearly report in ${language === "hi" ? "Hindi (Devanagari script, with Sanskrit terms naturally as used in Hindi Jyotish texts)" : "English (include Sanskrit/Hindi terms in parentheses for key Jyotish concepts)"}. Each monthly chapter must be detailed and specific to this native's chart — NOT generic sun-sign predictions. Reference specific planetary positions, dasha periods, and transit interactions for every prediction.
  `.trim();
}
