Playwright Live Currency Exchange QA Suite (Page Object Model + API Verification)

An end-to-end QA automation framework built with Playwright (JavaScript) implementing the Page Object Model (POM) design pattern.

This test suite automates the Calculator.net Currency Calculator and cross-verifies live UI conversions against an independent REST API oracle (ExchangeRate-API Open Access Endpoint) using Playwright's built-in APIRequestContext (request).

Project Architecture (Page Object Model)

PW-LiveCurrencyChanger/
├── pages/
│   └── currencyPage.js          # Page Class: Centralizes all DOM locators, UI actions & API calls
├── tests/
│   └── currency.spec.js         # Test Suite: 6 end-to-end UI + API verification test specs
├── playwright.config.js         # Isolated Playwright config (HTML report, video, screenshots, traces)
├── currency-audit-report.md     # Auto-generated Markdown report of verified live conversions
└── README.md                    # Project documentation


Full-Page QA Test Coverage (6 Automated Tests)

Test #

Test Scenario

What Playwright Verifies

Test 1

2-Minute Continuous Multi-Currency Rate Audit (UI vs. Live API)

Loops through 10 global currency pairs (USD->INR, EUR->USD, GBP->INR, JPY->USD, AUD->CAD, CHF->EUR, SGD->INR, CAD->USD, CNY->INR, ZAR->USD) for 120 seconds, cross-checking every UI result against the live ExchangeRate-API Open Endpoint (diffPercent < 3%) and exporting currency-audit-report.md

Test 2

Identity Conversion Boundary (USD -> USD)

Verifies converting 100 USD to USD outputs an exact 1:1 ratio (100 USD = 100 USD)

Test 3

Mathematical Round-Trip Consistency (USD -> EUR -> USD)

Converts 100 USD to EUR, feeds the converted EUR value back into EUR -> USD, and asserts the result returns to 100 (99–101)

Test 4

Dynamic Dropdown Filter (#ccmajorccsettingbox)

Verifies that unchecking "Show most popular currencies only" dynamically expands the #efrom dropdown from 17 popular currencies to 150+ world currencies

Test 5

Form Reset (Clear Button) & Market Exchange Rates Table

Enters 999, clicks Clear, asserts the #eamount input resets to empty (''), and verifies the Market Exchange Rates Table heading is visible

Test 6

Customized Currency Exchange Rate Calculator (2nd Form)

Enters a fixed custom exchange rate (85) and amount (10) into the secondary calculator and verifies the deterministic result (850)

Key Engineering Highlights

Strict Separation of Concerns: All CSS/ID selectors and page interactions are encapsulated inside pages/currencyPage.js, keeping tests/currency.spec.js clean, readable, and resilient to DOM updates.

Hybrid UI + API Test Oracle: Rather than relying on static hardcoded assertions for fluctuating foreign exchange rates, the framework queries a live external financial endpoint in parallel and validates mathematical consistency within a strict variance threshold.

Automated Audit Trail & Observability: Captures full execution video, step-by-step screenshots, interactive traces, and an exported Markdown audit log (currency-audit-report.md) on every run.

How to Run the Test Suite & View Reports

Execute all 6 tests in headed browser mode:

npx playwright test tests/currency.spec.js --headed


Open the interactive HTML dashboard (Playwright Reporters):

npx playwright show-report --host 127.0.0.1


Open the step-by-step Trace Viewer (Playwright Trace Viewer):

npx playwright show-trace test-results/*/trace.zip
