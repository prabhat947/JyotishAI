/**
 * Shared helper functions for all report prompt templates.
 * All data access is defensive — handles missing/malformed chart data gracefully.
 */
import { ChartData } from "../astro-client";

/** Safely join an array-like value, or return fallback */
function safeJoin(val: unknown, sep = ", "): string {
  if (Array.isArray(val)) return val.join(sep);
  if (val == null) return "?";
  return String(val);
}

/** Format all planets into a detailed listing */
export function formatPlanets(planets: ChartData["planets"]): string {
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

/** Format all 12 houses */
export function formatHouses(houses: ChartData["houses"]): string {
  if (!houses) return "House data not available";
  return Object.entries(houses)
    .map(
      ([num, h]) =>
        `- **${num}th House**: ${h?.sign || "?"}, Lord: ${h?.lord || "?"}, ` +
        `Occupants: ${Array.isArray(h?.planets) && h.planets.length > 0 ? h.planets.join(", ") : "Empty"}`
    )
    .join("\n");
}

/** Format dasha sequence */
export function formatDashaSequence(dashas: ChartData["dashas"]): string {
  if (!dashas?.sequence) return "Dasha sequence not available";
  if (!Array.isArray(dashas.sequence)) return "Dasha sequence not available";
  return dashas.sequence
    .map((d) => `- **${d?.planet || "?"}** Mahadasha: ${d?.start || "?"} → ${d?.end || "?"}`)
    .join("\n");
}

/** Format yogas */
export function formatYogas(yogas: ChartData["yogas"]): string {
  if (!yogas || !Array.isArray(yogas) || yogas.length === 0) return "No yogas detected";
  return yogas
    .map(
      (y) =>
        `- **${y?.name || "Unknown"}** [${y?.type || "?"}/${y?.strength || "?"}]: ${y?.description || "N/A"} | Planets: ${safeJoin(y?.planets)} | Effect: ${y?.effect || "N/A"}`
    )
    .join("\n");
}

/** Format ashtakavarga */
export function formatAshtakavarga(ashtakavarga: ChartData["ashtakavarga"]): string {
  if (!ashtakavarga) return "Ashtakavarga data not available";
  return Object.entries(ashtakavarga)
    .map(([planet, bindus]) => {
      const binduStr = Array.isArray(bindus) ? bindus.join(", ") : String(bindus ?? "?");
      const total = Array.isArray(bindus) ? bindus.reduce((a, b) => a + b, 0) : "?";
      return `- **${planet}**: [${binduStr}] (Aries→Pisces) Total: ${total}`;
    })
    .join("\n");
}

/** Safe house planets join */
export function safeHousePlanets(house: { planets?: string[] } | undefined): string {
  if (!house?.planets || !Array.isArray(house.planets) || house.planets.length === 0) return "Empty";
  return house.planets.join(", ");
}
