# TOPGUN START · Stage 2 Visual Spec

Status: implementation brief for branch `stage2-visual`
Baseline: tag `v2-engine`
Scope: visual system, composition, motion and trainee UX presentation only. Do not alter canonical learning content, completion rules, storage schema or Stage 3 3D/WebGPU work.

## 1. Product feeling

TOPGUN START must feel like a professional onboarding simulator and guided first shift, not a classic LMS, dashboard, SaaS portal or children’s gamified course.

The user should feel that each module is a sequence of deliberate scenes inside one visual world:

`route → scene → decision / material → result → route`

The interface should be cinematic but usable, restrained rather than decorative.

## 2. Visual direction

Base world:
- near-black / graphite environment;
- white and cool gray typography;
- TOPGUN red and cold blue as primary accents;
- amber/gold is no longer a primary brand accent for Stage 2;
- subtle fog, grain, hair/fibre-line motifs and sparse light traces may be simulated in CSS;
- no neon cyberpunk;
- no glossy generic SaaS gradients;
- no large rounded card farm;
- no Duolingo-style coins, hearts, confetti or cartoon feedback.

Exact official HEX values are not asserted by this file. Until an explicit brandbook palette is available in the repository, use restrained provisional values derived from the existing TOPGUN visual materials and keep them centralized as CSS tokens for later replacement.

Recommended provisional tokens:

```css
--bg: #070809;
--surface: #0d0f11;
--surface-2: #13161a;
--text: #f3f4f5;
--muted: #8e949c;
--line: rgba(255,255,255,.10);
--red: #d51f2b;
--red-soft: rgba(213,31,43,.16);
--blue: #2c70a8;
--blue-soft: rgba(44,112,168,.16);
--success: #78a988;
--danger: #c75b5b;
```

## 3. Typography

Use system/local-safe fonts only in Stage 2 unless an approved local font asset already exists in the repository.

Principles:
- strong editorial hierarchy;
- very large scene titles where content density allows;
- compact uppercase technical labels for module/scene state;
- body text remains readable, never shrunk merely to avoid overflow;
- avoid faux-luxury serif everywhere. Typography should feel precise, contemporary and masculine rather than wedding-premium.

## 4. App shell

The experience occupies the viewport.

Desktop:
- app frame should visually reach the screen edges rather than appear as a centered website card;
- current scene is the dominant layer;
- HUD remains sparse and peripheral;
- controlled internal scrolling is allowed only where content genuinely exceeds the scene body.

Mobile / narrow width:
- no document-level horizontal overflow;
- touch targets remain usable;
- titles scale down without becoming tiny;
- substep navigation may horizontally scroll;
- scene body may vertically scroll internally.

## 5. Logo and brand presence

Use the real asset:

`assets/topgun-logo.png`

The logo should appear in Boot and Route and may appear as a restrained HUD mark. Do not repeatedly stamp it into every content panel.

If the raster asset has an undesirable baked background for a given placement, do not invent a vector logo. Use the asset in a context where its background is visually acceptable until a clean official asset is provided.

## 6. Boot

Boot should become a designed opening scene, not a bordered content card.

Composition:
- TOPGUN logo / mark;
- `START` as the main product title;
- short descriptor: onboarding / first shift context;
- trainee name entry if currently required by flow;
- one clear primary action;
- subtle red/blue environmental accents and depth;
- minimal copy.

Motion:
- restrained initial reveal;
- 250–700 ms transitions;
- respect `prefers-reduced-motion`.

## 7. Route

Route is the product’s home scene and should feel like a progression map, not a list of LMS cards.

Six modules remain exactly the same logically.

Desired structure:
- strong vertical or diagonal progression axis;
- module number is a major visual element;
- title and compact state only;
- locked modules visibly recede;
- current module is visually dominant;
- completed state is clear but not celebratory/gamified;
- mentor-unlocked state remains distinct;
- unfinished-content state remains distinct.

Avoid six large rounded rectangles stacked like settings rows.

## 8. Scene shell and HUD

HUD should show only useful orientation:
- TOPGUN / START mark or compact wordmark;
- module number/title;
- scene position/progress;
- route/back control where appropriate.

Do not let the HUD compete with scene content.

Scene shells should not all share one obvious bordered rounded container. Use spacing, contrast, hairline rules and background depth before resorting to cards.

## 9. Scene archetypes

### Manifesto
Full visual emphasis. Minimal controls. Large statement. Current Module 01 manifesto `ДИСЦИПЛИНА ВАЖНЕЕ ТАЛАНТА` should feel like a campaign statement, not a heading inside a panel.

