import axios, { type AxiosInstance } from "axios";
import {
  EDGAR_BASE_URL,
  EDGAR_XBRL_URL,
  EDGAR_SUBMISSIONS_URL,
  EDGAR_EFTS_URL,
  RATE_LIMITS,
  XBRL_METRIC_TAGS,
} from "../constants.js";
import type {
  EdgarCompanyInfo,
  EdgarXBRLFact,
  FinancialMetric,
  FinancialPeriod,
  DerivedMetric,
  FilingInfo,
} from "../types.js";
import { RateLimiter } from "./rate-limiter.js";

const limiter = new RateLimiter(RATE_LIMITS.edgar);

function createClient(): AxiosInstance {
  const userAgent = process.env.EDGAR_USER_AGENT || "FinancialIntelligenceMCP bot@example.com";
  return axios.create({
    baseURL: EDGAR_BASE_URL,
    headers: {
      "User-Agent": userAgent,
      Accept: "application/json",
    },
    timeout: 30_000,
  });
}

let client: AxiosInstance | null = null;
function getClient(): AxiosInstance {
  if (!client) client = createClient();
  return client;
}

// Pad CIK to 10 digits as required by EDGAR URLs
function padCik(cik: string): string {
  return cik.replace(/^0+/, "").padStart(10, "0");
}

// ── Ticker → CIK Resolution ──

interface TickerMapping {
  cik_str: string;
  ticker: string;
  title: string;
}

let tickerMap: Map<string, TickerMapping> | null = null;

async function loadTickerMap(): Promise<Map<string, TickerMapping>> {
  if (tickerMap) return tickerMap;
  await limiter.acquire();
  const { data } = await getClient().get(
    "https://www.sec.gov/files/company_tickers.json"
  );
  tickerMap = new Map<string, TickerMapping>();
  for (const entry of Object.values(data) as TickerMapping[]) {
    tickerMap.set(entry.ticker.toUpperCase(), entry);
  }
  return tickerMap;
}

export async function resolveTickerToCik(ticker: string): Promise<string> {
  const map = await loadTickerMap();
  const entry = map.get(ticker.toUpperCase());
  if (!entry) {
    throw new Error(`Ticker "${ticker}" not found in SEC EDGAR.`);
  }
  return entry.cik_str.toString();
}

// ── Company Info ──

export async function getCompanyInfo(
  tickerOrCik: string
): Promise<EdgarCompanyInfo> {
  let cik: string;
  if (/^\d+$/.test(tickerOrCik)) {
    cik = tickerOrCik;
  } else {
    cik = await resolveTickerToCik(tickerOrCik);
  }

  await limiter.acquire();
  const { data } = await getClient().get(
    `${EDGAR_SUBMISSIONS_URL}/CIK${padCik(cik)}.json`
  );

  return {
    cik: data.cik,
    ticker: (data.tickers?.[0] || tickerOrCik).toUpperCase(),
    name: data.name || data.entityName || "",
    sic: data.sic || "",
    sicDescription: data.sicDescription || "",
    exchanges: data.exchanges || [],
  };
}

// ── XBRL Company Facts ──

interface XBRLResponse {
  entityName: string;
  facts: {
    "us-gaap"?: Record<string, { units: Record<string, EdgarXBRLFact[]> }>;
    "dei"?: Record<string, { units: Record<string, EdgarXBRLFact[]> }>;
  };
}

export async function getCompanyFacts(cik: string): Promise<XBRLResponse> {
  await limiter.acquire();
  const { data } = await getClient().get<XBRLResponse>(
    `${EDGAR_XBRL_URL}/CIK${padCik(cik)}.json`
  );
  return data;
}

