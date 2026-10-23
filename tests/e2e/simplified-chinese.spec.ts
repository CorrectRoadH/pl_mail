import { test, expect, type Page } from "./support/test";
import { settled } from "./support/motion";

async function chooseLanguage(page: Page, locale: string): Promise<void> {
    await page.goto("/settings?section=general");
    const button = page.locator(
        `form[action*='locale']:has(input[value='${locale}']) button`,
    );
    if (!(await button.isDisabled())) {
        await button.click();
    }
    await expect(page.locator("html")).toHaveAttribute("lang", locale.replace("_", "-"));
}

test.afterEach(async ({ page }) => {
    await chooseLanguage(page, "en");
    await page.locator("#settings-clock").selectOption("");
});

test("Simplified Chinese persists across reloads and reaches the mail interface", async ({ page }, testInfo) => {
    await chooseLanguage(page, "zh_CN");
    await expect(page.getByRole("button", { name: /简体中文/ })).toBeDisabled();
    await page.locator("#settings-clock").selectOption("");
    await expect(page.locator("html")).toHaveAttribute("data-clock-hour12", "false");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    await expect(page.getByRole("button", { name: /简体中文/ })).toBeDisabled();

    await page.goto("/mail/inbox");
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    await expect(page.getByRole("link", { name: /收件箱/ }).first()).toBeVisible();
    await settled(page);
    await testInfo.attach("simplified-chinese-inbox", {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
    });

    await page.getByRole("link", { name: "写邮件", exact: true }).first().click();
    const composer = page.locator("#compose_dock");
    await expect(composer).toBeVisible();
    await expect(composer.getByRole("button", { name: "发送", exact: true })).toBeVisible();
    await settled(page);
    await testInfo.attach("simplified-chinese-compose", {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
    });

    // Explicit clock choices still override the language default.
    await page.goto("/settings?section=general");
    await page.locator("#settings-clock").selectOption("12");
    await expect(page.locator("html")).toHaveAttribute("data-clock-hour12", "true");
});
