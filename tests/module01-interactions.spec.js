const { test, expect } = require("playwright/test");

const FILE_URL = "file:///C:/TOPGUN_Start/index.html";
const MATERIALS = ["role", "rules", "appearance", "workplace", "disinfection", "cosmetics", "further-materials"];

async function prepareModule(page, completed = []) {
  await page.goto(FILE_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.evaluate((ids) => ids.forEach((id) => window.TOPGUN_PROGRESS_API.completeMaterial("01", id)), completed);
  await page.getByRole("button", { name: /Начать маршрут|Продолжить маршрут/ }).click();
  await page.locator(".route-item").filter({ hasText: "Вводное занятие" }).click();
  await expect(page.locator(".hud-progress")).toHaveText("01 / 11");
}

async function nextScene(page, count = 1) {
  for (let index = 0; index < count; index += 1) {
    await page.getByRole("button", { name: "Далее", exact: true }).click();
  }
}

async function storedProgress(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("topgun-start-progress")));
}

test("shift-ready: edit, failed validation, keyboard correction, completion and persistence", async ({ page }) => {
  await prepareModule(page);
  await nextScene(page, 2);

  const next = page.getByRole("button", { name: "Далее", exact: true });
  const choices = page.locator('.interaction-panel input[type="checkbox"]');
  await expect(next).toBeDisabled();
  await expect(page.getByText("Выбрить пробор клиенту по запросу", { exact: true })).toBeVisible();
  await expect(page.locator(".interaction-panel")).not.toContainText("Не выбривать пробор");

  await choices.nth(0).focus();
  await page.keyboard.press("Space");
  await choices.nth(4).focus();
  await page.keyboard.press("Space");
  await page.getByRole("button", { name: "Проверить выбранные варианты" }).press("Enter");
  await expect(page.locator(".interaction-feedback-error")).toContainText("Ответ пока не принят");
  await expect(page.locator(".interaction-feedback-error")).toContainText("Не выбривать пробор");
  await expect(page.locator(".choice-row-incorrect")).toContainText("Выбрить пробор клиенту по запросу");
  await expect(choices.nth(0)).toBeChecked();
  await expect(choices.nth(4)).toBeChecked();
  await expect(next).toBeDisabled();

  await choices.nth(4).focus();
  await page.keyboard.press("Space");
  for (const index of [1, 2, 3, 5]) await choices.nth(index).check({ force: true });
  await page.getByRole("button", { name: "Проверить выбранные варианты" }).click();
  await expect(page.locator(".interaction-feedback-success")).toContainText("Верно");
  await expect(next).toBeEnabled();
  expect((await storedProgress(page)).modules["01"].materialsCompleted.rules).toBe(true);

  await page.reload();
  expect((await storedProgress(page)).modules["01"].materialsCompleted.rules).toBe(true);
});

