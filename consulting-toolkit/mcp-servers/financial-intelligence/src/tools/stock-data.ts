import { z } from "zod";
import { stockDataSchema } from "../schemas/inputs.js";
import { getStockData } from "../services/yahoo.js";

type StockInput = z.infer<typeof stockDataSchema>;

function formatNumber(n: number | null): string {
  if (n === null || n === undefined) return "N/A";
  if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function handleStockData(input: StockInput): Promise<string> {
  const { ticker, period, interval } = input;
  const data = await getStockData(ticker, period, interval);
  const { quote, history } = data;

  const lines: string[] = [
    `## ${quote.name} (${quote.ticker})`,
    "",
    `### Current Quote`,
    "",
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Price | $${quote.price.toFixed(2)} |`,
    `| Change | ${quote.change >= 0 ? "+" : ""}${quote.change.toFixed(2)} (${quote.changePercent >= 0 ? "+" : ""}${quote.changePercent.toFixed(2)}%) |`,
    `| Market Cap | ${formatNumber(quote.marketCap)} |`,
    `| P/E (TTM) | ${quote.peRatio?.toFixed(2) || "N/A"} |`,
    `| Forward P/E | ${quote.forwardPE?.toFixed(2) || "N/A"} |`,
    `| Dividend Yield | ${quote.dividendYield ? (quote.dividendYield * 100).toFixed(2) + "%" : "N/A"} |`,
    `| 52W High | $${quote.fiftyTwoWeekHigh.toFixed(2)} |`,
    `| 52W Low | $${quote.fiftyTwoWeekLow.toFixed(2)} |`,
    `| Avg Volume (3M) | ${quote.avgVolume.toLocaleString()} |`,
    `| Beta | ${quote.beta?.toFixed(2) || "N/A"} |`,
    "",
  ];

  if (history.length > 0) {
    // Show summary stats for the period
    const closes = history.map((h) => h.close);
    const periodHigh = Math.max(...closes);
    const periodLow = Math.min(...closes);
    const firstClose = closes[0];
    const lastClose = closes[closes.length - 1];
    const periodReturn = ((lastClose - firstClose) / firstClose) * 100;

    lines.push(`### Price History (${period}, ${interval} interval)`);
    lines.push("");
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Period High | $${periodHigh.toFixed(2)} |`);
    lines.push(`| Period Low | $${periodLow.toFixed(2)} |`);
    lines.push(`| Period Return | ${periodReturn >= 0 ? "+" : ""}${periodReturn.toFixed(2)}% |`);
    lines.push(`| Data Points | ${history.length} |`);
    lines.push("");

    // Show last 10 data points as sample
    const sample = history.slice(-10);
    lines.push(`### Recent Price Data (last ${sample.length} points)`);
    lines.push("");
    lines.push(`| Date | Open | High | Low | Close | Volume |`);
    lines.push(`|------|------|------|-----|-------|--------|`);
    for (const h of sample) {
      lines.push(
        `| ${h.date} | $${h.open.toFixed(2)} | $${h.high.toFixed(2)} | $${h.low.toFixed(2)} | $${h.close.toFixed(2)} | ${h.volume.toLocaleString()} |`
      );
    }
  }

  lines.push("");
  lines.push(`*Data source: Yahoo Finance | Period: ${period} | Interval: ${interval}*`);

  return lines.join("\n");
}
