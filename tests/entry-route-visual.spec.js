const { test, expect } = require("playwright/test");

const FILE_URL = "file:///C:/TOPGUN_Start/index.html";

async function fresh(page) {
  await page.goto(FILE_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

async function openRoute(page) {
  await page.getByRole("button", { name: /Начать маршрут|Продолжить маршрут/ }).click();
  await expect(page.locator(".route-list")).toBeVisible();
}

async function completeModule(page, moduleId) {
  await page.evaluate((id) => {
    const api = window.TOPGUN_PROGRESS_API;
    const module = api.getModule(id);
    module.sections.forEach((section) => api.completeMaterial(id, section.id));
    api.questionsFor(module).forEach((question) => api.setAnswer(id, question.id, question.correctIndex));
    api.evaluate(module);
    api.setReview(id, "accepted", "Route visual fixture");
  }, moduleId);
}

test("Boot renders the real logo, keeps trainee identity and opens the route by keyboard", async ({ page }) => {
  await fresh(page);
  const logo = page.locator(".boot-logo");
  await expect(logo).toHaveAttribute("src", /assets\/topgun-logo\.png$/);
  await expect(logo).toHaveAttribute("alt", "TOPGUN");
  await expect(page.getByRole("heading", { name: "START" })).toBeVisible();
  await page.once("dialog", (dialog) => dialog.accept("Мария"));
  await page.getByRole("button", { name: "Стажёр" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Мария" })).toBeVisible();
  await page.getByRole("button", { name: /Начать маршрут|Продолжить маршрут/ }).press("Enter");
  await expect(page.locator(".route-item")).toHaveCount(6);
  await page.locator(".route-item").first().focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".hud-module")).toContainText("01");
});

test("Route trajectory preserves status semantics and confines 390 px overflow", async ({ page }) => {
  await fresh(page);
  await completeModule(page, "01");
  await completeModule(page, "02");
  await page.evaluate(() => {
    const api = window.TOPGUN_PROGRESS_API;
    ["haircut_male", "scalp_premium", "beard_modeling", "wax_correction", "gray_camouflage"].forEach((skillId) => {
      api.advanceSkill(skillId);
      api.advanceSkill(skillId);
    });
    api.setReview("02", "accepted", "Route visual fixture");
    api.manualUnlock("04", "Route visual fixture");
    api.setCurrentModule("03");
  });
  await openRoute(page);
  await expect(page.locator(".route-done")).toHaveCount(2);
  await expect(page.locator(".route-current")).toHaveCount(1);
  await expect(page.locator(".route-mentor")).toHaveCount(1);
  await expect(page.locator(".route-locked")).toHaveCount(2);
  await expect(page.locator(".route-list")).toHaveAttribute("aria-label", "Маршрут стажировки");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.documentElement.scrollHeight <= window.innerHeight + 1)).toBe(true);
  expect(await page.locator(".route-list").evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
  await page.reload();
  await openRoute(page);
  await expect(page.locator(".route-current")).toHaveCount(1);
  await page.evaluate(() => window.TOPGUN_PROGRESS_API.setCurrentModule("02"));
  await page.reload();
  await openRoute(page);
  await expect(page.locator(".route-unfinished")).toHaveCount(1);
});

test("Phase D suppresses decorative motion under reduced-motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await fresh(page);
  await expect(page.locator(".boot-identity")).toBeVisible();
  expect(await page.locator(".boot-identity").evaluate((node) => getComputedStyle(node).animationName)).toBe("none");
  await openRoute(page);
  await expect(page.locator(".route-map")).toBeVisible();
  expect(await page.locator(".route-map").evaluate((node) => getComputedStyle(node, "::after").animationName)).toBe("none");
});
