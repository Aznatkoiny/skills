#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  companyFinancialsSchema,
  filingTextSchema,
  stockDataSchema,
  macroIndicatorsSchema,
  earningsTranscriptSchema,
  compareCompaniesSchema,
  industryBenchmarksSchema,
} from "./schemas/inputs.js";
import { handleCompanyFinancials } from "./tools/company-financials.js";
import { handleFilingText } from "./tools/filing-text.js";
import { handleStockData } from "./tools/stock-data.js";
import { handleMacroIndicators } from "./tools/macro-indicators.js";
import { handleEarningsTranscript } from "./tools/earnings-transcript.js";
import { handleCompareCompanies } from "./tools/compare-companies.js";
import { handleIndustryBenchmarks } from "./tools/industry-benchmarks.js";

const server = new McpServer({
  name: "financial-intelligence",
  version: "1.0.0",
});

// ── Tool Registration ──

server.tool(
  "fin_get_company_financials",
  "Retrieve financial metrics (revenue, EBITDA, margins, growth rates) for a public company from SEC EDGAR XBRL data. Supports annual and quarterly periods.",
  companyFinancialsSchema.shape,
  async (input) => {
    try {
      const text = await handleCompanyFinancials(input);
      return { content: [{ type: "text" as const, text }] };
    } catch (err) {
      return {
        content: [{ type: "text" as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "fin_get_filing_text",
  "Retrieve the full text of SEC filings (10-K, 10-Q, 8-K) for qualitative analysis. Returns cleaned text from the primary filing document.",
  filingTextSchema.shape,
  async (input) => {
    try {
      const text = await handleFilingText(input);
      return { content: [{ type: "text" as const, text }] };
    } catch (err) {
      return {
        content: [{ type: "text" as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "fin_get_stock_data",
  "Get stock price history, current quote, market cap, P/E ratio, and key statistics from Yahoo Finance.",
  stockDataSchema.shape,
  async (input) => {
    try {
      const text = await handleStockData(input);
      return { content: [{ type: "text" as const, text }] };
    } catch (err) {
      return {
        content: [{ type: "text" as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "fin_get_macro_indicators",
  "Fetch macroeconomic indicators from FRED (Federal Reserve). Supports GDP, CPI, interest rates, unemployment, and thousands of other series.",
  macroIndicatorsSchema.shape,
  async (input) => {
    try {
      const text = await handleMacroIndicators(input);
      return { content: [{ type: "text" as const, text }] };
    } catch (err) {
      return {
        content: [{ type: "text" as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "fin_get_earnings_transcript",
  "Extract earnings-related 8-K filings (Item 2.02) as a proxy for earnings call transcripts. Best-effort from public SEC data.",
  earningsTranscriptSchema.shape,
  async (input) => {
    try {
      const text = await handleEarningsTranscript(input);
      return { content: [{ type: "text" as const, text }] };
    } catch (err) {
      return {
        content: [{ type: "text" as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "fin_compare_companies",
  "Side-by-side financial comparison of 2-5 public companies with rankings. Uses SEC EDGAR data.",
  compareCompaniesSchema.shape,
  async (input) => {
    try {
      const text = await handleCompareCompanies(input);
      return { content: [{ type: "text" as const, text }] };
    } catch (err) {
      return {
        content: [{ type: "text" as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "fin_get_industry_benchmarks",
  "Compute industry benchmark statistics (median, mean, quartiles) by SIC code using SEC EDGAR data from peer companies.",
  industryBenchmarksSchema.shape,
  async (input) => {
    try {
      const text = await handleIndustryBenchmarks(input);
      return { content: [{ type: "text" as const, text }] };
    } catch (err) {
      return {
        content: [{ type: "text" as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      };
    }
  }
);

// ── Server Startup ──

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Financial Intelligence MCP Server started (stdio transport)");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
