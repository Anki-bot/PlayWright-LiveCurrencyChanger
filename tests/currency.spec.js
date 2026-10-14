import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { CurrencyPage } from "../pages/currencyPage";

// 10-pair global currency test matrix for our 2-minute continuous audit
const CURRENCY_TEST_MATRIX = [
  { amount: 100, from: "USD", to: "INR", label: "US Dollar to Indian Rupee" },
  { amount: 250, from: "EUR", to: "USD", label: "Euro to US Dollar" },
  {
    amount: 50,
    from: "GBP",
    to: "INR",
    label: "British Pound to Indian Rupee",
  },
  { amount: 10000, from: "JPY", to: "USD", label: "Japanese Yen to US Dollar" },
  {
    amount: 500,
    from: "AUD",
    to: "CAD",
    label: "Australian Dollar to Canadian Dollar",
  },
  { amount: 100, from: "CHF", to: "EUR", label: "Swiss Franc to Euro" },
  {
    amount: 1000,
    from: "SGD",
    to: "INR",
    label: "Singapore Dollar to Indian Rupee",
  },
  {
    amount: 75.5,
    from: "CAD",
    to: "USD",
    label: "Canadian Dollar (Decimal) to US Dollar",
  },
  {
    amount: 500,
    from: "CNY",
    to: "INR",
    label: "Chinese Yuan to Indian Rupee",
  },
  {
    amount: 100,
    from: "ZAR",
    to: "USD",
    label: "South African Rand to US Dollar",
  },
];