test("appearance decision preserves workplace context; workplace remains a concise learn scene", async ({ page }) => {
  await prepareModule(page, ["rules"]);
  await nextScene(page, 3);

  const appearanceNext = page.getByRole("button", { name: "Далее", exact: true });
  await page.getByRole("button", { name: /Сразу начну привычную стрижку/ }).click();
  await expect(page.getByRole("button", { name: /Сразу начну привычную стрижку/ })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Проверить решение" }).click();
  await expect(page.locator(".interaction-feedback-error")).toContainText("не соответствует материалу");
  await expect(appearanceNext).toBeDisabled();

  await page.getByRole("button", { name: /Сохраню такое же профессиональное внимание/ }).click();
  await expect(page.getByRole("button", { name: /Сохраню такое же профессиональное внимание/ })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Проверить решение" }).click();
  await expect(appearanceNext).toBeEnabled();
  expect((await storedProgress(page)).modules["01"].materialsCompleted.appearance).toBe(true);

  await appearanceNext.click();
  await expect(page.getByRole("heading", { name: "Рабочее место" })).toBeVisible();
  await expect(page.locator(".hotspot-button")).toHaveCount(0);
  await expect(page.locator(".canonical-copy")).toContainText("Поддерживать косметику чистой и презентабельной.");
  await expect(page.getByRole("button", { name: "Далее", exact: true })).toBeEnabled();
  expect((await storedProgress(page)).modules["01"].materialsCompleted.workplace).toBe(false);

  await nextScene(page);
  expect((await storedProgress(page)).modules["01"].materialsCompleted.workplace).toBe(true);
  await page.getByRole("button", { name: "Назад", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Рабочее место" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Далее", exact: true })).toBeEnabled();
});

test("disinfection, cosmetics and resources: failed input is retained, success gates NEXT", async ({ page }) => {
  await prepareModule(page, ["rules", "appearance", "workplace"]);
  await nextScene(page, 5);

  const selects = page.locator(".sorter-row select");
  await expect(page.locator(".canonical-copy")).toHaveCount(0);
  await expect(selects.nth(0)).toContainText("Аламинол");
  await expect(selects.nth(0)).not.toContainText("концентрация 5%, время 15 минут");
  await selects.nth(0).selectOption("spray");
  await selects.nth(0).selectOption("nonmetal");
  await selects.nth(0).selectOption("spray");
  await selects.nth(1).selectOption("nonmetal");
  await selects.nth(1).selectOption("spray");
  await selects.nth(1).selectOption("nonmetal");
  await selects.nth(2).selectOption("nonmetal");
  await page.getByRole("button", { name: "Проверить соответствие" }).click();
  await expect(page.locator(".interaction-feedback-error")).toContainText("Соответствие пока неверное");
  await expect(selects.nth(0)).toHaveValue("spray");
  await expect(selects.nth(1)).toHaveValue("nonmetal");
  await expect(selects.nth(2)).toHaveValue("nonmetal");
  await expect(page.getByRole("button", { name: "Далее", exact: true })).toBeDisabled();
  await expect(page.locator(".canonical-copy")).toContainText("концентрация 5%, время 15 минут");

  await selects.nth(0).selectOption("nonmetal");
  await selects.nth(1).selectOption("spray");
  await selects.nth(2).selectOption("spray");
  await page.getByRole("button", { name: "Проверить соответствие" }).click();
  await expect(page.locator(".interaction-feedback-success")).toContainText("Все предметы сопоставлены");
  await expect(page.getByRole("button", { name: "Далее", exact: true })).toBeEnabled();
  expect((await storedProgress(page)).modules["01"].materialsCompleted.disinfection).toBe(true);

  await nextScene(page);
  await expect(page.locator(".canonical-copy")).toHaveCount(0);
  await page.getByRole("button", { name: /По описанию гостя определить проблему кожи головы/ }).click();
  await page.getByRole("button", { name: "Проверить решение" }).click();
  await expect(page.locator(".interaction-feedback-error")).toContainText("не ставит медицинский диагноз");
  await expect(page.getByRole("button", { name: /По описанию гостя определить проблему кожи головы/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Далее", exact: true })).toBeDisabled();

  await page.getByRole("button", { name: /Рассказать о назначении средства только по предоставленному материалу/ }).click();
  await page.getByRole("button", { name: "Проверить решение" }).click();
  await expect(page.locator(".interaction-feedback-success")).toContainText("медицинское назначение");
  expect((await storedProgress(page)).modules["01"].materialsCompleted.cosmetics).toBe(true);

  await nextScene(page);
  expect((await storedProgress(page)).modules["01"].materialsCompleted["further-materials"]).toBe(false);
  await nextScene(page);
  expect((await storedProgress(page)).modules["01"].materialsCompleted["further-materials"]).toBe(true);
  await page.reload();
  expect((await storedProgress(page)).modules["01"].materialsCompleted["further-materials"]).toBe(true);
});

test("exam and mentor-review: navigation, retry, score semantics and strict Module 02 unlock", async ({ page }) => {
  await prepareModule(page, MATERIALS);
  await nextScene(page, 8);
  const questions = await page.evaluate(() => window.TOPGUN_QUESTIONS["01"].map((question) => ({ correctIndex: question.correctIndex, optionCount: question.options.length, topic: question.topic })));

  for (let index = 0; index < questions.length; index += 1) {
    const wrong = (questions[index].correctIndex + 1) % questions[index].optionCount;
    await page.locator(".quiz-options .choice-row").nth(wrong).click();
    if (index === 1) {
      await page.locator(".quiz-options .choice-row").nth(questions[index].correctIndex).click();
      await page.locator(".quiz-options .choice-row").nth(wrong).click();
      await page.getByRole("button", { name: "Предыдущий вопрос" }).click();
      await expect(page.locator('.quiz-options input:checked')).toHaveCount(1);
      await page.getByRole("button", { name: "Следующий вопрос" }).click();
    }
    if (index < questions.length - 1) await page.getByRole("button", { name: "Следующий вопрос" }).click();
  }
  await page.getByRole("button", { name: "Проверить ответы" }).click();
  let progress = await storedProgress(page);
  expect(progress.modules["01"].theory.attempts).toBe(1);
  expect(progress.modules["01"].theory.lastScore).toBe(0);
  await page.getByRole("button", { name: "Повторить тест" }).click();

  for (let index = 0; index < questions.length; index += 1) {
    await page.locator(".quiz-options .choice-row").nth(questions[index].correctIndex).click();
    if (index < questions.length - 1) await page.getByRole("button", { name: "Следующий вопрос" }).click();
  }
  await page.getByRole("button", { name: "Проверить ответы" }).click();
  progress = await storedProgress(page);
  expect(progress.modules["01"].theory.lastScore).toBe(8);
  expect(progress.modules["01"].theory.bestScore).toBe(8);

  await page.getByRole("button", { name: "Назад", exact: true }).click();
  const wrongFirst = (questions[0].correctIndex + 1) % questions[0].optionCount;
  await page.locator(".quiz-options .choice-row").nth(wrongFirst).click();
  for (let index = 0; index < questions.length - 1; index += 1) await page.getByRole("button", { name: "Следующий вопрос" }).click();
  await page.getByRole("button", { name: "Проверить ответы" }).click();
  progress = await storedProgress(page);
  expect(progress.modules["01"].theory.attempts).toBe(3);
  expect(progress.modules["01"].theory.lastScore).toBe(7);
  expect(progress.modules["01"].theory.bestScore).toBe(8);
  expect(progress.modules["01"].theory.incorrectTopics).toEqual([questions[0].topic]);

  await nextScene(page);
  expect(await page.evaluate(() => window.TOPGUN_PROGRESS_API.moduleUnlocked(window.TOPGUN_PROGRESS_API.getModule("02")))).toBe(false);
  await page.locator(".mentor-panel select").first().selectOption("repeat");
  await page.locator(".mentor-panel textarea").first().fill("Повторить вводный блок");
  await page.getByRole("button", { name: "Сохранить решение" }).click();
  await expect(page.locator(".mentor-panel select").first()).toHaveValue("repeat");
  expect((await storedProgress(page)).modules["01"].mentorReview.status).toBe("repeat");
  expect(await page.evaluate(() => window.TOPGUN_PROGRESS_API.moduleUnlocked(window.TOPGUN_PROGRESS_API.getModule("02")))).toBe(false);

  await page.locator(".mentor-panel select").first().selectOption("accepted");
  await page.locator(".mentor-panel textarea").first().fill("Вводное занятие принято");
  await page.getByRole("button", { name: "Назад", exact: true }).click();
  await nextScene(page);
  await expect(page.locator(".mentor-panel select").first()).toHaveValue("accepted");
  await expect(page.locator(".mentor-panel textarea").first()).toHaveValue("Вводное занятие принято");
  await page.getByRole("button", { name: "Сохранить решение" }).click();
  progress = await storedProgress(page);
  expect(progress.modules["01"].mentorReview.status).toBe("accepted");
  expect(progress.modules["01"].mentorReview.confirmedAt).toBeTruthy();
  expect(await page.evaluate(() => window.TOPGUN_PROGRESS_API.moduleUnlocked(window.TOPGUN_PROGRESS_API.getModule("02")))).toBe(true);
});

test("wheel burst advances at most one scene and required keyboard input remains guarded", async ({ page }) => {
  await prepareModule(page);
  await page.evaluate(() => {
    for (let index = 0; index < 8; index += 1) document.dispatchEvent(new WheelEvent("wheel", { deltaY: 120, bubbles: true }));
  });
  await expect(page.locator(".hud-progress")).toHaveText("02 / 11");
  await page.waitForTimeout(850);
  await page.keyboard.press("PageDown");
  await expect(page.locator(".hud-progress")).toHaveText("03 / 11");
  await page.keyboard.press("PageDown");
  await expect(page.locator(".hud-progress")).toHaveText("03 / 11");
  await expect(page.getByRole("button", { name: "Далее", exact: true })).toBeDisabled();
});

test("file contract keeps schema v2 and the exact local storage key", async ({ page }) => {
  await page.goto(FILE_URL);
  const contract = await page.evaluate(() => ({
    schema: window.TOPGUN_PROGRESS_API.SCHEMA_VERSION,
    key: window.TOPGUN_PROGRESS_API.STORAGE_KEY,
    protocol: location.protocol,
    questions: window.TOPGUN_QUESTIONS["01"].length
  }));
  expect(contract).toEqual({ schema: 2, key: "topgun-start-progress", protocol: "file:", questions: 8 });
});
