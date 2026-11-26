---
name: rg-visual-explainer
description: Use when designing, embedding, or reviewing visual explanations, SVG diagrams, architecture/workflow views, Before/After comparisons, or root-cause diagrams inside dashboards, issue boards, portfolios, web apps, or documents. Triggers when the user asks to visualize how something works, why an issue happens, how options compare, or complains that diagrams look like text-in-boxes, cryptic icons, or repetitive flowcharts.
---

# rg-visual-explainer

Read `core.md` completely and follow its workflow:

1. **공통 기본 원칙 (모든 시각화 — 0~4절)**:
   - **조건부 1턴 인터뷰**: 목적·독자·원하는 톤이 모호할 때만 1~2문항으로 짧게 확인하고, 이미 분명하면 바로 진행한다.
   - **독자 기준 번역**: 내부 식별자·코드 변수·약어·설명 없는 전제를 그대로 던지지 않고, 배경 지식이 없는 독자도 이해할 수 있는 구체적 사례와 쉬운 말로 푼다.
   - **1장면 콘티(`<desc>`) 우선**: 도형 부품 배치 명세서 대신, 독자가 단박에 깨달아야 할 **단 하나의 핵심 장면·대비**를 1~2문장으로 먼저 쓴다.
   - **디폴트 퀄리티 + 톤 변주**: 기본은 `read-patterns.mjs` 토큰으로 안정적인 퀄리티를 잡되, 기존 문서·브랜드 팔레트와 폰트에 맞춰 자유롭게 변주한다(강조색 절제·의미 일치 유지).
2. **유형별 적용 규칙 (해당 주제일 때만 적용 — 1-B절)**:
   - **원인·결함 해부**: “지금 어디서 왜 깨졌는가”에만 집중하고 해결안을 같은 그림에 Y자로 섞지 않는다. 원인이 2개 이상이면 `[전체 현상 1개 + 원인별 독립 도식]`으로 분해하고, 진행 현황표 카드로 때우지 않는다.
   - **시스템·아키텍처·현장 프로세스**: 추상 단계 이름표(`A → B → C → D`) 나열 대신 **실제 입력 1건의 변환·분기·계층 호출**이나 **물리 사물·작업자·공간 배치**를 직접 그린다.
   - **수치·비교·집합**: 축·기준선·비율 막대·점 격자·포함 경계로 위치와 길이 자체가 의미를 말하게 한다.
3. **자동 린트 + 전수 렌더 검수 (5절 + `references/visual-gate.md`)**:
   - `scripts/lint-visuals.mjs` 위반 0건 통과 후, 수정한 모든 항목의 렌더링 스크린샷을 눈으로 검수한다.

Before drawing SVGs, run `node <skill-root>/scripts/read-patterns.mjs --list` to load shared visual design tokens. Before finishing, run `node <skill-root>/scripts/lint-visuals.mjs <file>` and audit every rendered `[도입 문단 + SVG 도식 + 캡션]` set against `references/visual-gate.md`.
