const { test, expect } = require("playwright/test");

const FILE_URL = "file:///C:/TOPGUN_Start/index.html";
const MODULE02_MATERIALS = ["preparation", "meeting", "consultation", "request", "client-card", "haircut", "scalp-care", "beard", "wax", "camouflage", "recommendations", "finish", "cleanup"];

async function prepareModule02(page, completed = []) {
  await page.goto(FILE_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.evaluate((module02Completed) => {
    const api = window.TOPGUN_PROGRESS_API;
    const module01 = api.getModule("01");
    module01.sections.forEach((section) => api.completeMaterial("01", section.id));
    api.questionsFor(module01).forEach((question) => api.setAnswer("01", question.id, question.correctIndex));
    api.evaluate(module01);
    api.setReview("01", "accepted", "Module 01 accepted for Module 02 regression");
    module02Completed.forEach((sectionId) => api.completeMaterial("02", sectionId));
  }, completed);
  await page.getByRole("button", { name: /Начать маршрут|Продолжить маршрут/ }).click();
  await page.locator(".route-item").filter({ hasText: "Встреча, консультация и базовые услуги" }).click();
  await expect(page.locator(".hud-module")).toContainText("02");
  await expect(page.locator(".legacy-module")).toHaveCount(0);
}

async function nextScene(page, count = 1) {
  for (let index = 0; index < count; index += 1) await page.getByRole("button", { name: "Далее", exact: true }).click();
}

async function storedProgress(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("topgun-start-progress")));
}

test("combined arrival substeps persist independently through BACK/NEXT and F5", async ({ page }) => {
  await prepareModule02(page);
  await nextScene(page);
  await expect(page.getByRole("heading", { name: "До прихода и встреча" })).toBeVisible();
  await expect(page.locator(".substep-button")).toHaveCount(2);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe("hidden");
  expect(await page.locator(".scene--grouped-learn .grouped-scene-body").evaluate((node) => getComputedStyle(node).overflowY)).toBe("auto");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("button", { name: "Продолжить к следующему этапу" }).click();
  let progress = await storedProgress(page);
  expect(progress.modules["02"].materialsCompleted.preparation).toBe(true);
  expect(progress.modules["02"].materialsCompleted.meeting).toBe(false);

  await page.reload();
  await page.getByRole("button", { name: /Начать маршрут|Продолжить маршрут/ }).click();
  await page.locator(".route-item").filter({ hasText: "Встреча, консультация и базовые услуги" }).click();
  await nextScene(page);
  await expect(page.locator(".substep-button").first()).toContainText("✓");
  await expect(page.locator(".substep-button").nth(1)).not.toContainText("✓");
  await page.getByRole("button", { name: "Продолжить к следующему этапу" }).click();
  progress = await storedProgress(page);
  expect(progress.modules["02"].materialsCompleted.meeting).toBe(true);
  await expect(page.getByRole("button", { name: "Далее", exact: true })).toBeEnabled();
  await nextScene(page);
  await page.getByRole("button", { name: "Назад", exact: true }).click();
  await expect(page.getByRole("button", { name: "Далее", exact: true })).toBeEnabled();
});

