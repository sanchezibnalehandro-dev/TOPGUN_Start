(() => {
  "use strict";

  const experience = () => window.TOPGUN_EXPERIENCE || { modules: {} };
  const progress = () => window.TOPGUN_PROGRESS_API;
  const state = { mode: "boot", moduleId: "01", sceneIndex: 0, quizIndex: 0, sceneState: {}, lastTransitionAt: 0 };
  const scenesFor = () => experience().modules?.[state.moduleId]?.scenes || [];
  const currentScene = () => scenesFor()[state.sceneIndex] || null;
  const currentModule = () => progress().getModule(state.moduleId);
  const sceneSectionIds = (scene = currentScene()) => scene?.sectionIds || (scene?.sectionId ? [scene.sectionId] : []);
  const sectionComplete = (scene = currentScene()) => sceneSectionIds(scene).every((sectionId) => Boolean(progress().moduleState(state.moduleId)?.materialsCompleted?.[sectionId]));
  const canLeave = () => {
    const scene = currentScene();
    if (!scene) return false;
    if (scene.type === "quiz") return false;
    if (scene.completion === "free" || scene.completion === "on-next") return true;
    if (scene.type === "result" || scene.type === "mentor-review") return true;
    return sectionComplete(scene);
  };
  const stamp = () => { state.lastTransitionAt = Date.now(); };
  const blankSceneState = (scene) => {
    if (scene?.type === "multi-select") return { selectedIndexes: [], feedback: "idle" };
    if (scene?.type === "learn-decision" || scene?.type === "decision") return { selection: null, feedback: "idle" };
    if (scene?.type === "hotspot") return { openedIndexes: [], feedback: "idle" };
    if (scene?.type === "sorter") return { selections: {}, feedback: "idle" };
    if (scene?.type === "grouped-learn" || scene?.type === "grouped-scenario") return { activeSectionId: null, selection: null, feedback: "idle" };
    if (scene?.type === "practice-hub") return { selectedSkillId: null, draftReviews: {} };
    if (scene?.type === "mentor-review") return { status: null, comment: null, unlockComment: "", feedback: "idle" };
    return {};
  };
  const sceneById = (sceneId) => scenesFor().find((scene) => scene.id === sceneId);
  const ensureSceneState = (sceneId) => {
    if (!state.sceneState[sceneId]) state.sceneState[sceneId] = blankSceneState(sceneById(sceneId));
    return state.sceneState[sceneId];
  };
  const next = () => {
    if (!canLeave()) return false;
    const scene = currentScene();
    if (scene?.sectionId && scene.completion === "on-next") progress().completeMaterial(state.moduleId, scene.sectionId);
    if (scene?.type === "mentor-review") { state.mode = "route"; stamp(); return true; }
    if (state.sceneIndex < scenesFor().length - 1) { state.sceneIndex += 1; state.quizIndex = 0; stamp(); return true; }
    return false;
  };
  const back = () => {
    if (state.sceneIndex > 0) { state.sceneIndex -= 1; state.quizIndex = 0; stamp(); return true; }
    state.mode = "route"; stamp(); return true;
  };
  const openModule = (moduleId) => {
    const module = progress().getModule(moduleId);
    if (!module || !progress().moduleUnlocked(module)) return false;
    progress().setCurrentModule(moduleId);
    if (experience().modules?.[moduleId]) { state.mode = "module"; state.moduleId = moduleId; state.sceneIndex = 0; state.quizIndex = 0; state.sceneState = {}; }
    else state.mode = "legacy";
    stamp();
    return true;
  };
  window.TOPGUN_EXPERIENCE_ENGINE = {
    state: () => state,
    scene: currentScene,
    scenes: scenesFor,
    module: currentModule,
    sceneComplete: sectionComplete,
    start: () => { state.mode = "route"; stamp(); },
    route: () => { state.mode = "route"; stamp(); },
    openModule, next, back,
    completeInteraction: (sectionId) => progress().completeMaterial(state.moduleId, sectionId),
    getSceneState: (sceneId) => ensureSceneState(sceneId),
    updateSceneState: (sceneId, patch) => {
      const current = ensureSceneState(sceneId);
      state.sceneState[sceneId] = { ...current, ...patch };
      return state.sceneState[sceneId];
    },
    setQuizIndex: (index) => { state.quizIndex = Math.max(0, Math.min(index, Math.max(0, progress().questionsFor(currentModule()).length - 1))); },
    goTo: (sceneId) => { const index = scenesFor().findIndex((scene) => scene.id === sceneId); if (index >= 0) { state.sceneIndex = index; state.quizIndex = 0; stamp(); return true; } return false; },
    finishQuiz: () => { progress().evaluate(currentModule()); state.sceneIndex = scenesFor().findIndex((scene) => scene.type === "result"); state.quizIndex = 0; stamp(); }
  };
})();
