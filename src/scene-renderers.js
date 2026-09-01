(() => {
  "use strict";

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const append = (parent, ...children) => { children.flat().filter(Boolean).forEach((child) => parent.append(child)); return parent; };
  const button = (label, className, onClick) => {
    const node = el("button", className, label);
    node.type = "button";
    if (onClick) node.addEventListener("click", onClick);
    return node;
  };
  const sources = () => window.TOPGUN_SOURCES || {};
  const practice = () => window.TOPGUN_PRACTICE || {};
  const sourceLine = (ids = []) => {
    const names = ids.map((id) => sources().items?.find((item) => item.id === id)?.title).filter(Boolean);
    return names.length ? el("p", "scene-source", `Источник: ${names.join(" · ")}`) : null;
  };
  const canonicalCopy = (section) => {
    const block = el("div", "canonical-copy canonical-copy--prose");
    if (section.callout) append(block, el("aside", "scene-callout", section.callout));
    (section.paragraphs || []).forEach((paragraph) => append(block, el("p", "scene-copy canonical-paragraph", paragraph)));
    if (section.bullets?.length) {
      const list = el("ul", "scene-list canonical-list");
      section.bullets.forEach((item) => append(list, el("li", /\d/.test(item) ? "canonical-rule canonical-fact" : "canonical-rule", item)));
      append(block, list);
    }
    append(block, sourceLine(section.sourceIds));
    return block;
  };
  const sectionFor = (module, scene) => module.sections?.find((section) => section.id === scene.sectionId);
  const sectionIntro = (module, scene, section, current, total) => {
    const intro = el("header", "scene-heading");
    append(intro, el("p", "scene-kicker", `Модуль ${module.id} · ${String(current).padStart(2, "0")} / ${String(total).padStart(2, "0")}`), el("h1", "scene-title", scene.title || section?.title || module.title));
    return intro;
  };
  const interactionStatus = (complete, label = "Выполните действие, чтобы продолжить") => el("p", complete ? "interaction-status interaction-status-done" : "interaction-status", complete ? "Действие выполнено" : label);
  const materialComplete = (context) => Boolean(context.scene.sectionId && context.progress.moduleState(context.engine.module().id)?.materialsCompleted?.[context.scene.sectionId]);
  const feedback = (kind, messages) => {
    const node = el("p", `interaction-feedback${kind === "success" ? " interaction-feedback-success" : kind === "incorrect" ? " interaction-feedback-error" : ""}`, messages[kind] || messages.idle || "");
    node.setAttribute("aria-live", "polite");
    return node;
  };
  const reviewLabel = (status) => ({ pending: "ожидает проверки", accepted: "принято", repeat: "нужно повторить" }[status] || "ожидает проверки");

  const renderManifesto = () => {
    const body = el("section", "scene-body scene-manifesto");
    const lockup = el("div", "manifesto-lockup"); append(lockup, el("p", "scene-kicker", "TOPGUN · START"), el("h1", "manifesto-title", "ДИСЦИПЛИНА ВАЖНЕЕ ТАЛАНТА"), el("p", "manifesto-copy", "Вводное занятие — это внимание к клиенту, рабочему месту и собственной ответственности.")); append(body, lockup);
    return body;
  };

  const renderRules = (context, section) => {
    const body = el("section", "scene-body decision-scene rules-scene");
    const form = el("fieldset", "interaction-panel interaction-panel-multiselect decision-panel decision-panel--rules");
    form.disabled = context.readonly;
    append(form, el("legend", "", "До начала смены осталось несколько минут. Что соответствует вводному занятию?"));
    append(form, el("p", "interaction-help", "Выберите все подходящие варианты, затем нажмите «Проверить выбранные варианты». Пока ответ не подтверждён, переход дальше закрыт."));
    const state = context.engine.getSceneState(context.scene.id);
    const chosen = new Set(state.selectedIndexes || []);
    const storedComplete = materialComplete(context);
    const options = context.scene.interactionOptions || (section.bullets || []).map((_, index) => ({ sectionBulletIndex: index }));
    options.forEach((option, index) => {
      const item = option.label || section.bullets?.[option.sectionBulletIndex] || "Вариант недоступен";
      const selected = chosen.has(index);
      const expected = context.scene.correctIndexes.includes(index);
      const resultClass = state.feedback === "incorrect"
        ? selected && expected ? " choice-row-correct" : selected ? " choice-row-incorrect" : expected ? " choice-row-missed" : ""
        : "";
      const label = el("label", `choice-row${resultClass}`);
      const input = el("input", "");
      input.type = "checkbox";
      input.checked = selected;
      input.disabled = context.readonly || Boolean(storedComplete);
      input.addEventListener("change", () => {
        const next = new Set(chosen);
        input.checked ? next.add(index) : next.delete(index);
        context.engine.updateSceneState(context.scene.id, { selectedIndexes: [...next].sort((a, b) => a - b), feedback: "changed" });
        context.rerender();
      });
      append(label, input, el("span", "choice-mark"), el("span", "", item));
      append(form, label);
    });
    const check = button("Проверить выбранные варианты", "button button-secondary", () => {
      const expected = context.scene.correctIndexes;
      const missing = expected.filter((index) => !chosen.has(index));
      const extra = [...chosen].filter((index) => !expected.includes(index));
      if (!missing.length && !extra.length) {
        context.engine.updateSceneState(context.scene.id, { feedback: "success" });
        context.complete();
        context.rerender();
        return;
      }
      context.engine.updateSceneState(context.scene.id, { feedback: "incorrect" });
      context.rerender();
    });
    check.disabled = context.readonly || Boolean(storedComplete);
    const correctCount = context.scene.correctIndexes.filter((index) => chosen.has(index)).length;
    const result = storedComplete ? "success" : state.feedback;
    append(form, check, feedback(result, {
      idle: "Выбор ещё не проверен.",
      changed: "Выбор изменён. Нажмите «Проверить выбранные варианты».",
      incorrect: `Ответ пока не принят. Правильно выбрано: ${correctCount} из ${context.scene.correctIndexes.length}. Проверьте пропущенные и лишние варианты. ${section.bullets?.[4] || ""}`,
      success: "Верно. Общие правила зафиксированы; можно перейти дальше."
    }));
    append(body, form, sourceLine(section.sourceIds));
    return body;
  };

  const renderAppearance = (context, section) => {
    const body = el("section", "scene-body decision-scene");
    const panel = el("section", "interaction-panel decision-panel");
    const interaction = context.scene.interaction || { prompt: "Какой принцип нужно сохранить при работе с постоянным гостем?", options: [] };
    append(panel, el("h2", "interaction-title", "Рабочее решение"), el("p", "scene-copy", interaction.prompt));
    const state = context.engine.getSceneState(context.scene.id);
    const complete = materialComplete(context);
    const options = interaction.options || [];
    options.forEach((option) => {
      const control = button(option.label, `choice-button${state.selection === option.id ? " choice-button-selected" : ""}`, () => {
        context.engine.updateSceneState(context.scene.id, { selection: option.id, feedback: "changed" });
        context.rerender();
      });
      control.disabled = context.readonly || complete;
      control.setAttribute("aria-pressed", state.selection === option.id ? "true" : "false");
      append(panel, control);
    });
    const check = button("Проверить решение", "button button-secondary", () => {
      const accepted = options.some((option) => option.id === state.selection && option.correct);
      context.engine.updateSceneState(context.scene.id, { feedback: accepted ? "success" : "incorrect" });
      if (accepted) context.complete();
      context.rerender();
    });
    check.disabled = context.readonly || complete || !state.selection;
    append(panel, check, feedback(complete ? "success" : state.feedback, {
      idle: "Выберите решение, затем проверьте его.",
      changed: "Решение выбрано. Нажмите «Проверить решение».",
      incorrect: "Это не соответствует материалу: постоянному гостю нужно сохранять такое же профессиональное внимание.",
      success: "Верно. Принцип профессионального отношения зафиксирован."
    }));
    append(body, panel);
    if (complete || ["incorrect", "success"].includes(state.feedback)) append(body, canonicalCopy(section));
    else append(body, sourceLine(section.sourceIds));
    return body;
  };

  const renderWorkplace = (context, section) => {
    const body = el("section", "scene-body");
    append(body, el("p", "scene-copy", "Откройте все элементы готового рабочего места."));
    const grid = el("div", "hotspot-grid");
    const needed = context.scene.requiredIndexes || [];
    const state = context.engine.getSceneState(context.scene.id);
    const complete = materialComplete(context);
    const opened = new Set(complete ? needed : state.openedIndexes || []);
    needed.forEach((index) => {
      const item = button(section.bullets?.[index] || "Элемент рабочего места", "hotspot-button", () => {
        const next = new Set(opened); next.add(index);
        const finished = needed.every((required) => next.has(required));
        context.engine.updateSceneState(context.scene.id, { openedIndexes: [...next], feedback: finished ? "success" : "changed" });
        if (finished) context.complete();
        context.rerender();
      });
      if (opened.has(index)) item.classList.add("hotspot-button-open");
      item.disabled = context.readonly || complete;
      item.setAttribute("aria-pressed", opened.has(index) ? "true" : "false");
      append(grid, item);
    });
    append(body, grid, feedback(complete ? "success" : state.feedback, {
      idle: `Откройте все обязательные зоны: 0 из ${needed.length}.`,
      changed: `Открыто: ${opened.size} из ${needed.length}. Ранее открытые зоны сохранены.`,
      success: "Все обязательные зоны открыты. Рабочее место завершено."
    }), sourceLine(section.sourceIds));
    return body;
  };

  const renderDisinfection = (context, section) => {
    const body = el("section", "scene-body sorter-scene");
    const panel = el("section", "interaction-panel sorter-board");
    append(panel, el("h2", "interaction-title", "Соотнесите предмет и способ обработки"), el("p", "sorter-method-heading", "Способ обработки"));
    const rows = [["comb", "Расчёска", "nonmetal"], ["scissors", "Ножницы", "spray"], ["razor", "Бритва", "spray"]];
    const state = context.engine.getSceneState(context.scene.id);
    const complete = materialComplete(context);
    rows.forEach(([key, label]) => {
      const row = el("label", "sorter-row sorter-lane");
      const select = el("select", "field-control");
      select.disabled = context.readonly || complete;
      [["", "Выберите способ"], ["nonmetal", "Аламинол"], ["spray", "Дезинфицирующий спрей"]].forEach(([value, text]) => {
        const option = el("option", "", text); option.value = value; option.selected = state.selections?.[key] === value; append(select, option);
      });
      select.addEventListener("change", () => {
        context.engine.updateSceneState(context.scene.id, { selections: { ...(state.selections || {}), [key]: select.value }, feedback: "changed" });
        context.rerender();
      });
      append(row, el("span", "sorter-label", label), select);
      append(panel, row);
    });
    const check = button("Проверить соответствие", "button button-primary", () => {
      const accepted = rows.every(([key, , answer]) => state.selections?.[key] === answer);
      context.engine.updateSceneState(context.scene.id, { feedback: accepted ? "success" : "incorrect" });
      if (accepted) context.complete();
      context.rerender();
    });
    check.disabled = context.readonly || complete || rows.some(([key]) => !state.selections?.[key]);
    append(panel, check, feedback(complete ? "success" : state.feedback, {
      idle: "Выберите способ для каждого предмета.",
      changed: "Выбор сохранён. Заполните все строки и нажмите «Проверить соответствие».",
      incorrect: "Соответствие пока неверное. Проверьте каждую строку по материалу; выбранные значения сохранены.",
      success: "Верно. Все предметы сопоставлены со способом обработки."
    }));
    append(body, panel);
    if (complete || ["incorrect", "success"].includes(state.feedback)) append(body, canonicalCopy(section));
    else append(body, sourceLine(section.sourceIds));
    return body;
  };

  const defaultDecision = (section) => ({
    title: "Подтвердите границы рекомендации",
    prompt: "Как действовать при знакомстве клиента с продуктом?",
    options: [
      { id: "bounded", label: section.bullets?.[0] || "Объяснять назначение продукта в пределах материала", correct: true },
      { id: "medical", label: "Поставить диагноз и пообещать лечебный результат", correct: false }
    ],
    feedback: {
      incorrect: "Это выходит за границы материала: барбер не ставит медицинский диагноз и не обещает лечебный результат.",
      success: "Верно. Граница немедицинской рекомендации зафиксирована."
    }
  });
  const renderDecisionPanel = (context, config, complete, onAccepted) => {
    const state = context.engine.getSceneState(context.scene.id);
    const panel = el("section", "interaction-panel decision-panel");
    append(panel, el("h2", "interaction-title", config.title), el("p", "scene-copy", config.prompt));
    (config.options || []).forEach((option) => {
      const control = button(option.label, `choice-button${state.selection === option.id ? " choice-button-selected" : ""}`, () => {
        context.engine.updateSceneState(context.scene.id, { selection: option.id, feedback: "changed" });
        context.rerender();
      });
      control.disabled = context.readonly || complete;
      control.setAttribute("aria-pressed", state.selection === option.id ? "true" : "false");
      append(panel, control);
    });
    const check = button("Проверить решение", "button button-secondary", () => {
      const accepted = (config.options || []).some((option) => option.id === state.selection && option.correct);
      context.engine.updateSceneState(context.scene.id, { feedback: accepted ? "success" : "incorrect" });
      if (accepted) onAccepted();
      context.rerender();
    });
    check.disabled = context.readonly || complete || !state.selection;
    append(panel, check, feedback(complete ? "success" : state.feedback, {
      idle: "Выберите решение, затем проверьте его.",
      changed: "Решение выбрано. Нажмите «Проверить решение».",
      incorrect: config.feedback?.incorrect || "Решение пока не принято.",
      success: config.feedback?.success || "Верно. Решение зафиксировано."
    }));
    return panel;
  };
  const renderDecision = (context, section) => {
    const body = el("section", "scene-body");
    const complete = materialComplete(context);
    const state = context.engine.getSceneState(context.scene.id);
    append(body, renderDecisionPanel(context, context.scene.interaction || defaultDecision(section), complete, () => context.complete()));
    if (complete || ["incorrect", "success"].includes(state.feedback)) append(body, canonicalCopy(section));
    else append(body, sourceLine(section.sourceIds));
    return body;
  };

  const renderModuleIntro = (module) => {
    const body = el("section", "scene-body scene-manifesto");
    const lockup = el("div", "manifesto-lockup module-intro-lockup"); append(lockup, el("p", "scene-kicker", `TOPGUN · ${module.id}`), el("h1", "manifesto-title", module.title), el("p", "manifesto-copy", module.purpose || module.summary)); append(body, lockup);
    return body;
  };

  const renderGroupedScene = (context, module) => {
    const scene = context.scene;
    const sectionIds = scene.sectionIds || [];
    const state = context.engine.getSceneState(scene.id);
    const completed = (sectionId) => Boolean(context.progress.moduleState(module.id)?.materialsCompleted?.[sectionId]);
    const activeId = sectionIds.includes(state.activeSectionId)
      ? state.activeSectionId
      : sectionIds.find((sectionId) => !completed(sectionId)) || sectionIds[0];
    const activeIndex = sectionIds.indexOf(activeId);
    const section = module.sections?.find((item) => item.id === activeId);
    const body = el("section", "scene-body grouped-scene-body grouped-scene-body--editorial");
    const stepper = el("nav", "substep-nav grouped-substep-rail"); stepper.setAttribute("aria-label", "Шаги сцены");
    sectionIds.forEach((sectionId, index) => {
      const item = module.sections?.find((candidate) => candidate.id === sectionId);
      const done = completed(sectionId);
      const control = button(`${done ? "✓ " : ""}${index + 1}. ${item?.title || sectionId}`, `substep-button${sectionId === activeId ? " substep-button-active" : ""}${done ? " substep-button-done" : ""}`, () => {
        context.engine.updateSceneState(scene.id, { activeSectionId: sectionId });
        context.rerender();
      });
      control.disabled = context.readonly;
      control.setAttribute("aria-current", sectionId === activeId ? "step" : "false");
      append(stepper, control);
    });
    append(body, stepper);

    if (scene.type === "grouped-scenario" && activeId === scene.decisionSectionId) {
      const earlierDone = sectionIds.slice(0, activeIndex).every(completed);
      if (!earlierDone) append(body, interactionStatus(false, "Сначала завершите предыдущий шаг консультации."));
      else append(body, renderDecisionPanel(context, scene.interaction, completed(activeId), () => context.markMaterial(activeId)));
      if (completed(activeId) || ["incorrect", "success"].includes(state.feedback)) append(body, canonicalCopy(section));
      else append(body, sourceLine(section.sourceIds));
      return body;
    }

    append(body, canonicalCopy(section));

    const afterCurrent = sectionIds.slice(activeIndex + 1).find((sectionId) => !completed(sectionId)) || sectionIds[activeIndex + 1];
    const advance = button(completed(activeId) ? "Перейти к следующему этапу" : "Продолжить к следующему этапу", "button button-secondary", () => {
      if (!completed(activeId)) context.markMaterial(activeId);
      context.engine.updateSceneState(scene.id, { activeSectionId: afterCurrent || activeId });
      context.rerender();
    });
    advance.disabled = context.readonly || (completed(activeId) && !afterCurrent);
    append(body, advance, feedback(completed(activeId) ? "success" : "idle", {
      idle: "После просмотра продолжите к следующему этапу. Завершённые этапы сохраняются.",
      success: "Этот этап уже завершён и не требует повторной отметки."
    }));
    return body;
  };

  const renderPracticeHub = (context, module) => {
    const body = el("section", "scene-body practice-hub");
    const state = context.engine.getSceneState(context.scene.id);
    const skills = practice().module02Skills || [];
    const selectedSkillId = skills.some((skill) => skill.id === state.selectedSkillId) ? state.selectedSkillId : skills[0]?.id;
    const selected = skills.find((skill) => skill.id === selectedSkillId);
    const progressState = context.progress.get().skills[selectedSkillId];
    const currentLevel = practice().levels?.find((level) => level.id === progressState?.level) || practice().levels?.[0];
    const requirementsDone = context.progress.allModule02SkillsWithMentor();
    append(body, el("p", "scene-kicker", "Практика с наставником"), el("h1", "scene-title", "КАРТА ПЯТИ НАВЫКОВ"), el("p", "scene-copy", "Стажёр видит статус. Следующий уровень фиксирует наставник; пропуск этапов невозможен."));
    const grid = el("div", "practice-hub-grid");
    skills.forEach((skill) => {
      const skillState = context.progress.get().skills[skill.id];
      const level = practice().levels?.find((item) => item.id === skillState.level) || practice().levels?.[0];
      const control = button(`${skill.title} · ${level.label}`, `practice-skill${skill.id === selectedSkillId ? " practice-skill-active" : ""}`, () => {
        context.engine.updateSceneState(context.scene.id, { selectedSkillId: skill.id });
        context.rerender();
      });
      control.disabled = context.readonly;
      control.setAttribute("aria-pressed", skill.id === selectedSkillId ? "true" : "false");
      append(grid, control);
    });
    const detail = el("section", "practice-detail");
    const nextLevel = practice().levels?.find((level) => level.rank === currentLevel.rank + 1);
    const draft = state.draftReviews?.[selectedSkillId] || { status: progressState?.mentorReview?.status || "pending", comment: progressState?.mentorReview?.comment || "" };
    append(detail, el("h2", "interaction-title", selected.title), el("p", "scene-copy", `${selected.timing} · текущий уровень: ${currentLevel.label}`));
    const criteria = el("ul", "scene-list"); (selected.criteria || []).forEach((item) => append(criteria, el("li", "", item))); append(detail, criteria, sourceLine(selected.sourceIds));
    const advance = button(nextLevel ? `Наставник: подтвердить «${nextLevel.label}»` : "Достигнут максимальный уровень", "button button-primary", () => { context.progress.advanceSkill(selectedSkillId); context.rerender(); });
    advance.disabled = context.readonly || !nextLevel;
    const reviewSelect = el("select", "field-control");
    (practice().reviewStatuses || []).forEach((status) => { const option = el("option", "", status.label); option.value = status.id; option.selected = draft.status === status.id; append(reviewSelect, option); });
    reviewSelect.addEventListener("change", () => {
      const currentDraft = context.engine.getSceneState(context.scene.id).draftReviews?.[selectedSkillId] || draft;
      context.engine.updateSceneState(context.scene.id, { draftReviews: { ...(state.draftReviews || {}), [selectedSkillId]: { ...currentDraft, status: reviewSelect.value } } });
    });
    const reviewComment = el("textarea", "field-control"); reviewComment.placeholder = "Комментарий наставника по навыку"; reviewComment.value = draft.comment;
    reviewComment.addEventListener("input", () => {
      const currentDraft = context.engine.getSceneState(context.scene.id).draftReviews?.[selectedSkillId] || draft;
      context.engine.updateSceneState(context.scene.id, { draftReviews: { ...(state.draftReviews || {}), [selectedSkillId]: { ...currentDraft, comment: reviewComment.value } } });
    });
    const saveReview = button("Сохранить проверку навыка", "button button-secondary", () => {
      const current = context.engine.getSceneState(context.scene.id).draftReviews?.[selectedSkillId] || draft;
      context.progress.setSkillReview(selectedSkillId, current.status, current.comment);
      context.rerender();
    });
    reviewSelect.disabled = context.readonly; reviewComment.disabled = context.readonly; saveReview.disabled = context.readonly;
    append(detail, advance, el("label", "field-label", "Решение наставника по навыку"), reviewSelect, reviewComment, saveReview);
    append(body, grid, detail, interactionStatus(requirementsDone, requirementsDone ? "Все пять навыков достигли уровня «Выполнил с наставником»." : "Для завершения занятия все пять навыков должны достичь уровня «Выполнил с наставником»."));
    return body;
  };

  const renderQuiz = (context, module) => {
    const body = el("section", "scene-body");
    if (!context.progress.materialsDone(module)) {
      append(body, el("div", "scene-error", `Теоретическая проверка откроется после завершения всех ${module.sections?.length || 0} материалов.`));
      return body;
    }
    const questions = context.progress.questionsFor(module);
    const theory = context.progress.moduleState(module.id).theory;
    const question = questions[context.engine.state().quizIndex];
    if (!question) return el("div", "scene-error", "Не удалось загрузить вопрос. Материал не отмечен как завершён.");
    append(body, el("p", "scene-kicker", `Вопрос ${String(context.engine.state().quizIndex + 1).padStart(2, "0")} / ${String(questions.length).padStart(2, "0")}`), el("h1", "scene-title", question.prompt));
    const form = el("fieldset", "quiz-options");
    question.options.forEach((option, optionIndex) => {
      const label = el("label", "choice-row");
      const input = el("input", ""); input.type = "radio"; input.name = question.id; input.checked = Number(theory.answers[question.id]) === optionIndex;
      input.disabled = context.readonly;
      input.addEventListener("change", () => context.progress.setAnswer(module.id, question.id, optionIndex));
      append(label, input, el("span", "choice-mark"), el("span", "", option)); append(form, label);
    });
    const actions = el("div", "scene-actions");
    const prev = button("Предыдущий вопрос", "button button-quiet", () => { context.engine.setQuizIndex(context.engine.state().quizIndex - 1); context.rerender(); });
    prev.disabled = context.engine.state().quizIndex === 0;
    const next = button("Следующий вопрос", "button button-secondary", () => { context.engine.setQuizIndex(context.engine.state().quizIndex + 1); context.rerender(); });
    next.disabled = context.engine.state().quizIndex === questions.length - 1;
    append(actions, prev, next);
    if (context.engine.state().quizIndex === questions.length - 1) {
      const submit = button("Проверить ответы", "button button-primary", () => {
        if (questions.some((item) => !Number.isInteger(theory.answers[item.id]))) { validation.textContent = "Ответьте на все вопросы перед проверкой."; return; }
        context.engine.finishQuiz(); context.rerender();
      });
      submit.disabled = context.readonly;
      append(actions, submit);
    }
    const validation = el("p", "interaction-status", `Попыток: ${theory.attempts}. Ответы можно изменить до проверки.`);
    append(body, form, actions, validation);
    return body;
  };

  const renderResult = (context, module) => {
    const body = el("section", "scene-body");
    const theory = context.progress.moduleState(module.id).theory;
    const questions = context.progress.questionsFor(module);
    const passed = context.progress.theoryPassed(module);
    append(body, el("p", "scene-kicker", "Результат теории"), el("h1", "scene-title", passed ? "ТЕОРИЯ ПРОЙДЕНА" : "МАТЕРИАЛ СТОИТ ПОВТОРИТЬ"));
    append(body, el("p", "result-score", `${theory.lastScore ?? 0} / ${questions.length}`));
    if (passed) append(body, el("p", "scene-copy", "Ожидает подтверждения наставника. Теория сама по себе не завершает занятие."));
    else {
      append(body, el("p", "scene-copy", `Повторите темы: ${theory.incorrectTopics.join(", ") || "все разделы"}. Лучший результат: ${theory.bestScore}/${questions.length}.`));
      const actions = el("div", "scene-actions");
      const firstMaterialScene = context.engine.scenes().find((scene) => scene.sectionId || scene.sectionIds?.length);
      append(actions, button("Повторить тест", "button button-primary", () => { context.engine.goTo("exam"); context.rerender(); }), button("Вернуться к материалу", "button button-quiet", () => { if (firstMaterialScene) context.engine.goTo(firstMaterialScene.id); context.rerender(); }));
      append(body, actions);
    }
    return body;
  };

  const renderMentor = (context, module) => {
    const body = el("section", "scene-body");
    const state = context.progress.moduleState(module.id);
    const review = state.mentorReview;
    const transient = context.engine.getSceneState(context.scene.id);
    append(body, el("p", "scene-kicker", "Разбор с наставником"), el("h1", "scene-title", module.mentorReviewTitle));
    const requirements = el("div", "requirements-grid");
    const requirementItems = [[context.progress.materialsDone(module), "Все материалы завершены"], [context.progress.theoryPassed(module), `Лучший результат не ниже ${module.test.passScore}/${context.progress.questionsFor(module).length}`]];
    if (module.id === "02") requirementItems.push([context.progress.allModule02SkillsWithMentor(), "Все пять навыков — минимум «Выполнил с наставником»"]);
    requirementItems.forEach(([done, text]) => append(requirements, el("div", done ? "requirement requirement-done" : "requirement", `${done ? "✓" : "○"} ${text}`)));
    const panel = el("section", "mentor-panel");
    const select = el("select", "field-control");
    const selectedStatus = transient.status || review.status;
    (practice().reviewStatuses || []).forEach((status) => { const option = el("option", "", status.label); option.value = status.id; option.selected = selectedStatus === status.id; append(select, option); });
    select.addEventListener("change", () => context.engine.updateSceneState(context.scene.id, { status: select.value, feedback: "changed" }));
    const comment = el("textarea", "field-control"); comment.value = transient.comment === null ? review.comment : transient.comment; comment.placeholder = "Короткий комментарий наставника";
    comment.addEventListener("input", () => context.engine.updateSceneState(context.scene.id, { comment: comment.value, feedback: "changed" }));
    const save = button("Сохранить решение", "button button-primary", () => {
      const current = context.engine.getSceneState(context.scene.id);
      context.progress.setReview(module.id, current.status || review.status, current.comment === null ? review.comment : current.comment);
      context.engine.updateSceneState(context.scene.id, { feedback: "saved" });
      context.rerender();
    });
    select.disabled = context.readonly; comment.disabled = context.readonly; save.disabled = context.readonly;
    const saved = el("p", "interaction-status", review.confirmedAt ? `Последнее решение: ${new Date(review.confirmedAt).toLocaleString("ru-RU")}` : "Выберите статус и сохраните решение.");
    append(panel, el("label", "field-label", "Статус"), select, el("label", "field-label", "Комментарий"), comment, save, saved);
    const moduleIndex = (window.TOPGUN_MODULES || []).findIndex((item) => item.id === module.id);
    const nextModule = window.TOPGUN_MODULES?.[moduleIndex + 1];
    if (nextModule && !context.progress.moduleUnlocked(nextModule)) {
      const unlock = el("section", "mentor-panel");
      const unlockComment = el("textarea", "field-control");
      unlockComment.placeholder = "Комментарий наставника — необязательно";
      unlockComment.value = transient.unlockComment || "";
      unlockComment.addEventListener("input", () => context.engine.updateSceneState(context.scene.id, { unlockComment: unlockComment.value }));
      const unlockButton = button(`Открыть занятие ${nextModule.id} раньше`, "button button-secondary", () => {
        if (!window.confirm(`Открыть занятие «${nextModule.title}» раньше? Предыдущее занятие не будет зачтено автоматически.`)) return;
        context.progress.manualUnlock(nextModule.id, context.engine.getSceneState(context.scene.id).unlockComment || "");
        context.rerender();
      });
      unlockComment.disabled = context.readonly; unlockButton.disabled = context.readonly;
      append(unlock, el("h2", "interaction-title", "Изменение порядка практики"), el("p", "scene-copy", "Ручное открытие не меняет тесты, материалы или решение наставника."), unlockComment, unlockButton);
      append(body, requirements, panel, unlock);
    } else append(body, requirements, panel);
    return body;
  };

  const renderScene = (context) => {
    const module = context.engine.module();
    const scene = context.engine.scene();
    const article = el("article", `scene${scene?.type ? ` scene--${scene.type}` : ""}`);
    if (!scene || !module) return append(article, el("div", "scene-error", "Не удалось загрузить конфигурацию сцены. Прогресс не изменён."));
    if (scene.type === "manifesto") append(article, renderManifesto());
    else {
      const section = scene.sectionId ? sectionFor(module, scene) : null;
      if (scene.sectionId && !section) return append(article, el("div", "scene-error", "Сцена ссылается на отсутствующий раздел. Прогресс не изменён."));
      const missingSubstep = (scene.sectionIds || []).some((sectionId) => !module.sections?.some((candidate) => candidate.id === sectionId));
      if (missingSubstep) return append(article, el("div", "scene-error", "Сцена ссылается на отсутствующий раздел. Прогресс не изменён."));
      if (!["quiz", "result", "mentor-review", "practice-hub", "module-intro"].includes(scene.type)) append(article, sectionIntro(module, scene, section, context.engine.state().sceneIndex + 1, context.engine.scenes().length));
      if (scene.type === "module-intro") append(article, renderModuleIntro(module));
      if (scene.type === "learn" || scene.type === "resources") {
        const body = el("section", `scene-body learn-scene${scene.type === "resources" ? " learn-scene--resources" : ""}`);
        append(body, canonicalCopy(section));
        append(article, body);
      }
      if (scene.type === "multi-select") append(article, renderRules(context, section));
      if (scene.type === "learn-decision") append(article, renderAppearance(context, section));
      if (scene.type === "hotspot") append(article, renderWorkplace(context, section));
      if (scene.type === "sorter") append(article, renderDisinfection(context, section));
      if (scene.type === "decision") append(article, renderDecision(context, section));
      if (scene.type === "grouped-learn" || scene.type === "grouped-scenario") append(article, renderGroupedScene(context, module));
      if (scene.type === "quiz") append(article, renderQuiz(context, module));
      if (scene.type === "result") append(article, renderResult(context, module));
      if (scene.type === "practice-hub") append(article, renderPracticeHub(context, module));
      if (scene.type === "mentor-review") append(article, renderMentor(context, module));
    }
    return article;
  };

  const renderLegacyModule = (context, module) => {
    const root = el("main", "legacy-module");
    append(root, el("p", "scene-kicker", `${module.id} · полное занятие`), el("h1", "scene-title", module.title), el("p", "scene-copy", module.purpose || module.summary));
    module.sections.forEach((section) => {
      const card = el("section", "legacy-card"); append(card, el("h2", "legacy-title", section.title), canonicalCopy(section));
      const done = Boolean(context.progress.moduleState(module.id).materialsCompleted[section.id]);
      const mark = button(done ? "Материал изучен" : "Отметить изучение", done ? "button button-success" : "button button-secondary", () => { context.progress.completeMaterial(module.id, section.id); context.rerender(); });
      mark.disabled = done || context.progress.isReadonly(); append(card, mark); append(root, card);
    });
    const test = el("section", "legacy-card"); append(test, el("h2", "legacy-title", "Теоретическая проверка"));
    if (!context.progress.materialsDone(module)) append(test, el("p", "scene-copy", "Сначала завершите все разделы занятия."));
    else {
      const theory = context.progress.moduleState(module.id).theory;
      context.progress.questionsFor(module).forEach((question) => {
        const fieldset = el("fieldset", "quiz-options"); append(fieldset, el("legend", "", question.prompt));
        question.options.forEach((option, index) => { const label = el("label", "choice-row"); const input = el("input", ""); input.type = "radio"; input.name = question.id; input.checked = Number(theory.answers[question.id]) === index; input.disabled = context.progress.isReadonly(); input.addEventListener("change", () => context.progress.setAnswer(module.id, question.id, index)); append(label, input, el("span", "choice-mark"), el("span", "", option)); append(fieldset, label); }); append(test, fieldset);
      });
      const evaluate = button("Проверить ответы", "button button-primary", () => { context.progress.evaluate(module); context.rerender(); }); evaluate.disabled = context.progress.isReadonly(); append(test, evaluate);
      if (theory.lastScore !== null) append(test, el("p", "scene-copy", `Последний результат: ${theory.lastScore}/${context.progress.questionsFor(module).length}. Лучший: ${theory.bestScore}.`));
    }
    append(root, test);
    if (module.id === "02") {
      const practiceCard = el("section", "legacy-card"); append(practiceCard, el("h2", "legacy-title", "Карта практических навыков"));
      (practice().module02Skills || []).forEach((skill) => {
        const state = context.progress.get().skills[skill.id]; const item = el("article", "skill-item"); append(item, el("h3", "", skill.title), el("p", "scene-copy", `${skill.timing} · ${practice().levels?.find((level) => level.id === state.level)?.label || "Не начато"}`));
        const levels = el("div", "skill-levels"); (practice().levels || []).forEach((level) => { const control = button(level.label, "button button-quiet", () => { context.progress.advanceSkill(skill.id); context.rerender(); }); control.disabled = context.progress.isReadonly() || level.rank !== context.progress.skillRank(skill.id) + 1; append(levels, control); });
        const reviewSelect = el("select", "field-control"); (practice().reviewStatuses || []).forEach((status) => { const option = el("option", "", status.label); option.value = status.id; option.selected = state.mentorReview.status === status.id; append(reviewSelect, option); });
        const reviewComment = el("textarea", "field-control"); reviewComment.placeholder = "Комментарий наставника по навыку"; reviewComment.value = state.mentorReview.comment;
        const reviewSave = button("Сохранить проверку навыка", "button button-secondary", () => { context.progress.setSkillReview(skill.id, reviewSelect.value, reviewComment.value); context.rerender(); });
        reviewSelect.disabled = context.progress.isReadonly(); reviewComment.disabled = context.progress.isReadonly(); reviewSave.disabled = context.progress.isReadonly();
        append(item, levels, reviewSelect, reviewComment, reviewSave); append(practiceCard, item);
      }); append(root, practiceCard);
    }
    const review = context.progress.moduleState(module.id).mentorReview;
    const reviewCard = el("section", "legacy-card mentor-panel"); append(reviewCard, el("h2", "legacy-title", module.mentorReviewTitle));
    const select = el("select", "field-control"); (practice().reviewStatuses || []).forEach((status) => { const option = el("option", "", status.label); option.value = status.id; option.selected = review.status === status.id; append(select, option); });
    const comment = el("textarea", "field-control"); comment.value = review.comment; const save = button("Сохранить решение", "button button-primary", () => { context.progress.setReview(module.id, select.value, comment.value); context.rerender(); }); select.disabled = context.progress.isReadonly(); comment.disabled = context.progress.isReadonly(); save.disabled = context.progress.isReadonly(); append(reviewCard, select, comment, save);
    append(root, reviewCard);
    const currentIndex = window.TOPGUN_MODULES.findIndex((item) => item.id === module.id);
    const nextModule = window.TOPGUN_MODULES[currentIndex + 1];
    if (nextModule && !context.progress.moduleUnlocked(nextModule)) {
      const unlock = el("section", "legacy-card mentor-panel");
      const unlockComment = el("textarea", "field-control"); unlockComment.placeholder = "Комментарий наставника — необязательно";
      const unlockButton = button(`Открыть занятие ${nextModule.id}`, "button button-secondary", () => {
        if (!window.confirm(`Открыть занятие «${nextModule.title}» раньше? Предыдущее занятие и навыки не будут зачтены автоматически.`)) return;
        context.progress.manualUnlock(nextModule.id, unlockComment.value); context.rerender();
      });
      unlockComment.disabled = context.progress.isReadonly(); unlockButton.disabled = context.progress.isReadonly();
      append(unlock, el("h2", "legacy-title", "Изменение порядка практики"), el("p", "scene-copy", "Ручное открытие не завершает текущее занятие и не меняет тесты, навыки или решения наставника."), unlockComment, unlockButton); append(root, unlock);
    }
    return root;
  };

  window.TOPGUN_SCENES = { el, append, button, sourceLine, renderScene, renderLegacyModule, reviewLabel };
})();