function extractMetricFromFacts(
  facts: XBRLResponse["facts"],
  metricName: string,
  period: "annual" | "quarterly",
  limit: number
): FinancialPeriod[] {
  const tags = XBRL_METRIC_TAGS[metricName];
  if (!tags || tags.length === 0) return [];

  const gaap = facts["us-gaap"] || {};
  const formFilter = period === "annual" ? "10-K" : "10-Q";

  // Try all tags and pick the one with the most recent data
  let bestResult: FinancialPeriod[] = [];
  let bestLatestDate = "";

  for (const tag of tags) {
    const factData = gaap[tag];
    if (!factData) continue;

    // Try USD first, then pure number
    const units = factData.units["USD"] || factData.units["USD/shares"] || factData.units["shares"] || factData.units["pure"];
    if (!units) continue;

    const filtered = units
      .filter((f) => f.form === formFilter && f.end && f.val !== undefined)
      .sort((a, b) => b.end.localeCompare(a.end));

    // Deduplicate by period end date (keep latest filing)
    const seen = new Set<string>();
    const deduped: EdgarXBRLFact[] = [];
    for (const fact of filtered) {
      if (!seen.has(fact.end)) {
        seen.add(fact.end);
        deduped.push(fact);
      }
    }

    if (deduped.length === 0) continue;

    const latestDate = deduped[0].end;
    if (latestDate > bestLatestDate) {
      bestLatestDate = latestDate;
      bestResult = deduped.slice(0, limit).map((fact) => ({
        period: period === "annual" ? `FY${fact.fy}` : `${fact.fp} ${fact.fy}`,
        endDate: fact.end,
        value: fact.val,
        form: fact.form,
        filed: fact.filed,
      }));
    }
  }

  return bestResult;
}

export async function getFinancialMetrics(
  tickerOrCik: string,
  metrics: string[],
  period: "annual" | "quarterly",
  limit: number
): Promise<{ company: EdgarCompanyInfo; metrics: FinancialMetric[]; derived: DerivedMetric[] }> {
  const info = await getCompanyInfo(tickerOrCik);
  const facts = await getCompanyFacts(info.cik);

  const result: FinancialMetric[] = [];
  for (const metric of metrics) {
    if (metric === "ebitda") continue; // Computed below
    const periods = extractMetricFromFacts(facts.facts, metric, period, limit);
    result.push({ metric, periods });
  }

  // Compute derived metrics
  const derived: DerivedMetric[] = [];

  // EBITDA = operating_income + depreciation
  if (metrics.includes("ebitda")) {
    const opIncome = extractMetricFromFacts(facts.facts, "operating_income", period, limit);
    const depreciation = extractMetricFromFacts(facts.facts, "depreciation", period, limit);
    const ebitdaPeriods = opIncome.map((oi) => {
      const dep = depreciation.find((d) => d.endDate === oi.endDate);
      return {
        period: oi.period,
        value: dep ? oi.value + dep.value : null,
      };
    });
    derived.push({ metric: "ebitda", periods: ebitdaPeriods });
  }

  // Revenue growth (YoY)
  const revenueMetric = result.find((m) => m.metric === "revenue");
  if (revenueMetric && revenueMetric.periods.length >= 2) {
    const growthPeriods = [];
    for (let i = 0; i < revenueMetric.periods.length - 1; i++) {
      const current = revenueMetric.periods[i].value;
      const prior = revenueMetric.periods[i + 1].value;
      growthPeriods.push({
        period: revenueMetric.periods[i].period,
        value: prior !== 0 ? ((current - prior) / Math.abs(prior)) * 100 : null,
      });
    }
    derived.push({ metric: "revenue_growth_pct", periods: growthPeriods });
  }

  // Gross margin
  const grossProfit = result.find((m) => m.metric === "gross_profit");
  if (grossProfit && revenueMetric) {
    const marginPeriods = grossProfit.periods.map((gp) => {
      const rev = revenueMetric.periods.find((r) => r.endDate === gp.endDate);
      return {
        period: gp.period,
        value: rev && rev.value !== 0 ? (gp.value / rev.value) * 100 : null,
      };
    });
    derived.push({ metric: "gross_margin_pct", periods: marginPeriods });
  }

  // Net margin
  const netIncome = result.find((m) => m.metric === "net_income");
  if (netIncome && revenueMetric) {
    const marginPeriods = netIncome.periods.map((ni) => {
      const rev = revenueMetric.periods.find((r) => r.endDate === ni.endDate);
      return {
        period: ni.period,
        value: rev && rev.value !== 0 ? (ni.value / rev.value) * 100 : null,
      };
    });
    derived.push({ metric: "net_margin_pct", periods: marginPeriods });
  }

  return { company: info, metrics: result, derived };
}

