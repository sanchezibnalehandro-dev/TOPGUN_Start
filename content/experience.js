window.TOPGUN_EXPERIENCE = {
  version: 1,
  modules: {
    "01": {
      scenes: [
        { id: "manifesto", type: "manifesto", completion: "free" },
        { id: "role", type: "learn", sectionId: "role", completion: "on-next" },
        {
          id: "shift-ready",
          type: "multi-select",
          sectionId: "rules",
          completion: "interaction-success",
          correctIndexes: [0, 1, 2, 3, 5],
          interactionOptions: [
            { label: "Спланировать прибытие так, чтобы быть на месте минимум за 20 минут до начала смены." },
            { label: "Включить рабочую десятиминутку в начало смены, а не пропустить её из-за подготовки места." },
            { label: "Выйти к первому гостю только в чистой фирменной форме." },
            { label: "Перед работой с лицом или опасной бритвой подготовить одноразовые перчатки." },
            { label: "Выбрить пробор клиенту по запросу" },
            { label: "Не откладывать дезинфекцию и порядок на рабочем месте до конца смены." }
          ]
        },
        {
          id: "appearance",
          type: "learn-decision",
          sectionId: "appearance",
          completion: "interaction-success",
          interaction: {
            prompt: "Постоянный гость возвращается после перерыва и говорит: «Давай как обычно». Как вы начнёте работу?",
            options: [
              { id: "clarify", label: "Сохраню такое же профессиональное внимание, как при первой встрече: уточню, актуальны ли его ожидания, и только затем начну работу.", correct: true },
              { id: "assume", label: "Сразу начну привычную стрижку: постоянному гостю не нужно заново уделять внимание.", correct: false },
              { id: "rush", label: "Сокращу разговор и предложу выбрать услугу уже после стрижки, чтобы не тратить время.", correct: false }
            ]
          }
        },
        { id: "workplace", type: "learn", sectionId: "workplace", completion: "on-next" },
        { id: "disinfection", type: "sorter", sectionId: "disinfection", completion: "interaction-success" },
        {
          id: "cosmetics", type: "decision", sectionId: "cosmetics", completion: "interaction-success",
          interaction: {
            title: "Граница рекомендации",
            prompt: "Гость спрашивает, поможет ли средство решить проблему кожи головы. Как ответить в рамках вводного занятия?",
            options: [
              { id: "bounded", label: "Рассказать о назначении средства только по предоставленному материалу, не ставя диагноз и не обещая лечебный результат.", correct: true },
              { id: "diagnose", label: "По описанию гостя определить проблему кожи головы и сразу рекомендовать лечебный курс.", correct: false },
              { id: "guarantee", label: "Пообещать конкретный лечебный эффект, если гость будет использовать средство регулярно.", correct: false }
            ],
            feedback: {
              incorrect: "Барбер не ставит медицинский диагноз и не обещает лечебный результат. Обсуждать можно только подтверждённое назначение продукта.",
              success: "Верно. Рекомендация остаётся в пределах предоставленного материала и не превращается в медицинское назначение."
            }
          }
        },
        { id: "resources", type: "resources", sectionId: "further-materials", completion: "on-next" },
        { id: "exam", type: "quiz", questionSetId: "01" },
        { id: "result", type: "result" },
        { id: "mentor-review", type: "mentor-review" }
      ]
    },
    "02": {
      scenes: [
        { id: "module-02-briefing", type: "module-intro", completion: "free" },
        { id: "arrival", type: "grouped-learn", title: "До прихода и встреча", sectionIds: ["preparation", "meeting"], completion: "all-substeps" },
        {
          id: "consultation-flow",
          type: "grouped-scenario",
          title: "Консультация", sectionIds: ["request", "consultation"], decisionSectionId: "consultation", completion: "all-substeps",
          interaction: {
            title: "Рабочее решение",
            prompt: "Гость говорит: «Делай как считаешь нужным». Как продолжить консультацию?",
            options: [
              { id: "clarify", label: "Поблагодарить за доверие и всё равно конкретизировать пожелания, предложив варианты и подтвердив договорённость.", correct: true },
              { id: "assume", label: "Сразу начать привычную стрижку: клиент уже передал техническое задание.", correct: false },
              { id: "mirror", label: "Попросить гостя объяснить желаемый результат через зеркало во время работы.", correct: false }
            ],
            feedback: {
              incorrect: "Фраза «делай как считаешь нужным» не заменяет конкретизацию пожеланий и подтверждение договорённости.",
              success: "Верно. Консультация остаётся лицом к лицу, а финальный выбор — за клиентом."
            }
          }
        },
        { id: "client-card", type: "learn", sectionId: "client-card", completion: "on-next" },
        { id: "core-services", type: "grouped-learn", title: "Базовые услуги", sectionIds: ["haircut", "scalp-care", "beard"], completion: "all-substeps" },
        {
          id: "wax-boundary", type: "decision", sectionId: "wax", completion: "interaction-success",
          interaction: {
            title: "Граница процедуры",
            prompt: "Гость просит удалить воском волосы на шее и в носу. Как корректно действовать в рамках материала?",
            options: [
              { id: "allowed", label: "Уточнить допустимую зону и работать только с носом, ушами или бровями; шею воском не обрабатывать.", correct: true },
              { id: "all", label: "Согласиться на нос и шею, если использовать одноразовые материалы и контролировать температуру воска.", correct: false },
              { id: "neck", label: "Предложить обработать только шею: эта зона кажется менее чувствительной, чем нос.", correct: false }
            ],
            feedback: {
              incorrect: "В материале допустимы только нос, уши и брови; зоны щёк, шеи и другие зоны исключены.",
              success: "Верно. Границы процедуры соблюдены."
            }
          }
        },
        { id: "camouflage", type: "learn", sectionId: "camouflage", completion: "on-next" },
        {
          id: "recommendations", type: "decision", sectionId: "recommendations", completion: "interaction-success",
          interaction: {
            title: "Рекомендация без давления",
            prompt: "После консультации вы видите уместную дополнительную услугу. Как её предложить?",
            options: [
              { id: "need", label: "Связать предложение с конкретной потребностью и историей визитов, объяснить пользу и спокойно принять отказ.", correct: true },
              { id: "universal", label: "Коротко перечислить одинаковый набор дополнительных услуг каждому гостю, чтобы он сам выбрал подходящее.", correct: false },
              { id: "pressure", label: "Объяснить, что без дополнительной услуги результат не будет полноценным, даже если гость сомневается.", correct: false }
            ],
            feedback: {
              incorrect: "Рекомендация должна быть уместной и оставлять клиенту право отказаться.",
              success: "Верно. Рекомендация связана с потребностью, а не с давлением."
            }
          }
        },
        { id: "visit-close", type: "grouped-learn", title: "Завершение визита", sectionIds: ["finish", "cleanup"], completion: "all-substeps" },
        { id: "exam", type: "quiz", questionSetId: "02" },
        { id: "result", type: "result" },
        { id: "practice-hub", type: "practice-hub", completion: "free" },
        { id: "mentor-review", type: "mentor-review" }
      ]
    }
  }
};
