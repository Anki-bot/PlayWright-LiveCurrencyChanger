# Playwright Live Currency Exchange QA Suite (Page Object Model + API Verification)



An end-to-end QA automation framework built with **Playwright (JavaScript)** implementing the [Page Object Model (POM)](https://www.google.com/search?q=https%3A%2F%2Fplaywright.dev%2Fdocs%2Fpom) design pattern.



This test suite automates the [Calculator.net Currency Calculator](https://www.google.com/search?q=https%3A%2F%2Fwww.calculator.net%2Fcurrency-calculator.html) and cross-verifies live UI conversions against an independent REST API oracle ([ExchangeRate-API Open Access Endpoint](https://www.google.com/search?q=https%3A%2F%2Fwww.exchangerate-api.com%2Fdocs%2Ffree)) using Playwright's built-in [APIRequestContext (request)](https://www.google.com/search?q=https%3A%2F%2Fplaywright.dev%2Fdocs%2Fapi-testing).



## How to View the Test Results (For Recruiters & Reviewers)



You can inspect and verify this test suite in **three ways**:



### Option 1: View the Live Audit Report Online (No Installation Required)



Click **[currency-audit-report.md](https://www.google.com/search?q=.%2Fcurrency-audit-report.md)** in the file list above to view the complete auto-generated test log from the latest 2-minute execution run. Below is a sample excerpt from that report comparing the website's UI output against the live market API:



| Time | Cycle | Pair | Website UI Output | API Expected Value | Diff % | Status | Response Time |

| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |

| `12:07:12 PM` | `#1` | `USD->INR` | `100 USD = 9,488.9257 INR` | `9531.9179 INR` | `0.451%` | `ACCURATE` | `1097ms` |

| `12:07:17 PM` | `#1` | `EUR->USD` | `250 EUR = 280.13747 USD` | `279.8237 USD` | `0.112%` | `ACCURATE` | `708ms` |

| `12:07:20 PM` | `#1` | `GBP->INR` | `50 GBP = 6,295.85627 INR` | `6309.6544 INR` | `0.219%` | `ACCURATE` | `374ms` |

| `12:07:25 PM` | `#1` | `JPY->USD` | `10,000 JPY = 63.16137 USD` | `63.17 USD` | `0.014%` | `ACCURATE` | `963ms` |

| `12:07:28 PM` | `#1` | `AUD->CAD` | `500 AUD = 496.93669 CAD` | `496.479 CAD` | `0.092%` | `ACCURATE` | `414ms` |



### Option 2: Clone & Watch the Automated Browser Tests Run Live Locally



Run the following commands in your terminal to clone this repository, install Playwright, and watch Chromium execute all 6 test scenarios live on your screen:



```bash

git clone https://github.com/Anki-bot/PlayWright-LiveCurrencyChanger.git

cd PlayWright-LiveCurrencyChanger

npm init -y

npm install -D @playwright/test

npx playwright install chromium

npx playwright test tests/currency.spec.js --headed

```



### Option 3: Inspect the Interactive HTML Dashboard & Step-by-Step Trace



As soon as the test run completes, Playwright automatically opens the interactive HTML report ([Playwright Reporters](https://www.google.com/search?q=https%3A%2F%2Fplaywright.dev%2Fdocs%2Ftest-reporters)) containing full video playback, step-by-step screenshots, and downloadable audit attachments. You can also launch the report or [Playwright Trace Viewer](https://www.google.com/search?q=https%3A%2F%2Fplaywright.dev%2Fdocs%2Ftrace-viewer) manually at any time:



```bash

npx playwright show-report --host 127.0.0.1

npx playwright show-trace test-results/*/trace.zip

```



## Project Architecture (Page Object Model)



```text

PlayWright-LiveCurrencyChanger/

├── pages/

│   └── currencyPage.js          # Page Class: Centralizes all DOM locators, UI actions & API calls

├── tests/

│   └── currency.spec.js         # Test Suite: 6 end-to-end UI + API verification test specs

├── .gitignore                   # Excludes node_modules/, test-results/, playwright-report/

├── playwright.config.js         # Isolated Playwright config (HTML report, video, screenshots, traces)

├── currency-audit-report.md     # Auto-generated Markdown report of verified live conversions

└── README.md                    # Project documentation & viewer guide

```



## Full-Page QA Test Coverage (6 Automated Tests)



| Test # | Test Scenario | What Playwright Verifies |

| :--- | :--- | :--- |

| **Test 1** | **2-Minute Continuous Multi-Currency Rate Audit (UI vs. Live API)** | Loops through 10 global currency pairs (`USD->INR`, `EUR->USD`, `GBP->INR`, `JPY->USD`, `AUD->CAD`, `CHF->EUR`, `SGD->INR`, `CAD->USD`, `CNY->INR`, `ZAR->USD`) for 120 seconds, cross-checking every UI result against the live [ExchangeRate-API Open Endpoint](https://www.google.com/search?q=https%3A%2F%2Fwww.exchangerate-api.com%2Fdocs%2Ffree) (`diffPercent < 3%`) and exporting [currency-audit-report.md](https://www.google.com/search?q=.%2Fcurrency-audit-report.md) |

| **Test 2** | **Identity Conversion Boundary (`USD -> USD`)** | Verifies converting `100 USD` to `USD` outputs an exact `1:1` ratio (`100 USD = 100 USD`) |

| **Test 3** | **Mathematical Round-Trip Consistency (`USD -> EUR -> USD`)** | Converts `100 USD` to `EUR`, feeds the converted `EUR` value back into `EUR -> USD`, and asserts the result returns to `100` (`99`–`101`) |

| **Test 4** | **Dynamic Dropdown Filter (`Show most popular currencies only`)** | Clicks the visible label wrapping the CSS-hidden `#ccmajorccsettingbox` checkbox via `page.getByText('Show most popular currencies only')` and verifies the `#efrom` dropdown dynamically expands from `17` popular currencies to `150+` world currencies |

| **Test 5** | **Form Reset (`Clear` Button) & Market Exchange Rates Table** | Enters `999`, clicks **Clear**, asserts the `#eamount` input resets to empty (`''`), and verifies the **Market Exchange Rates Table** heading is visible |

| **Test 6** | **Customized Currency Exchange Rate Calculator (2nd Form)** | Enters a fixed custom exchange rate (`85`) and amount (`10`) into the secondary calculator and verifies the deterministic result (`850`) |



## Key Engineering Highlights



- **Strict Separation of Concerns**: All CSS/ID selectors and page interactions are encapsulated inside `pages/currencyPage.js`, keeping `tests/currency.spec.js` clean, readable, and resilient to DOM updates.

- **Custom CSS Control Handling**: Targets the visible label via `page.getByText('Show most popular currencies only')` to toggle the CSS-hidden `#ccmajorccsettingbox` checkbox cleanly.

- **Hybrid UI + API Test Oracle**: Queries a live external financial endpoint in parallel and validates mathematical consistency within a strict variance threshold.

- **Automated Audit Trail & Observability**: Captures full execution video, step-by-step screenshots, interactive traces, and an exported Markdown audit log ([currency-audit-report.md](https://www.google.com/search?q=.%2Fcurrency-audit-report.md)) on every run.