### Learn
Editorial composition. Canonical content can use columns, highlighted rule lines, numbered facts or controlled substeps. Avoid wrapping every paragraph in a panel.

### Decision
Scenario first, choices second. The user should read the situation before seeing options. Choices should feel like operational decisions, not radio buttons copied from a form builder.

### Sorter / disinfection
Keep interaction semantics unchanged. Present the three objects and method choices cleanly. Correct canonical concentration/time appears only after validation, as already required by Stage 1 semantic audit.

### Quiz
One question should own the screen. Strong question number/progress. Options are large readable decision rows. Avoid showing the whole exam as a form page.

### Result
Score and next consequence are primary. No confetti. Incorrect topics can be surfaced clearly for retry.

### Practice Hub
Five skills should read as a professional qualification board, not a checklist widget. The current selected skill can open a detail area without leaving the scene.

### Mentor review
Visually distinguish mentor-controlled actions from trainee interactions. Make status and consequence explicit.

## 10. Interaction states

Every interaction needs intentional states:
- idle;
- hover/focus;
- selected;
- validation error;
- success/completed;
- disabled/read-only.

Do not communicate correctness by color alone. Use text/state/iconography/border treatment as well.

Feedback should be located near the action that produced it and remain stable after rerender.

## 11. Motion

Stage 2 motion is DOM/CSS only.

Allowed:
- scene enter/exit fade + slight translation;
- route emphasis transitions;
- substep change transitions;
- selected-choice and feedback transitions;
- subtle environmental movement using pseudo-elements / gradients / noise-like CSS.

Not in Stage 2:
- Three.js;
- WebGL/WebGPU;
- canvas particle systems;
- 3D camera;
- external CDN animation libraries.

Stage 3 will own 3D/background-world work.

## 12. Accessibility and input

Preserve and improve:
- keyboard navigation;
- visible `:focus-visible`;
- semantic buttons/inputs where they carry behavior;
- `aria-live` feedback already used by renderers;
- usable 390 px layout;
- `prefers-reduced-motion` fallback.

Do not replace functional form controls with inaccessible div-only controls merely for appearance.

## 13. Technical constraints

Must remain:
- HTML/CSS/vanilla JS;
- `file://` launch by double click;
- no fetch requirement;
- no external API;
- no framework migration;
- `topgun-start-progress` unchanged;
- schema version `2` unchanged;
- Module 01/02 completion rules unchanged;
- canonical `content/modules.js`, `content/questions.js`, `content/practice.js`, `content/sources.js` unchanged unless the owner explicitly requests a content correction.

Visual work may change markup/classes in renderers when needed, but must not duplicate canonical facts into UI code.

## 14. Documentation conflict to fix during Stage 2

`AGENTS.md` and `PRODUCT_SPEC.md` currently describe the visual system as `dark graphite, amber accent`. This is obsolete for Stage 2.

Update only their visual-guidance wording to the new direction:

`near-black / graphite base, white typography, TOPGUN red and cold blue accents; no neon cyberpunk or generic SaaS visual language.`

Do not alter functional/product rules in those documents.

## 15. Stage 2 implementation sequence

### Phase A · Foundation
- switch local checkout to `stage2-visual`;
- visual tokens;
- global background;
- typography;
- buttons/fields/focus states;
- app shell/HUD;
- remove amber as primary accent;
- update the two documentation lines described above.

### Phase B · Entry and route
- Boot redesign;
- real logo integration;
- Route redesign;
- responsive route states.

### Phase C · Module scenes
- Manifesto;
- Learn / grouped Learn;
- Decision;
- Disinfection sorter;
- Quiz / Result;
- Practice Hub;
- Mentor review.

### Phase D · Motion and polish
- scene transitions;
- state micro-interactions;
- reduced-motion behavior;
- responsive polish;
- visual consistency audit.

Do not combine Stage 3 into this branch.

## 16. Acceptance criteria

Stage 2 is acceptable when:
- Module 01 and Module 02 retain all Stage 1 behavior;
- full Playwright suite still passes through real `file://`;
- no canonical content files changed;
- no page-level long scroll returns for Module 02;
- no new answer leaks are introduced;
- Boot, Route and scene shell clearly no longer resemble the Stage 1 amber/card LMS UI;
- real TOPGUN logo is visible in the experience;
- visual hierarchy works at desktop and 390 px;
- keyboard interaction and F5 persistence still work;
- reduced-motion is supported;
- no Three.js/WebGPU/canvas/external visual dependency has been added.
