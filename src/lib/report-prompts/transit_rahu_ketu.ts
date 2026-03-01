import { ChartData } from "../astro-client";
import { formatPlanets, formatHouses, formatDashaSequence, formatYogas } from "./_helpers";

export default function transitRahuKetuPrompt(chartData: ChartData, language: "en" | "hi"): string {
  const { lagna, planets, houses, dashas, yogas } = chartData;

  // Extract Rahu-Ketu specifics for convenience
  const rahu = planets?.Rahu;
  const ketu = planets?.Ketu;
  const moon = planets?.Moon;
  const rahuDispositor = rahu?.lord ? planets?.[rahu.lord] : undefined;
  const ketuDispositor = ketu?.lord ? planets?.[ketu.lord] : undefined;

  return `
# RAHU-KETU TRANSIT PREDICTIONS (Nodal Transit Analysis — Raahu-Ketu Gochar Phal)

You MUST produce a comprehensive, multi-chapter transit report following the EXACT structure below. Each chapter must contain detailed, substantive analysis — NOT brief summaries. Aim for the depth and quality of a professional ClickAstro/AstroVision transit report (~18 pages).

---

## BIRTH CHART DATA

### Lagna (Ascendant)
- Sign: ${lagna?.sign || "Unknown"} (${lagna?.sign_num ?? "?"}th sign)
- Degrees: ${lagna?.degrees?.toFixed(2) ?? "N/A"}°
- Lagna Lord: ${lagna?.lord || "Unknown"}

### Natal Rahu (North Node)
- Sign: ${rahu?.sign || "Unknown"} (${rahu?.sign_num ?? "?"}th sign)
- House: ${rahu?.house ?? "?"}th house
- Degrees: ${rahu?.degrees?.toFixed(2) ?? "?"}°
- Nakshatra: ${rahu?.nakshatra || "Unknown"}, Pada ${rahu?.pada ?? "?"}
- Sign Lord (Dispositor): ${rahu?.lord || "Unknown"}
- Dispositor Position: ${rahuDispositor?.sign || "Unknown"} in ${rahuDispositor?.house ?? "?"}th house${rahuDispositor?.retrograde ? " [RETROGRADE]" : ""}

### Natal Ketu (South Node)
- Sign: ${ketu?.sign || "Unknown"} (${ketu?.sign_num ?? "?"}th sign)
- House: ${ketu?.house ?? "?"}th house
- Degrees: ${ketu?.degrees?.toFixed(2) ?? "?"}°
- Nakshatra: ${ketu?.nakshatra || "Unknown"}, Pada ${ketu?.pada ?? "?"}
- Sign Lord (Dispositor): ${ketu?.lord || "Unknown"}
- Dispositor Position: ${ketuDispositor?.sign || "Unknown"} in ${ketuDispositor?.house ?? "?"}th house${ketuDispositor?.retrograde ? " [RETROGRADE]" : ""}

### Moon (Chandra — Key for Nodal Transits)
- Sign: ${moon?.sign || "Unknown"} in ${moon?.house ?? "?"}th house
- Nakshatra: ${moon?.nakshatra || "Unknown"}, Pada ${moon?.pada ?? "?"}
- Degrees: ${moon?.degrees?.toFixed(2) ?? "?"}°

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

---

## REQUIRED REPORT STRUCTURE — Generate ALL 8 Chapters

### Chapter 1: Natal Nodal Axis Analysis (Janma Rahu-Ketu Sthiti)
Provide deep analysis of the natal Rahu-Ketu axis:
- **Rahu in ${rahu?.sign || "Unknown"} (${rahu?.house ?? "?"}th house)**: The soul's karmic desire in this life — what material experiences Rahu craves. What obsessions, ambitions, and worldly pursuits are indicated? How does Rahu's sign color its expression (e.g., Rahu in fire signs vs. water signs)?
- **Ketu in ${ketu?.sign || "Unknown"} (${ketu?.house ?? "?"}th house)**: Past-life mastery and this-life detachment — what Ketu has already experienced and is now releasing. What innate spiritual gifts does Ketu bring? Where does detachment manifest?
- **Nakshatra-level analysis**: Rahu in ${rahu?.nakshatra || "Unknown"} — the deity, shakti, and specific karmic undertone. Ketu in ${ketu?.nakshatra || "Unknown"} — the spiritual flavor and past-life imprint.
- **Dispositor chain**: Rahu's sign lord ${rahu?.lord || "Unknown"} is in ${rahuDispositor?.sign || "?"} / ${rahuDispositor?.house ?? "?"}th house — how does the dispositor's placement direct Rahu's energy? Same for Ketu's sign lord ${ketu?.lord || "Unknown"}.
- **Nodal axis house pair**: The ${rahu?.house ?? "?"}th-${ketu?.house ?? "?"}th axis — karmic theme (e.g., 1-7 = self vs. partnerships, 4-10 = home vs. career). Life lesson inherent in this axis.
- **Planets conjunct or aspecting Rahu/Ketu**: Any planet within 10° of Rahu or Ketu in the natal chart? These planets become "karmically charged."

### Chapter 2: Current Rahu-Ketu Transit Position (Vartamaan Gochar)
- **Current transit signs and houses**: Where are Rahu and Ketu transiting NOW from Lagna? From Moon sign? From natal Rahu-Ketu?
- **Transit-over-natal analysis**: Is transiting Rahu/Ketu conjunct any natal planet? If so, which planet and what karmic activation does this trigger?
- **Duration**: When did Rahu-Ketu enter the current signs? When will they move to the next pair? (Rahu-Ketu spend approximately 18 months in each sign pair.)
- **Retrograde nature**: Rahu and Ketu always move in reverse (retrograde) — explain the unique quality of backward-moving shadow planets and how this affects the manifestation of transit results.
- **Interaction with current dasha**: How does the nodal transit interact with the active ${dashas?.current?.mahadasha || "current"} Mahadasha / ${dashas?.current?.antardasha || "current"} Antardasha? Does it amplify or conflict?

### Chapter 3: Rahu Transit Effects — ALL 12 Houses (Raahu Gochar Phal)
For EACH of the 12 houses, provide detailed analysis of what happens when transiting Rahu passes through that house. Cover:
- Material desires and worldly ambitions activated in that life area
- Obsessions, fixations, and areas where the native may go overboard
- Sudden opportunities, unconventional gains, foreign connections
- Technology, innovation, and modern approaches highlighted
- Deception risks, confusion, or illusion in that domain
- Specific effects based on the sign on that house cusp and its lord's natal position

Analyze ALL 12 houses:
1. **Rahu transit 1st house** — Identity transformation, personality obsession, health concerns from toxins/unknown causes, foreign appearance
2. **Rahu transit 2nd house** — Wealth through unconventional means, speech distortion, family disruption, foreign food/cuisine, sudden financial windfalls
3. **Rahu transit 3rd house** — Bold communication, digital media success, sibling dynamics, courage amplified, short travels, publishing/blogging
4. **Rahu transit 4th house** — Property through unusual means, mother's health, vehicle acquisition, mental restlessness, foreign residence
5. **Rahu transit 5th house** — Creative obsession, speculative gains/losses, children concerns, romance with foreigners, educational pursuits
6. **Rahu transit 6th house** — FAVORABLE — victory over enemies, disease resolution, legal wins, service sector success, competitive advantage
7. **Rahu transit 7th house** — Unconventional partnerships, foreign spouse connections, business with foreigners, marital challenges from obsession
8. **Rahu transit 8th house** — Sudden transformations, occult research, inheritance, insurance matters, chronic health concerns, tantric experiences
9. **Rahu transit 9th house** — Religious confusion, guru-seeking, foreign pilgrimages, father's health, unorthodox spiritual paths, higher education abroad
10. **Rahu transit 10th house** — Career in foreign companies/MNCs, sudden fame, political ambition, technology-driven career boost, reputation risks
11. **Rahu transit 11th house** — MOST FAVORABLE — massive gains, network expansion, foreign friendships, wish fulfillment, elder sibling benefits
12. **Rahu transit 12th house** — Foreign settlement, spiritual awakening, hidden losses, hospital visits, expenditure on luxury, isolation periods

### Chapter 4: Ketu Transit Effects — ALL 12 Houses (Ketu Gochar Phal)
For EACH of the 12 houses, provide detailed analysis of what happens when transiting Ketu passes through that house. Cover:
- Spiritual growth, detachment, and letting go in that life area
- Sudden losses, separations, or endings that serve a higher purpose
- Past-life talents resurfacing, intuitive abilities activating
- Minimalism, renunciation, and simplification
- Moksha (liberation) tendencies and spiritual breakthroughs
- Specific effects based on the sign on that house cusp and its lord's natal position

Analyze ALL 12 houses:
1. **Ketu transit 1st house** — Identity crisis, spiritual awakening, health through detachment, headless (confused) feeling, past-life personality emergence
2. **Ketu transit 2nd house** — Detachment from wealth, speech becomes minimal/spiritual, family separations, simple food habits, financial disinterest
3. **Ketu transit 3rd house** — FAVORABLE — courage through surrender, spiritual communication, intuitive writing, sibling distance, fearless action
4. **Ketu transit 4th house** — Detachment from home/property, mother's spiritual growth, selling property, inner peace through renunciation, education disruptions
5. **Ketu transit 5th house** — Spiritual intelligence, past-life children karma, stock market indifference, romance detachment, mantra siddhi
6. **Ketu transit 6th house** — FAVORABLE — enemy defeat, disease healing, debt clearance, service without ego, competitive withdrawal that works in favor
7. **Ketu transit 7th house** — Marital detachment, partnership dissolution, business simplification, spiritual union over material partnership
8. **Ketu transit 8th house** — Deep occult insights, moksha yoga activation, sudden spiritual transformation, inheritance through surrender, research breakthroughs
9. **Ketu transit 9th house** — FAVORABLE — spiritual mastery, guru finding, past-life religious merit activating, father's spiritual journey, pilgrimage
10. **Ketu transit 10th house** — Career detachment, leaving corporate world, spiritual vocation, reputation indifference, public service
11. **Ketu transit 11th house** — Gains without desire, network shrinking, elder sibling spiritual growth, wish fulfillment through non-attachment
12. **Ketu transit 12th house** — MOST FAVORABLE — moksha, foreign spiritual retreats, deep meditation, past-life resolution, ashram life, final liberation

### Chapter 5: Nodal Return Analysis (Rahu-Ketu Parivartan Chakra)
Every 18.6 years, the nodes return to their natal positions — this is a major karmic milestone:
- **Nodal Return ages**: Calculate all nodal returns (approximately 18.6, 37.2, 55.8, 74.4 years of age). Which returns have already occurred and what life events coincided? Which are upcoming?
- **Reverse Nodal Return**: When Rahu transits natal Ketu and vice versa (approximately every 9.3 years) — what does this axis swap mean karmically?
- **Karmic significance**: Each nodal return represents a "karmic checkpoint" — what themes recur? What lessons repeat if unlearned?
- **Current position in the 18.6-year cycle**: Is the native in the first half (material pursuit) or second half (spiritual review) of the current nodal cycle?
- **Correlation with dasha periods**: Which dasha was running during each nodal return? How did the dasha lord interact with the returning nodes?

### Chapter 6: Eclipse Impact Analysis (Grahan Prabhav)
Eclipses occur when New Moon (solar eclipse) or Full Moon (lunar eclipse) falls near Rahu or Ketu:
- **Upcoming solar eclipses**: Identify the next 2-3 solar eclipses and their proximity to natal Rahu, Ketu, Sun, and Moon. If within 10°, explain the specific activation.
- **Upcoming lunar eclipses**: Identify the next 2-3 lunar eclipses and their proximity to natal positions. If within 10°, explain the karmic trigger.
- **Eclipse on natal planet**: What happens when an eclipse falls ON a natal planet? Which planet? In which house? Life area suddenly illuminated or disrupted.
- **Eclipse on natal Rahu-Ketu**: When an eclipse occurs on the natal nodal axis — the most powerful karmic activation. What to expect.
- **Pre-eclipse and post-eclipse windows**: Effects typically begin 3 months before and ripple 6 months after an eclipse. Timeline of manifestation.
- **Prenatal eclipse**: The eclipse nearest before birth — its degree and axis indicate a lifelong karmic theme. Analyze if data allows.

### Chapter 7: Karmic Axis Activation — Transit Nodes on Natal Planets
When transiting Rahu or Ketu conjuncts or opposes a natal planet, that planet's significations get karmically charged:
- **Rahu conjunct natal Sun**: Ego inflation, authority obsession, father's health, government matters suddenly prominent
- **Rahu conjunct natal Moon**: Mental obsession, mother concerns, emotional turbulence, popularity through unconventional means
- **Rahu conjunct natal Mars**: Amplified aggression, accident risk, surgical interventions, extreme courage, property disputes
- **Rahu conjunct natal Mercury**: Intellectual obsession, communication overload, business schemes, nervous system strain
- **Rahu conjunct natal Jupiter**: Guru confusion, religious extremism, excessive optimism, foreign education, wisdom distortion
- **Rahu conjunct natal Venus**: Obsessive romance, luxury addiction, artistic breakthroughs, unconventional relationships
- **Rahu conjunct natal Saturn**: Anxiety amplification, career upheaval through disruption, discipline tested by chaos
- **Ketu conjunct each natal planet**: The opposite effect — detachment, spiritualization, past-life resolution for each planet's significations
- **Opposition aspects**: Transiting Rahu opposing natal planets (= Ketu conjunct) and vice versa
- **Timing**: When exactly will each conjunction/opposition occur in the next 18 years? Which planets are being activated NOW?

### Chapter 8: Comprehensive Remedies (Raahu-Ketu Upchar)
Provide specific, actionable remedies:

**For Rahu:**
- **Rahu Beej Mantra**: "Om Bhram Bhreem Bhraum Sah Rahave Namah" — 18,000 jaap (repetitions), started on a Saturday or Wednesday during Rahu Kaal
- **Durga worship**: Recite Durga Chalisa or Durga Saptashati, especially during Rahu-dominant transits
- **Charity (Daan)**: Donate black sesame (til), mustard oil, iron items, black cloth on Saturdays to the needy
- **Gemstone**: Hessonite (Gomed) — IF Rahu is a yogakaraka or functional benefic for the lagna. Specify carat, metal, finger, day.
- **Fasting**: Saturday or Wednesday fasting during difficult Rahu transits
- **Yantra**: Rahu Yantra installation with proper Pran Pratishtha
- **Specific acts**: Feed crows, offer coconut to flowing water, keep an elephant tusk (or ivory substitute) at home

**For Ketu:**
- **Ketu Beej Mantra**: "Om Shram Shreem Shraum Sah Ketave Namah" — 17,000 jaap, started on a Tuesday or Saturday
- **Ganesh worship**: Regular Ganesh puja (Ketu is associated with Ganesh), especially Ganesh Chaturthi observance
- **Charity (Daan)**: Donate blankets, sesame (til), seven grains (sapta dhanya), dog food/care on Tuesdays
- **Gemstone**: Cat's Eye (Lehsunia / Vaidurya) — IF Ketu is a yogakaraka or functional benefic. Specify carat, metal, finger, day.
- **Fasting**: Tuesday or Saturday fasting during difficult Ketu transits
- **Yantra**: Ketu Yantra installation with proper Pran Pratishtha
- **Specific acts**: Feed dogs (Ketu's animal), donate a multi-colored blanket, serve elderly Brahmins or spiritual seekers

**Combined Nodal Remedies:**
- **Sarpa Dosha Shanti**: If Kaal Sarpa Dosha is present, prescribe Naga Puja at Trimbakeshwar or Srikalahasti
- **Navagraha Puja**: Comprehensive planetary propitiation during nodal return periods
- **Meditation**: Rahu-Ketu are shadow planets — meditation and mindfulness are the most natural remedies
- **Grounding practices**: Walking barefoot on earth, spending time in nature, avoiding excessive screen time during heavy Rahu transits

---

Generate this COMPLETE 8-chapter report in ${language === "hi" ? "Hindi (use Devanagari script, with Sanskrit terms naturally as used in Hindi Jyotish texts)" : "English (include Sanskrit/Hindi terms in parentheses for key concepts)"}. Each chapter must be substantial and detailed — this should read like a professional Vedic astrology consultation providing deep karmic insight into the nodal axis, not a brief overview.
  `.trim();
}
