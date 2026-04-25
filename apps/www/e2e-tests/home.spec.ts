import { expect, test } from "@playwright/test";

const navigationLinks = [
  { name: "Desafio", hash: "#problem" },
  { name: "Recursos", hash: "#features" },
  { name: "Tecnologia", hash: "#open-source" },
];

test.describe("Home Page", () => {
  test("loads and renders key sections", async ({ page }) => {
    await page.goto("/");

    await test.step("renders header and hero", async () => {
      await expect(page.locator("header")).toBeVisible();
      await expect(
        page.getByRole("heading", {
          name: /Cr.*dito mais justo para quem trabalha/,
        }),
      ).toBeVisible();
    });

    await test.step("renders all content sections and footer", async () => {
      await expect(page.locator("#problem")).toBeVisible();
      await expect(page.locator("#features")).toBeVisible();
      await expect(page.locator("#open-source")).toBeVisible();
      await expect(page.locator("footer")).toBeVisible();
    });
  });

  test("toggles theme", async ({ page }) => {
    await page.goto("/");

    const themeToggleButton = page.getByTestId("theme-toggle");

    await test.step("opens the theme menu", async () => {
      await expect(themeToggleButton).toBeVisible();
      await themeToggleButton.click();
      await expect(page.getByTestId("theme-light")).toBeVisible();
      await expect(page.getByTestId("theme-dark")).toBeVisible();
    });

    await test.step("switches to dark theme", async () => {
      await page.getByTestId("theme-dark").click();
      await expect(page.locator("html")).toHaveClass(/dark/);
    });

    await page.waitForTimeout(300); // wait for the transition to complete

    await test.step("opens the theme menu", async () => {
      await expect(themeToggleButton).toBeVisible();
      await themeToggleButton.click();
      await expect(page.getByTestId("theme-dark")).toBeVisible();
      await expect(page.getByTestId("theme-light")).toBeVisible();
    });

    await test.step("switches back to light theme", async () => {
      await page.getByTestId("theme-light").click();
      await expect(page.locator("html")).not.toHaveClass(/dark/);
    });
  });

  test.describe("Internal navigation", () => {
    test.beforeAll(() => {
      const isMobile = test.info().project.use.isMobile;

      if (isMobile) {
        test.skip(true, "Internal header navigation is hidden on mobile");
      }
    });

    for (const link of navigationLinks) {
      test(`navigates to ${link.name} section`, async ({ page }) => {
        await page.goto("/");
        page.getByRole("link", { name: link.name }).click();
        await expect(page).toHaveURL(new RegExp(`${link.hash}$`));
        await expect(page.locator(link.hash)).toBeInViewport();
      });
    }
  });

  test("does not render the footer link section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Links" })).toHaveCount(0);
  });
});
