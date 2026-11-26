---
name: rg-visual-explainer
description: Use when designing, embedding, or reviewing visual explanations, SVG diagrams, Before/After mechanism views, case-flow comparisons, or explanatory cards inside dashboards, issue boards, web apps, or documents. Triggers when the user asks to visualize how something works, why an issue happens, how options compare, or complains that diagrams look like text-in-boxes, cryptic icons, spaghetti flowcharts, or repetitive tables/cards.
---

# rg-visual-explainer (v1.2.0)

Read `core.md` completely and follow its workflow:
1. **인과 완결 & 독자 배경 보완 (0절)**: 중간 인과 고리·전제 생략 금지, 원래 의도 vs 오발 대비, 내부 용어·식별자(`q029` 등 내부 시험 번호 포함)를 실제 사례 이름으로 번역.
2. **1장면 콘티(`<desc>`) · 문제/해결 분리 · 다중 원인 분해 (1절)**:
   - `<desc>`는 도형 부품 배치 명세서가 아니라 **독자가 깨닫는 단 하나의 사건 장면**을 1~2문장으로 먼저 쓴다.
   - 원리·원인 도식은 **“지금 어디서 왜 깨졌는가”에만 집중**하고, `고친 뒤 / 게이트 적용 시 / 목표 화면` 같은 해결안을 같은 그림에 Y자로 합치지 않는다.
   - 원인이 2개 이상이면 한 그림에 구겨 넣지 않고 **`[간단한 전체 현상 1개] + [원인별 독립 도식]`**으로 분해한다.
   - 원리·원인을 설명하는 자리에 “구현 완료 / 기준 미정 / 체크리스트” 같은 상태 요약 HTML 카드로 도망치지 않는다.
3. **글·그림 역할 분리 & 색상 절제 (2~4절)**: 서술 문장은 HTML `<p>`/`<figcaption>`, SVG 안은 짧은 명사구·실제 값만; 빨간색은 핵심 결함 1~2곳에만 절제해 시선 집중.
4. **자동 린트 + 전수 렌더 8항목 검수 (5절 + `references/visual-gate.md`)**: `scripts/lint-visuals.mjs` 위반 0건 통과 후 수정한 모든 항목의 스크린샷을 눈으로 검수(충돌 0건, 문제/해결 분리, 빨강 절제, 독자 반문 테스트).

Before drawing SVGs, run `node <skill-root>/scripts/read-patterns.mjs --list` (or `node skills/rg-visual-explainer/scripts/read-patterns.mjs --list`) to load the shared visual design tokens and pattern catalog. Before finishing, run `node <skill-root>/scripts/lint-visuals.mjs <file>` and audit every rendered `[도입 문단 + SVG 도식 + 캡션]` set against `references/visual-gate.md`.

> **유지보수 규칙**: 이 스킬의 버전·원칙·파일 구성을 업데이트할 때는 같은 폴더의 `overview.html`도 반드시 함께 갱신한다.
