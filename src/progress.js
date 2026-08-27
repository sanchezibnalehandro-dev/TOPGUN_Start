(() => {
  "use strict";

  const STORAGE_KEY = "topgun-start-progress";
  const SCHEMA_VERSION = 2;
  const modules = () => Array.isArray(window.TOPGUN_MODULES) ? window.TOPGUN_MODULES : [];
  const practice = () => window.TOPGUN_PRACTICE || {};
  const questions = () => window.TOPGUN_QUESTIONS || {};
  const fullModules = () => modules().filter((module) => module.kind === "full");
  const now = () => new Date().toISOString();
  const cleanString = (value, fallback = "") => typeof value === "string" ? value : fallback;
  const blankTheory = () => ({ answers: {}, attempts: 0, bestScore: 0, lastScore: null, incorrectTopics: [] });
  const blankReview = () => ({ status: "pending", comment: "", confirmedAt: null });
  const levelById = (id) => practice().levels?.find((level) => level.id === id) || practice().levels?.[0];

  const defaultProgress = (migration = null) => ({
    progressSchemaVersion: SCHEMA_VERSION,
    traineeName: "Стажёр",
    currentModuleId: "01",
    modules: Object.fromEntries(fullModules().map((module) => [module.id, {
      materialsCompleted: Object.fromEntries((module.sections || []).map((section) => [section.id, false])),
      theory: blankTheory(),
      mentorReview: blankReview()
    }])),
    skills: Object.fromEntries((practice().module02Skills || []).map((skill) => [skill.id, { level: "not_started", mentorReview: blankReview() }])),
    manualUnlocks: {},
    migration
  });

  const normalizeReview = (candidate) => ({
    status: ["pending", "accepted", "repeat"].includes(candidate?.status) ? candidate.status : "pending",
    comment: cleanString(candidate?.comment),
    confirmedAt: typeof candidate?.confirmedAt === "string" ? candidate.confirmedAt : null
  });

  const normalizeV2 = (candidate) => {
    const base = defaultProgress(candidate?.migration && typeof candidate.migration === "object" ? candidate.migration : null);
    base.traineeName = cleanString(candidate?.traineeName).trim() || base.traineeName;
    base.currentModuleId = modules().some((module) => module.id === candidate?.currentModuleId) ? candidate.currentModuleId : base.currentModuleId;
    fullModules().forEach((module) => {
      const old = candidate?.modules?.[module.id] || {};
      (module.sections || []).forEach((section) => {
        base.modules[module.id].materialsCompleted[section.id] = Boolean(old.materialsCompleted?.[section.id]);
      });
      const theory = old.theory || {};
      base.modules[module.id].theory = {
        answers: theory.answers && typeof theory.answers === "object" ? theory.answers : {},
        attempts: Number.isInteger(theory.attempts) ? Math.max(0, theory.attempts) : 0,
        bestScore: Number.isInteger(theory.bestScore) ? Math.max(0, theory.bestScore) : 0,
        lastScore: Number.isInteger(theory.lastScore) ? Math.max(0, theory.lastScore) : null,
        incorrectTopics: Array.isArray(theory.incorrectTopics) ? theory.incorrectTopics.filter((item) => typeof item === "string") : []
      };
      base.modules[module.id].mentorReview = normalizeReview(old.mentorReview);
    });
    (practice().module02Skills || []).forEach((skill) => {
      const old = candidate?.skills?.[skill.id] || {};
      base.skills[skill.id].level = practice().levels?.some((level) => level.id === old.level) ? old.level : "not_started";
      base.skills[skill.id].mentorReview = normalizeReview(old.mentorReview);
    });
    if (candidate?.manualUnlocks && typeof candidate.manualUnlocks === "object") {
      Object.entries(candidate.manualUnlocks).forEach(([moduleId, unlock]) => {
        if (modules().some((module) => module.id === moduleId) && unlock && typeof unlock === "object") {
          base.manualUnlocks[moduleId] = { openedAt: cleanString(unlock.openedAt), comment: cleanString(unlock.comment) };
        }
      });
    }
    return base;
  };

  const migrateV1 = (candidate, raw) => {
    const migrated = defaultProgress({ fromSchemaVersion: Number(candidate?.progressSchemaVersion) || 1, migratedAt: now(), v1Backup: raw, noticePending: true });
    migrated.traineeName = cleanString(candidate?.traineeName || candidate?.name).trim() || migrated.traineeName;
    return migrated;
  };

  let storageReadonly = false;
  let systemNotice = "";
  const load = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultProgress();
      const parsed = JSON.parse(raw);
      if (Number(parsed.progressSchemaVersion) > SCHEMA_VERSION) {
        storageReadonly = true;
        systemNotice = "Этот прогресс создан более новой версией приложения. Данные не будут перезаписаны.";
        return defaultProgress();
      }
      if (Number(parsed.progressSchemaVersion) === SCHEMA_VERSION) return normalizeV2(parsed);
      const migrated = migrateV1(parsed, raw);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    } catch {
      storageReadonly = true;
      systemNotice = "Не удалось прочитать локальный прогресс. Открыта чистая версия только для чтения; сохранённые данные не изменены.";
      return defaultProgress();
    }
  };

  let progress = load();
  const save = () => {
    if (storageReadonly) return false;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  };
  const getModule = (id) => modules().find((module) => module.id === id);
  const moduleState = (id) => progress.modules[id];
  const questionsFor = (module) => questions()[module?.test?.questionSetId] || [];
  const materialsDone = (module) => module?.kind === "full" && (module.sections || []).every((section) => moduleState(module.id)?.materialsCompleted?.[section.id]);
  const theoryPassed = (module) => module?.kind === "full" && moduleState(module.id)?.theory.bestScore >= module.test.passScore;
  const reviewAccepted = (module) => moduleState(module?.id)?.mentorReview.status === "accepted";
  const skillRank = (skillId) => levelById(progress.skills[skillId]?.level)?.rank || 0;
  const allModule02SkillsWithMentor = () => (practice().module02Skills || []).every((skill) => skillRank(skill.id) >= 2);
  const moduleComplete = (module) => {
    if (module?.id === "01") return materialsDone(module) && theoryPassed(module) && reviewAccepted(module);
    if (module?.id === "02") return materialsDone(module) && theoryPassed(module) && allModule02SkillsWithMentor() && reviewAccepted(module);
    return false;
  };
  const moduleUnlocked = (module) => {
    if (module?.id === "01") return true;
    if (progress.manualUnlocks[module?.id]) return true;
    const index = modules().findIndex((item) => item.id === module?.id);
    return index > 0 && moduleComplete(modules()[index - 1]);
  };
  const moduleStatus = (module) => {
    if (moduleComplete(module)) return { tone: "done", id: "complete", label: "завершён", locked: false };
    if (progress.manualUnlocks[module.id]) return { tone: "mentor", id: "manual", label: "открыт наставником", locked: false };
    if (!moduleUnlocked(module)) return { tone: "locked", id: "locked", label: "закрыт", locked: true };
    if (progress.currentModuleId === module.id) return { tone: "current", id: "current", label: "сейчас", locked: false };
    return { tone: module.kind === "unfinished" ? "unfinished" : "available", id: module.kind === "unfinished" ? "unfinished" : "available", label: module.kind === "unfinished" ? "контент готовится" : "доступен", locked: false };
  };

  const mutate = (callback) => { if (storageReadonly) return false; callback(); return save(); };
  window.TOPGUN_PROGRESS_API = {
    STORAGE_KEY, SCHEMA_VERSION,
    get: () => progress,
    getModule, moduleState, questionsFor, materialsDone, theoryPassed, reviewAccepted, skillRank, allModule02SkillsWithMentor, moduleComplete, moduleUnlocked, moduleStatus,
    isReadonly: () => storageReadonly,
    notice: () => systemNotice,
    routeCompletedCount: () => modules().filter(moduleComplete).length,
    setCurrentModule: (id) => mutate(() => { if (getModule(id)) progress.currentModuleId = id; }),
    setTraineeName: (name) => mutate(() => { progress.traineeName = cleanString(name).trim() || "Стажёр"; }),
    completeMaterial: (moduleId, sectionId) => mutate(() => { if (moduleState(moduleId)?.materialsCompleted && sectionId in moduleState(moduleId).materialsCompleted) moduleState(moduleId).materialsCompleted[sectionId] = true; }),
    setAnswer: (moduleId, questionId, optionIndex) => mutate(() => { if (moduleState(moduleId)) moduleState(moduleId).theory.answers[questionId] = optionIndex; }),
    evaluate: (module) => mutate(() => {
      const theory = moduleState(module.id).theory;
      let score = 0;
      const incorrect = new Set();
      questionsFor(module).forEach((question) => {
        if (Number(theory.answers[question.id]) === question.correctIndex) score += 1;
        else incorrect.add(question.topic);
      });
      theory.attempts += 1;
      theory.lastScore = score;
      theory.bestScore = Math.max(theory.bestScore, score);
      theory.incorrectTopics = [...incorrect];
    }),
    setReview: (moduleId, status, comment) => mutate(() => {
      const review = moduleState(moduleId)?.mentorReview;
      if (!review) return;
      review.status = ["pending", "accepted", "repeat"].includes(status) ? status : "pending";
      review.comment = cleanString(comment);
      review.confirmedAt = now();
    }),
    advanceSkill: (skillId) => mutate(() => {
      const skill = progress.skills[skillId];
      const next = practice().levels?.find((level) => level.rank === skillRank(skillId) + 1);
      if (skill && next) skill.level = next.id;
    }),
    setSkillReview: (skillId, status, comment) => mutate(() => {
      const review = progress.skills[skillId]?.mentorReview;
      if (!review) return;
      review.status = ["pending", "accepted", "repeat"].includes(status) ? status : "pending";
      review.comment = cleanString(comment);
      review.confirmedAt = now();
    }),
    manualUnlock: (moduleId, comment) => mutate(() => { if (getModule(moduleId)) progress.manualUnlocks[moduleId] = { openedAt: now(), comment: cleanString(comment).trim() }; }),
    dismissMigrationNotice: () => mutate(() => { if (progress.migration) progress.migration.noticePending = false; }),
    reset: () => { localStorage.removeItem(STORAGE_KEY); storageReadonly = false; systemNotice = ""; progress = defaultProgress(); }
  };
})();