test("consultation, wax and recommendations require correct workplace decisions", async ({ page }) => {
  await prepareModule02(page, ["preparation", "meeting"]);
  await nextScene(page, 2);
  await page.getByRole("button", { name: "Продолжить к следующему этапу" }).click();
  await expect(page.locator(".canonical-copy")).toHaveCount(0);
  await page.getByRole("button", { name: /Сразу начать привычную стрижку/ }).click();
  await page.getByRole("button", { name: "Проверить решение" }).click();
  await expect(page.locator(".interaction-feedback-error")).toContainText("не заменяет конкретизацию");
  await expect(page.getByRole("button", { name: "Далее", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: /Поблагодарить за доверие/ }).click();
  await page.getByRole("button", { name: "Проверить решение" }).click();
  await expect(page.getByRole("button", { name: "Далее", exact: true })).toBeEnabled();
  let progress = await storedProgress(page);
  expect(progress.modules["02"].materialsCompleted.request).toBe(true);
  expect(progress.modules["02"].materialsCompleted.consultation).toBe(true);

  await prepareModule02(page, ["preparation", "meeting", "request", "consultation", "client-card"]);
  await nextScene(page, 4);
  await expect(page.getByRole("heading", { name: "Базовые услуги" })).toBeVisible();
  await page.getByRole("button", { name: "Продолжить к следующему этапу" }).click();
  await page.getByRole("button", { name: "Продолжить к следующему этапу" }).click();
  await page.getByRole("button", { name: "Продолжить к следующему этапу" }).click();
  progress = await storedProgress(page);
  expect(progress.modules["02"].materialsCompleted.haircut).toBe(true);
  expect(progress.modules["02"].materialsCompleted["scalp-care"]).toBe(true);
  expect(progress.modules["02"].materialsCompleted.beard).toBe(true);
  await nextScene(page);
  await expect(page.locator(".canonical-copy")).toHaveCount(0);
  await page.getByRole("button", { name: /Согласиться на нос и шею/ }).click();
  await page.getByRole("button", { name: "Проверить решение" }).click();
  await expect(page.locator(".interaction-feedback-error")).toContainText("нос, уши и брови");
  await page.getByRole("button", { name: /работать только с носом, ушами или бровями/ }).click();
  await page.getByRole("button", { name: "Проверить решение" }).click();
  await expect(page.getByRole("button", { name: "Далее", exact: true })).toBeEnabled();

  await nextScene(page);
  await nextScene(page);
  await expect(page.locator(".canonical-copy")).toHaveCount(0);
  await page.getByRole("button", { name: /Коротко перечислить одинаковый набор/ }).click();
  await page.getByRole("button", { name: "Проверить решение" }).click();
  await expect(page.locator(".interaction-feedback-error")).toContainText("право отказаться");
  await page.getByRole("button", { name: /Связать предложение с конкретной потребностью/ }).click();
  await page.getByRole("button", { name: "Проверить решение" }).click();
  progress = await storedProgress(page);
  expect(progress.modules["02"].materialsCompleted.wax).toBe(true);
  expect(progress.modules["02"].materialsCompleted.camouflage).toBe(true);
  expect(progress.modules["02"].materialsCompleted.recommendations).toBe(true);
  await nextScene(page);
  await expect(page.getByRole("heading", { name: "Завершение визита" })).toBeVisible();
  await page.getByRole("button", { name: "Продолжить к следующему этапу" }).click();
  await page.getByRole("button", { name: "Продолжить к следующему этапу" }).click();
  progress = await storedProgress(page);
  expect(progress.modules["02"].materialsCompleted.finish).toBe(true);
  expect(progress.modules["02"].materialsCompleted.cleanup).toBe(true);
});

test("theory, Practice Hub and mentor logic complete Module 02 and unlock Module 03", async ({ page }) => {
  await prepareModule02(page, MODULE02_MATERIALS);
  await nextScene(page, 9);
  await expect(page.locator(".scene--quiz .quiz-progress")).toBeVisible();
  await expect(page.locator(".scene--quiz .quiz-decision-list")).toBeVisible();
  const questions = await page.evaluate(() => window.TOPGUN_QUESTIONS["02"].map((question) => ({ correctIndex: question.correctIndex, optionCount: question.options.length })));

  for (let index = 0; index < questions.length; index += 1) {
    await page.locator(".quiz-options .choice-row").nth((questions[index].correctIndex + 1) % questions[index].optionCount).click();
    if (index < questions.length - 1) await page.getByRole("button", { name: "Следующий вопрос" }).click();
  }
  await page.getByRole("button", { name: "Проверить ответы" }).click();
  await expect(page.locator(".result-scene.result-scene--fail")).toBeVisible();
  await expect(page.getByRole("button", { name: "Повторить тест" })).toBeVisible();
  await page.getByRole("button", { name: "Повторить тест" }).click();
  for (let index = 0; index < questions.length; index += 1) {
    await page.locator(".quiz-options .choice-row").nth(questions[index].correctIndex).click();
    if (index < questions.length - 1) await page.getByRole("button", { name: "Следующий вопрос" }).click();
  }
  await page.getByRole("button", { name: "Проверить ответы" }).click();
  await expect(page.locator(".result-scene.result-scene--pass")).toBeVisible();
  let progress = await storedProgress(page);
  expect(progress.modules["02"].theory.lastScore).toBe(10);
  expect(progress.modules["02"].theory.bestScore).toBe(10);

  await nextScene(page);
  await expect(page.getByRole("heading", { name: "КАРТА ПЯТИ НАВЫКОВ" })).toBeVisible();
  await expect(page.locator(".qualification-board .qualification-skill")).toHaveCount(5);
  await expect(page.locator(".practice-mentor-controls")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe("hidden");
  expect(await page.locator(".qualification-board").evaluate((node) => node.scrollHeight >= node.clientHeight)).toBe(true);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator(".practice-detail select").selectOption("accepted");
  await page.locator(".practice-detail textarea").fill("Первое наблюдение зафиксировано наставником");
  await page.getByRole("button", { name: "Сохранить проверку навыка" }).click();
  expect((await storedProgress(page)).skills.haircut_male.mentorReview.status).toBe("accepted");
  expect((await storedProgress(page)).skills.haircut_male.mentorReview.comment).toBe("Первое наблюдение зафиксировано наставником");
  await expect(page.getByRole("button", { name: /Наставник: подтвердить «Выполнил с наставником»/ })).toHaveCount(0);
  await page.getByRole("button", { name: /Наставник: подтвердить «Наблюдал»/ }).click();
  expect((await storedProgress(page)).skills.haircut_male.level).toBe("observed");
  await page.reload();
  expect((await storedProgress(page)).skills.haircut_male.level).toBe("observed");

  await page.getByRole("button", { name: /Начать маршрут|Продолжить маршрут/ }).click();
  await page.locator(".route-item").filter({ hasText: "Встреча, консультация и базовые услуги" }).click();
  await nextScene(page, 9);
  for (let index = 0; index < questions.length - 1; index += 1) await page.getByRole("button", { name: "Следующий вопрос" }).click();
  await page.getByRole("button", { name: "Проверить ответы" }).click();
  await nextScene(page);
  await expect(page.locator(".practice-detail")).toContainText("Наблюдал");
  await page.getByRole("button", { name: /Наставник: подтвердить «Выполнил с наставником»/ }).click();

  for (const title of ["Премиум-уход за кожей головы", "Моделирование бороды", "Коррекция воском", "Камуфляж седины"]) {
    await page.getByRole("button", { name: new RegExp(title) }).click();
    await page.getByRole("button", { name: /Наставник: подтвердить «Наблюдал»/ }).click();
    await page.getByRole("button", { name: /Наставник: подтвердить «Выполнил с наставником»/ }).click();
  }
  progress = await storedProgress(page);
  for (const skillId of ["haircut_male", "scalp_premium", "beard_modeling", "wax_correction", "gray_camouflage"]) expect(progress.skills[skillId].level).toBe("with_mentor");

  await nextScene(page);
  await expect(page.locator(".mentor-trainee-brief")).toBeVisible();
  await expect(page.locator(".mentor-authority-panel.mentor-status-pending")).toBeVisible();
  expect(await page.evaluate(() => window.TOPGUN_PROGRESS_API.moduleUnlocked(window.TOPGUN_PROGRESS_API.getModule("03")))).toBe(false);
  await page.locator(".mentor-panel select").first().selectOption("repeat");
  await page.getByRole("button", { name: "Сохранить решение" }).click();
  await expect(page.locator(".mentor-authority-panel.mentor-status-repeat")).toBeVisible();
  expect(await page.evaluate(() => window.TOPGUN_PROGRESS_API.moduleUnlocked(window.TOPGUN_PROGRESS_API.getModule("03")))).toBe(false);
  await page.locator(".mentor-panel select").first().selectOption("accepted");
  await page.getByRole("button", { name: "Сохранить решение" }).click();
  await expect(page.locator(".mentor-authority-panel.mentor-status-accepted")).toBeVisible();
  expect(await page.evaluate(() => window.TOPGUN_PROGRESS_API.moduleComplete(window.TOPGUN_PROGRESS_API.getModule("02")))).toBe(true);
  expect(await page.evaluate(() => window.TOPGUN_PROGRESS_API.moduleUnlocked(window.TOPGUN_PROGRESS_API.getModule("03")))).toBe(true);
});

test("C1 grouped scene rail restores material completion without changing navigation", async ({ page }) => {
  await prepareModule02(page);
  await nextScene(page);
  await expect(page.locator(".scene--grouped-learn .grouped-substep-rail")).toBeVisible();
  await expect(page.locator(".scene--grouped-learn .canonical-copy--prose")).toBeVisible();
  await page.getByRole("button", { name: "Продолжить к следующему этапу" }).click();
  await page.reload();
  await page.getByRole("button", { name: /Начать маршрут|Продолжить маршрут/ }).click();
  await page.locator(".route-item").filter({ hasText: "Встреча, консультация и базовые услуги" }).click();
  await nextScene(page);
  await expect(page.locator(".scene--grouped-learn .substep-button").first()).toContainText("✓");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 1)).toBe(true);
});
test("accepted mentor decision remains explicit when Module 02 eligibility is incomplete", async ({ page }) => {
  await prepareModule02(page, MODULE02_MATERIALS);
  await nextScene(page, 9);
  const questions = await page.evaluate(() => window.TOPGUN_QUESTIONS["02"].map((question) => question.correctIndex));
  for (let index = 0; index < questions.length; index += 1) {
    await page.locator(".quiz-options .choice-row").nth(questions[index]).click();
    if (index < questions.length - 1) await page.getByRole("button", { name: "Следующий вопрос" }).click();
  }
  await page.getByRole("button", { name: "Проверить ответы" }).click();
  await nextScene(page, 2);
  await expect(page.locator(".mentor-authority-panel")).toBeVisible();
  await page.locator(".mentor-panel select").first().selectOption("accepted");
  await page.getByRole("button", { name: "Сохранить решение" }).click();
  await expect(page.locator(".mentor-eligibility-incomplete")).toContainText("Решение наставника сохранено, но занятие ещё не завершено");
  expect(await page.evaluate(() => window.TOPGUN_PROGRESS_API.moduleComplete(window.TOPGUN_PROGRESS_API.getModule("02")))).toBe(false);
  expect(await page.evaluate(() => window.TOPGUN_PROGRESS_API.moduleUnlocked(window.TOPGUN_PROGRESS_API.getModule("03")))).toBe(false);
  await page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /Открыть занятие 03 раньше/ }).click();
  expect(await page.evaluate(() => window.TOPGUN_PROGRESS_API.moduleUnlocked(window.TOPGUN_PROGRESS_API.getModule("03")))).toBe(true);
  expect(await page.evaluate(() => window.TOPGUN_PROGRESS_API.moduleComplete(window.TOPGUN_PROGRESS_API.getModule("02")))).toBe(false);
});
