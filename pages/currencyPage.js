export class CurrencyPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    // 1. Store the Playwright page instance
    this.page = page;

    // 2. Primary "With Live Exchange Rate" Calculator Locators
    this.amountInput = page.locator("#eamount");
    this.fromCurrencyDropdown = page.locator("#efrom");
    this.toCurrencyDropdown = page.locator("#eto");
    // Calculator.net hides the raw <input id="ccmajorccsettingbox"> via CSS and renders a visible label
    this.popularCurrenciesToggle = page.getByText(
      "Show most popular currencies only",
    );
    this.calculateButton = page.locator('input[value="Calculate"]').first();
    this.clearButton = page.locator('input[value="Clear"]').first();
    this.resultContainer = page.locator("p.verybigtext").first();

    // 3. Secondary "Customized Currency Exchange Rate" Form & Market Table Locators
    this.customRateInput = page.locator('input[type="text"]').nth(1);
    this.customAmountInput = page.locator('input[type="text"]').nth(2);
    this.customCalculateButton = page
      .locator('input[value="Calculate"]')
      .nth(1);
    this.marketRatesHeading = page.getByRole("heading", {
      name: "Market Exchange Rates Table",
    });
  }

  // Navigate to the Live Currency Calculator page (use 'domcontentloaded' so slow 3rd-party ads don't block the test)
  async gotoCurrencyCalculator() {
    await this.page.goto(
      "https://www.calculator.net/currency-calculator.html",
      {
        waitUntil: "domcontentloaded",
      },
    );
  }

  // Clear and type the amount to convert
  async enterAmount(amount) {
    await this.amountInput.fill(String(amount));
  }

  // Select the 'From' and 'To' currencies using 3-letter ISO codes (e.g., 'USD', 'INR', 'EUR')
  async selectCurrencies(fromCode, toCode) {
    await this.fromCurrencyDropdown.selectOption(fromCode);
    await this.toCurrencyDropdown.selectOption(toCode);
  }

  // Click the Calculate button to trigger the conversion
  async clickCalculate() {
    await this.calculateButton.click({ noWaitAfter: true });
  }

  // Click the Clear button to reset the form fields
  async clickClear() {
    await this.clearButton.click();
  }

  // Count how many <option> items are currently inside the 'From' currency dropdown
  async getFromDropdownOptionCount() {
    return await this.fromCurrencyDropdown.locator("option").count();
  }

  // Click the visible "Show most popular currencies only" label to toggle the currency list
  async togglePopularCurrenciesOnly() {
    await this.popularCurrenciesToggle.click();
  }

  // Automate the 2nd form ("Customized Currency Exchange Rate")
  async calculateCustomRate(rate, amount) {
    await this.customRateInput.fill(String(rate));
    await this.customAmountInput.fill(String(amount));
    await this.customCalculateButton.click({ noWaitAfter: true });
    await this.resultContainer.waitFor({ state: "visible" });
    return (await this.resultContainer.innerText()).split("\n")[0].trim();
  }

  // Fetch the independent live exchange rate from ExchangeRate-API using Playwright's API request context
  async fetchOfficialMarketRate(request, fromCode, toCode) {
    const response = await request.get(
      `https://open.er-api.com/v6/latest/${fromCode}`,
    );
    const data = await response.json();
    return data.rates[toCode];
  }

  // Complete helper: performs UI conversion, extracts UI value, and measures response time
  async convertCurrency(amount, fromCode, toCode) {
    const startTime = Date.now();
    await this.enterAmount(amount);
    await this.selectCurrencies(fromCode, toCode);
    await this.clickCalculate();
    await this.resultContainer.waitFor({ state: "visible" });

    // Grab the full text inside the result container
    const fullText = await this.resultContainer.innerText();
    const lines = fullText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const rawText = lines[0]; // e.g., "100 USD = 9,488.9257 INR"
    const durationMs = Date.now() - startTime;

    // Extract the converted numeric value from the first line ("= 9,488.9257")
    const match = rawText.match(/=\s*([\d,.]+)/);
    const convertedValue = match
      ? parseFloat(match[1].replace(/,/g, ""))
      : null;

    // Extract the 1-unit rate from the result box if present (e.g., "1 USD = 94.889257 INR")
    const unitRateLine = lines.find((l) => l.startsWith(`1 ${fromCode} =`));
    const unitMatch = unitRateLine ? unitRateLine.match(/=\s*([\d,.]+)/) : null;
    const uiUnitRate = unitMatch
      ? parseFloat(unitMatch[1].replace(/,/g, ""))
      : null;

    return {
      amount,
      fromCode,
      toCode,
      rawText,
      convertedValue,
      uiUnitRate,
      durationMs,
      timestamp: new Date().toLocaleTimeString(),
    };
  }
}