test.describe("Live Currency Exchange Checker - Full QA Portfolio Suite", () => {
  test("1. 2-Minute Continuous Multi-Currency Rate Audit (UI vs. Live Market API Verification)", async ({
    page,
    request,
  }, testInfo) => {
    // Allow up to 5 minutes (300,000 ms) so a 2-minute loop + video/trace packaging never hits a timeout
    test.setTimeout(300000);

    const currencyPage = new CurrencyPage(page);
    const auditLogs = [];
    const targetDurationMs = 120000; // 2 minutes (120,000 ms)

    await test.step("Navigate to Calculator.net Currency Calculator", async () => {
      await currencyPage.gotoCurrencyCalculator();
    });

    // Start the 2-minute timer AFTER the initial page load finishes
    const suiteStartTime = Date.now();

    let cycle = 1;
    while (Date.now() - suiteStartTime < targetDurationMs) {
      for (const item of CURRENCY_TEST_MATRIX) {
        if (Date.now() - suiteStartTime >= targetDurationMs) break;

        await test.step(`Cycle ${cycle}: Verify ${item.amount} ${item.from} -> ${item.to} (${item.label})`, async () => {
          // A. Perform the conversion on the website UI
          const result = await currencyPage.convertCurrency(
            item.amount,
            item.from,
            item.to,
          );

          // B. Fetch the independent ground-truth market rate via Playwright's API request fixture
          const officialApiRate = await currencyPage.fetchOfficialMarketRate(
            request,
            item.from,
            item.to,
          );
          const expectedMarketValue = Number(
            (item.amount * officialApiRate).toFixed(4),
          );

          // C. Calculate percentage difference between Calculator.net UI and independent Market API
          const diffPercent =
            Math.abs(
              (result.convertedValue - expectedMarketValue) /
                expectedMarketValue,
            ) * 100;

          // Format numbers >= 1000 with commas (e.g., 10000 -> "10,000") to match Calculator.net UI output
          const formattedAmount = Number(item.amount).toLocaleString("en-US");

          // D. QA Assertions:
          // 1. UI element visibility & text formatting
          await expect(currencyPage.resultContainer).toBeVisible();
          await expect(currencyPage.resultContainer).toContainText(
            `${formattedAmount} ${item.from} =`,
          );
          await expect(currencyPage.resultContainer).toContainText(item.to);

          // 2. Internal Math Check: If the UI shows a 1-unit rate, verify Amount * UnitRate === Total
          if (result.uiUnitRate !== null) {
            expect(result.convertedValue).toBeCloseTo(
              item.amount * result.uiUnitRate,
              2,
            );
          }

          // 3. External API Oracle Check: Verify UI output is within 3% of the live independent market API
          expect(diffPercent).toBeLessThan(3);

          const logEntry = {
            cycle,
            ...result,
            expectedMarketValue,
            diffPercent: `${diffPercent.toFixed(3)}%`,
            accuracyStatus: diffPercent < 3 ? "ACCURATE" : "DRIFT_DETECTED",
          };
          auditLogs.push(logEntry);

          console.log(
            `[${result.timestamp}] Cycle ${cycle} | UI: ${result.rawText} | API Expected: ${expectedMarketValue} ${item.to} | Diff: ${diffPercent.toFixed(3)}% [${logEntry.accuracyStatus}] (${result.durationMs}ms)`,
          );

          // Only pause if there are still at least 3 seconds left in the 2-minute window
          const remainingMs = targetDurationMs - (Date.now() - suiteStartTime);
          if (remainingMs > 3000) {
            await page.waitForTimeout(3000);
          }
        });
      }
      cycle++;
    }

    // Build a formatted Summary Report comparing UI Output vs. Official API Expected Value
    const totalElapsedSec = ((Date.now() - suiteStartTime) / 1000).toFixed(1);
    const reportHeader = [
      `=============================================================================================================`,
      `LIVE CURRENCY EXCHANGE QA AUDIT REPORT (UI OUTPUT vs. INDEPENDENT LIVE MARKET API)`,
      `Total Run Duration: ${totalElapsedSec} seconds | Total Conversions Verified: ${auditLogs.length}`,
      `=============================================================================================================`,
      `Time       | Cycle | Pair     | Website UI Output                 | API Expected Value | Diff %  | Status`,
      `-------------------------------------------------------------------------------------------------------------`,
    ];

    const reportRows = auditLogs.map(
      (log) =>
        `${log.timestamp.padEnd(10)} | #${String(log.cycle).padEnd(4)} | ${log.fromCode}->${log.toCode} | ${log.rawText.padEnd(33)} | ${String(log.expectedMarketValue + " " + log.toCode).padEnd(18)} | ${log.diffPercent.padEnd(7)} | ${log.accuracyStatus}`,
    );

    const finalSummaryReport = [...reportHeader, ...reportRows].join("\n");
    console.log("\n" + finalSummaryReport);

    // Save a permanent Markdown audit report directly in PW-LiveCurrencyChanger/currency-audit-report.md
    const mdLines = [
      `# Live Currency Exchange QA Audit Report`,
      `- **Total Run Duration**: ${totalElapsedSec} seconds`,
      `- **Total Conversions Verified**: ${auditLogs.length}`,
      ``,
      `| Time | Cycle | Pair | Website UI Output | API Expected Value | Diff % | Status | Response Time |`,
      `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |`,
      ...auditLogs.map(
        (l) =>
          `| ${l.timestamp} | #${l.cycle} | ${l.fromCode}->${l.toCode} | ${l.rawText} | ${l.expectedMarketValue} ${l.toCode} | ${l.diffPercent} | ${l.accuracyStatus} | ${l.durationMs}ms |`,
      ),
    ];
    fs.writeFileSync(
      path.join(process.cwd(), "currency-audit-report.md"),
      mdLines.join("\n"),
      "utf-8",
    );

    // Attach the audit table and JSON data directly into the Playwright HTML Report
    await testInfo.attach("Live Currency Rate Accuracy Audit Table (Text)", {
      body: finalSummaryReport,
      contentType: "text/plain",
    });

    await testInfo.attach("Live Currency Rate Accuracy Audit Data (JSON)", {
      body: JSON.stringify(auditLogs, null, 2),
      contentType: "application/json",
    });
  });

  test("2. Identity Conversion Check: Converting USD to USD should equal 1:1", async ({
    page,
  }) => {
    const currencyPage = new CurrencyPage(page);
    await currencyPage.gotoCurrencyCalculator();

    const result = await currencyPage.convertCurrency(100, "USD", "USD");
    await expect(currencyPage.resultContainer).toContainText(
      "100 USD = 100 USD",
    );
    expect(result.convertedValue).toBe(100);
  });

  test("3. Mathematical Round-Trip Consistency Check (USD -> EUR -> USD)", async ({
    page,
  }) => {
    const currencyPage = new CurrencyPage(page);
    await currencyPage.gotoCurrencyCalculator();

    // Convert 100 USD to EUR
    const forward = await currencyPage.convertCurrency(100, "USD", "EUR");
    expect(forward.convertedValue).toBeGreaterThan(0);

    // Convert that exact EUR amount back to USD and verify it is approximately 100 USD
    const backward = await currencyPage.convertCurrency(
      forward.convertedValue,
      "EUR",
      "USD",
    );
    expect(backward.convertedValue).toBeGreaterThan(99);
    expect(backward.convertedValue).toBeLessThan(101);
  });

  test('4. UI Filter Check: Unchecking "Show most popular currencies only" expands dropdown from 17 to 150+ currencies', async ({
    page,
  }) => {
    const currencyPage = new CurrencyPage(page);
    await currencyPage.gotoCurrencyCalculator();

    // By default, checkbox is checked (~17 popular currencies)
    const popularCount = await currencyPage.getFromDropdownOptionCount();
    expect(popularCount).toBeLessThan(25);

    // Click the visible label to uncheck the filter and verify 150+ world currencies load into the dropdown
    await currencyPage.togglePopularCurrenciesOnly();
    const allCurrenciesCount = await currencyPage.getFromDropdownOptionCount();
    expect(allCurrenciesCount).toBeGreaterThan(100);
  });

  test("5. Form Reset & Market Table Check: Clear button empties input and Market Exchange Rates Table renders", async ({
    page,
  }) => {
    const currencyPage = new CurrencyPage(page);
    await currencyPage.gotoCurrencyCalculator();

    await currencyPage.enterAmount(999);
    await currencyPage.clickClear();
    await expect(currencyPage.amountInput).toHaveValue("");
    await expect(currencyPage.marketRatesHeading).toBeVisible();
  });

  test("6. Customized Currency Exchange Rate Calculator: Fixed rate 85 x amount 10 equals 850", async ({
    page,
  }) => {
    const currencyPage = new CurrencyPage(page);
    await currencyPage.gotoCurrencyCalculator();

    const customResultText = await currencyPage.calculateCustomRate(85, 10);
    expect(customResultText).toContain("850");
  });
});
