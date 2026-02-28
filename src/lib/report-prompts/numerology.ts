import { ChartData } from "../astro-client";

export default function numerologyPrompt(chartData: ChartData, language: "en" | "hi"): string {
  const { numerology } = chartData;

  if (!numerology) {
    return "Numerology data not available in chart.";
  }

  return `
# Numerology Report

## Core Numbers
- **Birth Number**: ${numerology.birth_number}
- **Destiny Number**: ${numerology.destiny_number}
- **Name Number**: ${numerology.name_number || "Not calculated"}

## Analysis Request
Vedic numerology (based on Chaldean system) reveals personality and destiny through numbers.

Provide detailed analysis:

### Birth Number (${numerology.birth_number})
1. Core personality traits
2. Natural talents and abilities
3. Life approach and behavior
4. Strengths and challenges
5. Ruling planet connection

### Destiny Number (${numerology.destiny_number})
6. Life purpose and mission
7. Career paths suited
8. Relationship compatibility
9. Major life themes
10. Karmic lessons

${numerology.name_number ? `
### Name Number (${numerology.name_number})
11. Social personality
12. How others perceive you
13. Professional image
14. Name change recommendations if needed
` : ""}

### Number Combinations
15. Birth + Destiny synergy
16. Favorable dates and numbers
17. Unfavorable dates to avoid
18. Lucky numbers, colors, gemstones
19. Compatible people (by birth number)

### Year Analysis
20. Current personal year number and predictions
21. Next 5 personal years forecast

### Remedies & Recommendations
22. Numerology-based remedies
23. Name spelling optimization
24. Business/vehicle number selection
25. Important date selection

Generate comprehensive numerology report in ${language === "hi" ? "Hindi" : "English"}.
  `.trim();
}
