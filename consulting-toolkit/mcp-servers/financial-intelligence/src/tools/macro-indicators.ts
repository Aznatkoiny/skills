import { z } from "zod";
import { macroIndicatorsSchema } from "../schemas/inputs.js";
import { getObservations } from "../services/fred.js";
import { COMMON_FRED_SERIES } from "../constants.js";

type MacroInput = z.infer<typeof macroIndicatorsSchema>;

export async function handleMacroIndicators(input: MacroInput): Promise<string> {
  const { series_id, start_date, end_date, limit } = input;
  const data = await getObservations(series_id, start_date, end_date, limit);
  const { series, observations } = data;

  const lines: string[] = [
    `## ${series.title}`,
    "",
    `| Field | Value |`,
    `|-------|-------|`,
    `| Series ID | ${series.id} |`,
    `| Units | ${series.units} |`,
    `| Frequency | ${series.frequency} |`,
    `| Seasonal Adjustment | ${series.seasonalAdjustment} |`,
    `| Last Updated | ${series.lastUpdated} |`,
    "",
  ];

  if (observations.length > 0) {
    lines.push(`### Observations (${observations.length} most recent)`);
    lines.push("");
    lines.push(`| Date | Value |`);
    lines.push(`|------|-------|`);
    for (const obs of observations) {
      lines.push(`| ${obs.date} | ${obs.value !== null ? obs.value.toLocaleString() : "N/A"} |`);
    }
  } else {
    lines.push("*No observations found for the specified parameters.*");
  }

  if (series.notes) {
    lines.push("");
    lines.push(`### Notes`);
    lines.push(series.notes.substring(0, 500));
  }

  // Add common series reference
  lines.push("");
  lines.push("---");
  lines.push("*Common FRED series: " + Object.entries(COMMON_FRED_SERIES).map(([k, v]) => `${k}=${v}`).join(", ") + "*");

  return lines.join("\n");
}
