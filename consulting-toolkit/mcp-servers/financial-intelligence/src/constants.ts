// SEC EDGAR API — No key required, User-Agent with email required
export const EDGAR_BASE_URL = "https://data.sec.gov";
export const EDGAR_EFTS_URL = "https://efts.sec.gov/LATEST";
export const EDGAR_XBRL_URL = `${EDGAR_BASE_URL}/api/xbrl/companyfacts`;
export const EDGAR_SUBMISSIONS_URL = `${EDGAR_BASE_URL}/submissions`;
export const EDGAR_FULL_TEXT_SEARCH_URL = `${EDGAR_EFTS_URL}/search-index`;

// FRED API — Requires FRED_API_KEY env var
export const FRED_BASE_URL = "https://api.stlouisfed.org/fred";
export const FRED_SERIES_URL = `${FRED_BASE_URL}/series`;
export const FRED_OBSERVATIONS_URL = `${FRED_SERIES_URL}/observations`;

// Rate limits (requests per second)
export const RATE_LIMITS = {
  edgar: 10,    // SEC official limit: 10 req/s
  fred: 2,      // Conservative (undocumented, ~120/min practical)
  yahoo: 0.1,   // Very conservative (~6/min safe)
} as const;

// Response limits
export const CHARACTER_LIMIT = 50_000;
export const MAX_FILING_TEXT_LENGTH = 30_000;
export const MAX_COMPANIES_COMPARE = 5;
export const MAX_INDUSTRY_PEERS = 15;
export const DEFAULT_PERIODS = 5;

// Common XBRL taxonomy tags for financial metrics
export const XBRL_METRIC_TAGS: Record<string, string[]> = {
  revenue: [
    "Revenues",
    "RevenueFromContractWithCustomerExcludingAssessedTax",
    "SalesRevenueNet",
    "RevenueFromContractWithCustomerIncludingAssessedTax",
  ],
  net_income: [
    "NetIncomeLoss",
    "ProfitLoss",
    "NetIncomeLossAvailableToCommonStockholdersBasic",
  ],
  ebitda: [], // Computed: operating_income + depreciation_amortization
  operating_income: [
    "OperatingIncomeLoss",
    "IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest",
  ],
  total_assets: ["Assets"],
  total_liabilities: ["Liabilities"],
  stockholders_equity: [
    "StockholdersEquity",
    "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest",
  ],
  cash: [
    "CashAndCashEquivalentsAtCarryingValue",
    "CashCashEquivalentsAndShortTermInvestments",
  ],
  total_debt: [
    "LongTermDebt",
    "LongTermDebtAndCapitalLeaseObligations",
    "DebtCurrent",
  ],
  depreciation: [
    "DepreciationDepletionAndAmortization",
    "DepreciationAndAmortization",
    "Depreciation",
  ],
  cost_of_revenue: [
    "CostOfRevenue",
    "CostOfGoodsAndServicesSold",
    "CostOfGoodsSold",
  ],
  gross_profit: ["GrossProfit"],
  eps: [
    "EarningsPerShareBasic",
    "EarningsPerShareDiluted",
  ],
  shares_outstanding: [
    "CommonStockSharesOutstanding",
    "WeightedAverageNumberOfShareOutstandingBasicAndDiluted",
    "EntityCommonStockSharesOutstanding",
  ],
};

// Common FRED series IDs for quick reference
export const COMMON_FRED_SERIES: Record<string, string> = {
  GDP: "GDP",
  REAL_GDP: "GDPC1",
  CPI: "CPIAUCSL",
  CORE_CPI: "CPILFESL",
  FED_FUNDS: "FEDFUNDS",
  UNEMPLOYMENT: "UNRATE",
  "10Y_TREASURY": "DGS10",
  "2Y_TREASURY": "DGS2",
  SP500: "SP500",
  VIX: "VIXCLS",
  HOUSING_STARTS: "HOUST",
  INDUSTRIAL_PRODUCTION: "INDPRO",
};