// ── Filing Retrieval ──

export async function getFilings(
  tickerOrCik: string,
  filingType: string,
  limit: number
): Promise<{ company: EdgarCompanyInfo; filings: FilingInfo[] }> {
  const info = await getCompanyInfo(tickerOrCik);
  await limiter.acquire();
  const { data } = await getClient().get(
    `${EDGAR_SUBMISSIONS_URL}/CIK${padCik(info.cik)}.json`
  );

  const recentFilings = data.filings?.recent || {};
  const forms: string[] = recentFilings.form || [];
  const accessions: string[] = recentFilings.accessionNumber || [];
  const filingDates: string[] = recentFilings.filingDate || [];
  const reportDates: string[] = recentFilings.reportDate || [];
  const primaryDocs: string[] = recentFilings.primaryDocument || [];
  const primaryDocDescs: string[] = recentFilings.primaryDocDescription || [];
  const items: string[] = recentFilings.items || [];

  const filings: FilingInfo[] = [];
  for (let i = 0; i < forms.length && filings.length < limit; i++) {
    if (forms[i] === filingType) {
      filings.push({
        accessionNumber: accessions[i],
        filingDate: filingDates[i],
        reportDate: reportDates[i] || filingDates[i],
        form: forms[i],
        primaryDocument: primaryDocs[i] || "",
        primaryDocDescription: primaryDocDescs[i] || "",
        items: items[i] || "",
      });
    }
  }

  return { company: info, filings };
}

export async function getFilingDocument(
  cik: string,
  accessionNumber: string,
  primaryDocument: string
): Promise<string> {
  const accessionPath = accessionNumber.replace(/-/g, "");
  const numericCik = parseInt(cik, 10).toString();
  const url = `https://www.sec.gov/Archives/edgar/data/${numericCik}/${accessionPath}/${primaryDocument}`;
  await limiter.acquire();
  const { data } = await getClient().get(url, {
    responseType: "text",
    headers: { Accept: "text/html,text/plain,*/*" },
  });
  return stripHtml(data);
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#?\w+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Company Search by SIC Code ──

export async function getCompaniesBySic(sicCode: string, limit: number = 15): Promise<EdgarCompanyInfo[]> {
  await limiter.acquire();
  const { data } = await getClient().get(
    `${EDGAR_EFTS_URL}/search-index?q=%22${sicCode}%22&dateRange=custom&startdt=2024-01-01&forms=10-K`,
    { baseURL: "" }
  );

  // Fallback: use the ticker map to find companies by SIC
  const map = await loadTickerMap();
  const companies: EdgarCompanyInfo[] = [];
  const seenCiks = new Set<string>();

  // Try to get company info for each match
  if (data?.hits?.hits) {
    for (const hit of data.hits.hits) {
      if (companies.length >= limit) break;
      const entityName = hit._source?.entity_name;
      const fileCik = hit._source?.file_num?.split("-")[0];
      if (fileCik && !seenCiks.has(fileCik)) {
        seenCiks.add(fileCik);
        try {
          const info = await getCompanyInfo(fileCik);
          if (info.sic === sicCode) {
            companies.push(info);
          }
        } catch {
          // Skip companies that fail to resolve
        }
      }
    }
  }

  // If we didn't find enough via search, scan ticker map
  if (companies.length < limit) {
    for (const [ticker, entry] of map) {
      if (companies.length >= limit) break;
      if (seenCiks.has(entry.cik_str)) continue;
      try {
        const info = await getCompanyInfo(entry.cik_str);
        if (info.sic === sicCode) {
          seenCiks.add(entry.cik_str);
          companies.push(info);
        }
      } catch {
        // Skip
      }
    }
  }

  return companies;
}
