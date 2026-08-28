(() => {
  "use strict";

  const progress = window.TOPGUN_PROGRESS_API;
  const engine = window.TOPGUN_EXPERIENCE_ENGINE;
  const scenes = window.TOPGUN_SCENES;
  const modules = Array.isArray(window.TOPGUN_MODULES) ? window.TOPGUN_MODULES : [];
  const app = document.getElementById("app");

  const contentValid = progress && engine && scenes && modules.length === 6
    && modules.filter((module) => module.kind === "full").length === 2
    && progress.questionsFor(modules[0]).length === 8
    && progress.questionsFor(modules[1]).length === 10
    && (window.TOPGUN_PRACTICE?.module02Skills || []).length === 5
    && window.TOPGUN_SOURCES?.policy?.firstRule;

  const changeTraineeName = () => {
    const next = window.prompt("Имя стажёра", progress.get().traineeName);
    if (next !== null) { progress.setTraineeName(next); render(); }
  };

  const traineeControl = (className = "button button-quiet", label = progress.get().traineeName) => scenes.button(label, className, changeTraineeName);

  const renderHeader = (mode) => {
    const header = scenes.el("header", "app-header");
    header.classList.add(`app-header-${mode}`);
    const brand = scenes.el("button", "wordmark", "TOPGUN · START");
    brand.type = "button";
    brand.addEventListener("click", () => { engine.route(); render(); });
    const actions = scenes.el("div", "app-actions");
    const reset = scenes.button("Сбросить прогресс", "button button-danger", () => {
      const message = progress.isReadonly()
        ? "Удалить несовместимый сохранённый прогресс и начать v0.2 заново?"
        : "Сбросить весь прогресс v0.2 на этом устройстве? Действие нельзя отменить.";
      if (!window.confirm(message)) return;
      progress.reset(); engine.route(); render();
    });
    if (mode !== "boot") {
      const name = traineeControl();
      name.disabled = progress.isReadonly();
      actions.append(name);
    }
    actions.append(reset);
    scenes.append(header, brand, actions);
    return header;
  };

  const renderNotices = () => {
    const fragment = document.createDocumentFragment();
    if (progress.notice()) fragment.append(scenes.el("p", "system-notice", progress.notice()));
    const migration = progress.get().migration;
    if (migration?.noticePending) {
      const notice = scenes.el("section", "system-notice");
      const dismiss = scenes.button("Понятно", "button button-secondary", () => { progress.dismissMigrationNotice(); render(); });
      dismiss.disabled = progress.isReadonly();
      scenes.append(notice, scenes.el("strong", "", "Перенесено имя из предыдущей версии."), scenes.el("p", "", "Учебные зачёты и практика начаты заново; исходный JSON сохранён локально в резервной записи миграции."), dismiss);
      fragment.append(notice);
    }
    return fragment;
  };

  const renderBoot = () => {
    const main = scenes.el("main", "boot-screen");
    const stage = scenes.el("section", "boot-stage");
    const identity = scenes.el("div", "boot-identity");
    const logoFrame = scenes.el("div", "boot-logo-frame");
    const logo = document.createElement("img");
    logo.className = "boot-logo";
    logo.src = "assets/topgun-logo.png";
    logo.alt = "TOPGUN";
    logoFrame.append(logo);
    const copy = scenes.el("div", "boot-copy");
    const trainee = traineeControl("button button-quiet boot-trainee", progress.get().traineeName);
    trainee.disabled = progress.isReadonly();
    const action = scenes.button(progress.get().currentModuleId === "01" ? "Начать маршрут" : "Продолжить маршрут", "button button-primary button-large", () => { engine.start(); render(); });
    const titleLockup = scenes.el("div", "boot-title-lockup");
    scenes.append(titleLockup, scenes.el("p", "boot-topgun-type", "TOPGUN"), scenes.el("h1", "boot-title", "START"));
    scenes.append(copy, scenes.el("p", "scene-kicker", "Первый рабочий маршрут"), titleLockup, scenes.el("p", "scene-copy", "Вводный маршрут перед первой сменой: материал, решения и подтверждение наставника."), trainee, action);
    scenes.append(identity, logoFrame, copy);
    stage.append(identity);
    main.append(stage);
    return main;
  };

  const renderRoute = () => {
    const main = scenes.el("main", "route-screen");
    const heading = scenes.el("header", "route-heading");
    scenes.append(heading, scenes.el("p", "scene-kicker", "Маршрут стажировки"), scenes.el("h1", "route-title", "Шесть занятий"), scenes.el("p", "scene-copy", `${progress.routeCompletedCount()} / ${modules.length} завершено · порядок можно изменить только подтверждением наставника.`));
    const map = scenes.el("section", "route-map");
    const list = scenes.el("nav", "route-list"); list.setAttribute("aria-label", "Маршрут стажировки");
    modules.forEach((module) => {
      const status = progress.moduleStatus(module);
      const side = Number(module.id) % 2 === 0 ? "route-node-right" : "route-node-left";
      const item = scenes.el("button", `route-item ${side} route-${status.tone}`);
      item.type = "button"; item.disabled = status.locked;
      const content = scenes.el("span", "route-item-content");
      const copy = scenes.el("span", "route-node-copy");
      scenes.append(copy, scenes.el("span", "route-item-title", module.title), scenes.el("span", "route-item-summary", module.summary));
      scenes.append(content, scenes.el("span", "route-id", module.id), copy, scenes.el("span", `route-status status-${status.tone}`, status.label));
      scenes.append(item, content);
      if (!status.locked) item.addEventListener("click", () => { engine.openModule(module.id); render(); });
      list.append(item);
    });
    map.append(list);
    scenes.append(main, heading, map);
    return main;
  };

  const renderModuleScene = () => {
    const shell = scenes.el("main", "module-scene-shell");
    const current = engine.scene();
    const module = engine.module();
    const hud = scenes.el("header", "scene-hud");
    scenes.append(hud, scenes.el("span", "hud-module", `${module.id} · ${module.title}`), scenes.el("span", "hud-progress", `${String(engine.state().sceneIndex + 1).padStart(2, "0")} / ${String(engine.scenes().length).padStart(2, "0")}`));
    const context = { progress, engine, scene: current, readonly: progress.isReadonly(), complete: () => engine.completeInteraction(current.sectionId), markMaterial: (sectionId) => progress.completeMaterial(module.id, sectionId), rerender: render };
    const scene = scenes.renderScene(context);
    const controls = scenes.el("nav", "scene-navigation"); controls.setAttribute("aria-label", "Навигация по занятию");
    const back = scenes.button("Назад", "button button-quiet", () => { engine.back(); render(); });
    const next = scenes.button(current?.type === "mentor-review" ? "Вернуться к маршруту" : "Далее", "button button-primary", () => { engine.next(); render(); });
    const requiresCompletion = (current?.sectionId || current?.sectionIds?.length) && !["free", "on-next"].includes(current.completion);
    const unavailable = current?.type === "quiz" || (requiresCompletion && !engine.sceneComplete());
    next.disabled = progress.isReadonly() || unavailable;
    scenes.append(controls, back, next);
    scenes.append(shell, hud, scene, controls);
    return shell;
  };

  const renderLegacy = () => {
    const selected = modules.find((module) => module.id === progress.get().currentModuleId) || modules[0];
    if (selected.kind === "full") return scenes.renderLegacyModule({ progress, rerender: render }, selected);
    const card = scenes.el("main", "legacy-module");
    scenes.append(card, scenes.el("p", "scene-kicker", `${selected.id} · структура занятия`), scenes.el("h1", "scene-title", selected.title), scenes.el("p", "scene-copy", selected.summary), scenes.el("aside", "scene-callout", selected.missing), scenes.sourceLine(selected.sourceIds));
    return card;
  };

  function render() {
    app.replaceChildren();
    if (!contentValid) { app.append(scenes.el("p", "scene-error", "Не удалось загрузить структуру v0.2. Проверьте файлы в папке content.")); return; }
    const frame = scenes.el("div", "app-frame");
    const mode = engine.state().mode;
    scenes.append(frame, renderHeader(mode), renderNotices());
    if (mode === "boot") frame.append(renderBoot());
    else if (mode === "route") frame.append(renderRoute());
    else if (mode === "module") frame.append(renderModuleScene());
    else frame.append(renderLegacy());
    app.append(frame);
  }

  document.addEventListener("keydown", (event) => {
    const tag = document.activeElement?.tagName;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(tag) || engine.state().mode !== "module") return;
    if (["ArrowDown", "PageDown"].includes(event.key)) { event.preventDefault(); engine.next(); render(); }
    if (["ArrowUp", "PageUp"].includes(event.key)) { event.preventDefault(); engine.back(); render(); }
  });
  let wheelLock = false;
  document.addEventListener("wheel", (event) => {
    if (engine.state().mode !== "module" || wheelLock || Math.abs(event.deltaY) < 30) return;
    wheelLock = true;
    event.deltaY > 0 ? engine.next() : engine.back(); render();
    window.setTimeout(() => { wheelLock = false; }, 800);
  }, { passive: true });

  render();
})();
