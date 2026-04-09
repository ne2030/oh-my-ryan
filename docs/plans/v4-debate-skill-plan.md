# debate 스킬 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AI 모델(Claude, Gemini, Codex)이 주제를 토론하고 구조화된 노트로 저장하는 debate 스킬 구현

**Architecture:** omc-teams tmux 워커로 Gemini/Codex를 병렬 스폰하고, 파일 기반 통신으로 라운드별 발언을 교환. Claude가 참여자 겸 종합자로서 수렴 판단 후 두괄식 노트를 생성한다.

**Spec:** `docs/plans/v4-debate-skill-design.md`

---

## Chunk 1: 스킬 뼈대 + 핵심 정의

### Task 1: 디렉토리 구조 생성

**Files:**
- Create: `skills/debate/SKILL.md`
- Create: `skills/debate/CHANGELOG.md`
- Create: `skills/debate/references/` (디렉토리)
- Create: `skills/debate/evals/` (디렉토리)
- Create: `insights/debates/` (디렉토리)

- [ ] **Step 1: 디렉토리 생성**

```bash
mkdir -p skills/debate/references
mkdir -p skills/debate/evals
mkdir -p insights/debates
```

- [ ] **Step 2: .claude/skills 심링크 확인**

```bash
ls -la .claude/skills
# 기존에 skills/ → .claude/skills 심링크가 있으므로 debate/ 자동 인식됨
# 심링크가 없으면: ln -s ../skills .claude/skills
```

- [ ] **Step 3: Commit**

```bash
git add skills/debate/ insights/debates/.gitkeep
git commit -m "chore: debate 스킬 디렉토리 구조 생성"
```

---

### Task 2: SKILL.md 작성

**Files:**
- Create: `skills/debate/SKILL.md`

- [ ] **Step 1: SKILL.md 작성**

기존 analyze-source/SKILL.md 형식을 따른다. frontmatter는 `name`, `description`, `version`만.

```markdown
---
name: debate
description: AI 모델(Claude, Gemini, Codex)이 주제를 다각도로 토론하여 구조화된 결론 노트를 생성한다
version: 1
---

# debate

여러 AI 모델이 주어진 주제에 대해 토론하고, 결론과 토론 기록을 구조화된 노트로 저장한다.

## Usage

\`\`\`
/debate "토론 주제"
/debate "토론 주제" --models gemini,codex
/debate "토론 주제" --format debate
/debate "토론 주제" --max-rounds 5
/debate "토론 주제" --lang en
\`\`\`

### 옵션

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `--models` | 참여 모델 지정 (쉼표 구분) | gemini,codex |
| `--format` | 토론 형식 강제 (roundtable, debate, socratic) | 자동 |
| `--max-rounds` | 최대 라운드 수 | 자동 (복잡도 기반) |
| `--lang` | 토론 언어 | ko |

Claude는 항상 참여하며, `--models`는 외부 모델만 지정한다.

## 전체 파이프라인

\`\`\`
1. 주제 분석 (복잡도, 형식, 참여자 결정)
2. 라운드 루프 (tmux 워커 스폰 → 발언 수집 → Claude 발언 → 수렴 판단)
3. 종합 & 저장 (결론 작성 → 노트 저장 → 콘솔 출력)
\`\`\`

---

## Step 1: 주제 분석

주제를 받으면 다음을 판단한다.

### 복잡도 레벨 (1-5)

| 레벨 | 기준 | max round | 예시 |
|------|------|-----------|------|
| 1 | 단순 사실/의견 | 2 | "탭 vs 스페이스" |
| 2 | 양면성 있는 주제 | 3 | "모노레포 vs 멀티레포" |
| 3 | 다각도 분석 필요 | 3 | "AI가 일자리를 대체할 것인가" |
| 4 | 전문 지식 + 맥락 필요 | 4 | "한국 AI 규제 방향성" |
| 5 | 철학적/근본적 논쟁 | 5 | "AGI는 의식을 가질 수 있는가" |

### 토론 형식 자동 선택

`references/format-rules.md`를 참조하여 형식을 결정한다. `--format` 옵션이 있으면 해당 형식을 강제 사용.

| 형식 | 조건 | 설명 |
|------|------|------|
| 라운드테이블 | 기본값 | 자유 의견 → 상호 반응 → 수렴 |
| 디베이트 | 명확한 찬반 가능 시 | 찬성/반대 배정 → 반론 → 재반론 |
| 소크라테스 | "왜", "어떻게" 류 질문 | 질문자 1 + 답변자들 |

### 참여자 확정

- 기본: Claude + Gemini + Codex (3인)
- `--models` 지정 시 해당 모델만 (Claude는 항상 포함)
- 지원 모델: `gemini`, `codex`. 미지원 ID 입력 시 에러 + 목록 출력
- 최소 참여자: 2명 (Claude + 외부 1명)

### 콘솔 출력

\`\`\`
🎯 주제: {주제}
📊 복잡도: {N}/5 | 형식: {형식} | max: {N}라운드
👥 참여자: Claude, Gemini, Codex
\`\`\`

## Step 2: 라운드 루프

각 라운드를 반복 실행한다. `references/worker-prompts.md`의 템플릿을 사용한다.

### 세션 디렉토리 생성

\`\`\`
/tmp/debate-{session-id}/
├── topic.md
├── round-{n}/
│   ├── prompt.md
│   ├── gemini.md
│   ├── codex.md
│   └── claude.md
\`\`\`

### 라운드 실행 흐름

1. **prompt.md 작성** — 주제 + 이전 맥락 + 이번 라운드 요청
2. **tmux 워커 스폰** — omc-teams로 Gemini/Codex 동시 실행, 각자 파일에 출력
3. **발언 수집 대기** — 파일 존재 + 크기 > 0 확인, 5초 폴링, 120초 타임아웃
4. **Claude 발언** — 다른 참여자 발언을 읽고 자기 의견 작성
5. **수렴 판단** — `references/convergence.md` 기준에 따라 판단

### 실패 처리

| 실패 유형 | 복구 |
|-----------|------|
| 워커 타임아웃 | 해당 워커 스킵, 나머지로 속행 |
| 워커 크래시 | 1회 재시도 → 실패 시 스킵 |
| 쓰레기 출력 | Claude가 판단, 해당 발언 무시 |
| 전원 실패 | 토론 중단 + 에러 메시지 |
| 1명만 남음 | Claude + 1명으로 속행 (최소 2인) |

### 콘솔 출력 (라운드별)

\`\`\`
🔄 라운드 {N}/{max} 진행 중... (Gemini ✅ Codex ⏳)
✅ 라운드 {N} 완료 — {수렴/미수렴}
   Claude: {핵심 주장 1줄}
   Gemini: {핵심 주장 1줄}
   Codex: {핵심 주장 1줄}
\`\`\`

## Step 3: 종합 & 저장

### 노트 생성

`insights/debates/YYYY-MM-DD-주제키워드.md`에 두괄식 노트를 생성한다.

**frontmatter:**

\`\`\`yaml
title: "주제"
debate_format: 라운드테이블
participants: [claude, gemini, codex]
complexity: 3
rounds: 3
convergence: true
date: YYYY-MM-DD
tags: [태그1, 태그2]
skill: debate
skill_version: 1
eval_scores: {논점다양성: N, 수렴품질: N, 결론정당성: N, 균형표현: N, 기록가독성: N}
\`\`\`

**본문 구조 (두괄식):**

1. `## 결론` — 2-3문장
2. `## 핵심 근거` — 번호 리스트
3. `## 합의 & 이견` — 논점별 참여자 입장 테이블
4. `## 토론 기록` — 라운드별 발언 + 소결

### 품질 등록

- `insights/_quality/tracker.md`에 행 추가: `| 파일명 | 버전 | 논점다양성 | 수렴품질 | 결론정당성 | 균형표현 | 기록가독성 | 평균 | 날짜 |`

### 임시 파일 정리

\`\`\`bash
rm -rf /tmp/debate-{session-id}/
\`\`\`

### 콘솔 출력 (최종)

\`\`\`
📝 노트 저장: insights/debates/YYYY-MM-DD-주제키워드.md

────────────────────────────────
결론: {결론 요약 1-2문장}
합의 {N}건 / 이견 {N}건 / 라운드 {N}회
────────────────────────────────
\`\`\`

## 자가평가 루브릭

baseline: 3.5 / 5

| 항목 | 1 | 3 | 5 |
|------|---|---|---|
| **논점 다양성** | 한 가지 관점만 반복 | 2-3개 관점 제시 | 다각도 + 예상 못한 관점 포함 |
| **수렴 품질** | 억지 합의 또는 수렴 실패 | 주요 쟁점에서 자연스러운 합의 | 합의와 이견이 모두 명확 구분 |
| **결론 정당성** | 토론 내용과 결론 불일치 | 토론에서 도출 가능한 결론 | 근거 명확, 결론이 필연적 |
| **균형 표현** | 한 모델 의견이 지배적 | 각 모델 비중 대체로 균등 | 모든 참여자 고유 기여 명확 |
| **기록 가독성** | 기록만으로 흐름 파악 불가 | 라운드 소결로 추적 가능 | 두괄식 + 합의표 + 기록 일관 |
```

- [ ] **Step 2: 파일이 올바른 frontmatter를 가지는지 확인**

파일 첫 줄이 `---`로 시작하고, `name: debate`, `description:`, `version: 1` 필드가 있는지 확인.

- [ ] **Step 3: Commit**

```bash
git add skills/debate/SKILL.md
git commit -m "feat: debate 스킬 SKILL.md 작성"
```

---

### Task 3: CHANGELOG.md 작성

**Files:**
- Create: `skills/debate/CHANGELOG.md`

- [ ] **Step 1: CHANGELOG.md 작성**

```markdown
# debate 변경 이력

## v1 — 2026-03-20
- 최초 버전
- 3가지 토론 형식 (라운드테이블, 디베이트, 소크라테스)
- omc-teams tmux 워커 기반 멀티모델 토론
- 수렴 기반 종료 + 동적 max round
- 5항목 자가평가 루브릭
```

- [ ] **Step 2: Commit**

```bash
git add skills/debate/CHANGELOG.md
git commit -m "docs: debate 스킬 CHANGELOG.md 추가"
```

---

## Chunk 2: 레퍼런스 문서

### Task 4: references/format-rules.md 작성

**Files:**
- Create: `skills/debate/references/format-rules.md`

- [ ] **Step 1: format-rules.md 작성**

토론 형식별 선택 기준과 프롬프트 가이드를 정의한다.

```markdown
# 토론 형식 규칙

## 형식 자동 선택

주제를 분석하여 아래 기준으로 형식을 결정한다.

### 선택 기준

| 형식 | 트리거 조건 | 예시 주제 |
|------|------------|-----------|
| **라운드테이블** | 기본값. 다음 조건에 해당하지 않으면 라운드테이블 | "AI 에이전트의 미래", "최적의 개발 워크플로우" |
| **디베이트** | 주제가 "A vs B", "~해야 하는가", "찬반" 구조 | "모노레포 vs 멀티레포", "AI 규제가 필요한가" |
| **소크라테스** | 주제가 "왜 ~인가", "어떻게 ~하는가", "~의 본질" 구조 | "왜 오픈소스가 이기는가", "의식의 본질이란" |

### 복합 판단

- 디베이트와 소크라테스 조건이 모두 해당 → 디베이트 우선
- `--format` 옵션 있으면 자동 선택 무시

---

## 형식별 라운드 가이드

### 라운드테이블

**라운드 1**: 자유 의견
- 각 참여자가 주제에 대해 자유롭게 의견 제시
- 구조 제한 없음, 자신의 관점에서 핵심 논점 제시

**라운드 2+**: 상호 반응
- 이전 라운드의 다른 참여자 발언에 대해 반응
- 동의, 반박, 보완, 새로운 관점 추가
- 미해결 쟁점에 집중

**마지막 라운드**: 최종 입장 정리
- 토론을 통해 변화된/확인된 최종 입장 제시
- 합의 가능 지점과 이견 지점 명시

### 디베이트

**참여자 배정**: Claude가 주제를 분석하여 찬/반 배정
- 3인: 찬성 1 + 반대 1 + Claude(반대편 or 중재)
- 2인: 찬성 1 + 반대 1 (Claude는 반대편)

**라운드 1**: 입론
- 각 진영이 핵심 주장 + 근거 제시
- 상대 발언은 아직 보지 않은 상태

**라운드 2**: 반론
- 상대 입론을 읽고 구체적 반박
- 자기 주장 보강

**라운드 3+**: 재반론 / 수렴
- 미해결 쟁점에 대한 추가 논증
- 합의 가능 지점 탐색

**마지막 라운드**: 최종 변론
- 핵심 논거 정리, 왜 자기 입장이 더 타당한지

### 소크라테스

**질문자 배정**: Claude가 질문자 역할

**라운드 1**: 핵심 질문 제시
- Claude가 주제의 핵심을 찌르는 질문 2-3개 제시
- 다른 참여자가 각자 답변

**라운드 2+**: 후속 질문
- Claude가 답변의 전제, 모순, 빈틈을 파고드는 후속 질문
- 다른 참여자가 답변 심화

**마지막 라운드**: 종합 질문
- "그렇다면 결국 ~인가?" 형태의 종합 질문
- 각 참여자 최종 답변
```

- [ ] **Step 2: Commit**

```bash
git add skills/debate/references/format-rules.md
git commit -m "docs: debate 토론 형식 규칙 레퍼런스 추가"
```

---

### Task 5: references/convergence.md 작성

**Files:**
- Create: `skills/debate/references/convergence.md`

- [ ] **Step 1: convergence.md 작성**

수렴 판단 알고리즘의 상세 기준을 정의한다.

```markdown
# 수렴 판단 기준

## 개요

각 라운드 종료 후 Claude가 수렴 여부를 판단한다. 수렴 or max round 도달 시 토론을 종료한다.

## 알고리즘

### 1단계: 논점 추출

각 참여자 발언에서 `{논점, 입장}` 쌍을 추출한다.

입장 분류:
- **찬성** — 명확히 동의/지지
- **반대** — 명확히 반대/비판
- **조건부** — 조건 하에 동의 ("~라면 찬성")
- **중립** — 명확한 입장 없이 분석만

예시:
```
라운드 1:
  Claude:  {일자리 대체: 조건부} {창의 영역: 반대}
  Gemini:  {일자리 대체: 반대} {신규 직업: 찬성}
  Codex:   {전환 속도: 찬성} {재교육: 찬성}
```

### 2단계: 라운드 간 비교 (라운드 2+)

이전 라운드와 현재 라운드의 논점 맵을 비교한다.

**비교 항목:**
1. **새 논점 등장 수** — 이전 라운드에 없던 논점 개수
2. **입장 변화** — 같은 논점에서 참여자 입장이 변했는가
3. **명시적 동의** — "동의한다", "맞다", "그 점은 인정" 등의 표현

### 3단계: 수렴 조건

다음 **모두** 충족 시 수렴:
- 새로운 논점이 0개
- 기존 논점의 **2/3 이상**에서 참여자 입장이 일치 또는 조건부 동의

**일치 판정:**
- 찬성 + 찬성 = 일치
- 찬성 + 조건부 = 일치 (조건부를 동의로 간주)
- 찬성 + 반대 = 불일치
- 찬성 + 중립 = 불일치 (중립은 합의에 미포함)

### 4단계: 미수렴 시 처리

미수렴이면 다음 라운드 prompt에 미해결 쟁점을 명시:

```
## 미해결 쟁점
1. {논점 A} — Claude: 조건부, Gemini: 반대 (입장 차이)
2. {논점 B} — 새로 등장한 논점, 아직 충분한 논의 없음

이 쟁점들에 대해 집중적으로 반응해 주세요.
```

## 특수 상황

| 상황 | 판단 |
|------|------|
| 라운드 1 | 항상 미수렴 (비교 대상 없음) |
| 참여자 2명만 남음 | 2/3 대신 2/2 합의 필요 |
| 모든 논점 불일치 | 미수렴, 이견이 많다는 것을 명시 |
| max round 도달 | 수렴 여부와 관계없이 종료, `convergence: false` 기록 |
```

- [ ] **Step 2: Commit**

```bash
git add skills/debate/references/convergence.md
git commit -m "docs: debate 수렴 판단 기준 레퍼런스 추가"
```

---

### Task 6: references/worker-prompts.md 작성

**Files:**
- Create: `skills/debate/references/worker-prompts.md`

- [ ] **Step 1: worker-prompts.md 작성**

Gemini/Codex 워커에 전달하는 프롬프트 템플릿을 정의한다.

```markdown
# 워커 프롬프트 템플릿

## 프롬프트 구조

각 워커에 전달되는 prompt.md의 구조:

```
# 토론 주제
{주제}

# 당신의 역할
당신은 이 주제에 대해 독립적으로 의견을 제시하는 토론 참여자입니다.

## 토론 형식
{라운드테이블|디베이트|소크라테스}

## 형식별 지시
{format-rules.md에서 해당 형식의 라운드별 가이드 삽입}

## 이번 라운드
라운드 {N}/{max}

# 이전 라운드 요약 (라운드 2+)
{이전 라운드 참여자별 발언 요약}

# 미해결 쟁점 (라운드 2+)
{convergence.md에서 추출한 미해결 논점 목록}

# 요청
{라운드별 요청}

# 출력 형식
- 핵심 주장 1줄 요약으로 시작 (첫 줄을 콘솔 요약에 사용함)
- 근거를 구체적으로 제시
- 500자 내외
- 언어: {ko|en}
```

## 라운드별 요청 문구

### 라운드 1
```
이 주제에 대한 당신의 의견을 자유롭게 제시해 주세요.
핵심 논점과 근거를 명확히 밝혀 주세요.
```

### 라운드 2+
```
이전 라운드의 다른 참여자 발언을 읽고 반응해 주세요.
동의, 반박, 보완 모두 가능합니다.
특히 미해결 쟁점에 집중해 주세요.
```

### 마지막 라운드
```
이것이 마지막 라운드입니다.
토론을 통해 확인/변화된 최종 입장을 정리해 주세요.
합의 가능한 지점과 여전히 이견인 지점을 명시해 주세요.
```

## 디베이트 형식 추가 지시

찬성 진영:
```
당신은 이 주제에 대해 **찬성** 입장입니다.
찬성 논거를 최대한 강력하게 제시하세요.
```

반대 진영:
```
당신은 이 주제에 대해 **반대** 입장입니다.
반대 논거를 최대한 강력하게 제시하세요.
```

## 소크라테스 형식 추가 지시

답변자:
```
Claude가 제시한 질문에 대해 깊이 있게 답변해 주세요.
표면적 답변이 아니라, 전제와 함의를 고려한 답변을 부탁합니다.
```

## 발언 추출 규칙

워커 출력 파일에서 핵심 주장 1줄을 추출하는 규칙:
- 출력의 **첫 번째 줄** (빈 줄, 마크다운 헤더 제외)을 핵심 주장으로 사용
- 콘솔 라운드 요약에 표시
```

- [ ] **Step 2: Commit**

```bash
git add skills/debate/references/worker-prompts.md
git commit -m "docs: debate 워커 프롬프트 템플릿 레퍼런스 추가"
```

---

## Chunk 3: 평가 체계 + 마무리

### Task 7: evals/evals.json 작성

**Files:**
- Create: `skills/debate/evals/evals.json`

- [ ] **Step 1: evals.json 작성**

analyze-source의 evals.json 패턴을 따른다.

```json
{
  "skill_name": "debate",
  "evals": [
    {
      "id": 1,
      "prompt": "/debate \"탭 vs 스페이스\"",
      "expected_output": "복잡도 1-2, 라운드 2-3, 디베이트 형식 선택, 수렴 도달",
      "expectations": [
        "insights/debates/ 디렉토리에 .md 파일이 생성됨",
        "파일명이 YYYY-MM-DD-*.md 패턴을 따름",
        "frontmatter에 debate_format 필드 포함",
        "frontmatter에 participants 배열 포함 (최소 2개 모델)",
        "frontmatter에 complexity 필드가 1 또는 2",
        "frontmatter에 skill: debate 포함",
        "frontmatter에 skill_version 정수값 포함",
        "frontmatter에 eval_scores 객체 포함 (5개 항목)",
        "'결론' 섹션이 존재하고 2문장 이상",
        "'핵심 근거' 섹션이 존재하고 번호 리스트 포함",
        "'합의 & 이견' 섹션에 테이블이 존재하고 참여자별 입장 포함",
        "'토론 기록' 섹션에 최소 2개 라운드 기록",
        "각 라운드에 '라운드 소결' 소섹션 존재"
      ]
    },
    {
      "id": 2,
      "prompt": "/debate \"AGI는 의식을 가질 수 있는가\"",
      "expected_output": "복잡도 4-5, 라운드 4-5, 라운드테이블 또는 소크라테스 형식",
      "expectations": [
        "insights/debates/ 디렉토리에 .md 파일이 생성됨",
        "frontmatter에 complexity 필드가 4 또는 5",
        "frontmatter에 rounds 필드가 3 이상",
        "frontmatter에 skill: debate, skill_version, eval_scores 포함",
        "'결론' 섹션에서 토론 기록의 논점이 반영됨",
        "'핵심 근거' 섹션에 3개 이상 논점",
        "'합의 & 이견' 테이블에 '이견' 상태 논점이 최소 1개 존재",
        "'토론 기록'에 라운드별 참여자 발언이 모두 기록됨",
        "각 참여자 발언이 서로 다른 관점을 제시 (동일 내용 반복이 아님)"
      ]
    },
    {
      "id": 3,
      "prompt": "/debate \"모노레포 vs 멀티레포\" --format debate --max-rounds 3",
      "expected_output": "디베이트 형식 강제, 3라운드, 찬반 배정",
      "expectations": [
        "insights/debates/ 디렉토리에 .md 파일이 생성됨",
        "frontmatter에 debate_format: 디베이트 (또는 debate)",
        "frontmatter에 rounds 필드가 3",
        "'토론 기록'에서 참여자가 찬성/반대 진영으로 나뉘어 발언",
        "라운드 1에서 각 진영의 입론이 제시됨",
        "라운드 2에서 상대 입론에 대한 반론이 포함됨",
        "frontmatter에 skill: debate, eval_scores 포함"
      ]
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add skills/debate/evals/evals.json
git commit -m "test: debate 스킬 evals.json 추가"
```

---

### Task 8: CLAUDE.md 구조 업데이트

**Files:**
- Modify: `CLAUDE.md` — `insights/debates/` 폴더를 구조에 추가

- [ ] **Step 1: CLAUDE.md의 구조 섹션에 debates 폴더 추가**

`## 구조` 섹션의 `insights/` 하위에 `debates/` 추가:

```
├── insights/
│   ├── sources/       # 원본 소스 노트
│   ├── analysis/      # 분석 노트
│   ├── debates/       # 토론 노트 (debate 스킬 산출물)
│   ├── repos/         # 레포 DNA 상세 분석
│   ├── catalogs/      # 교차 프로젝트 패턴 카탈로그
│   ├── _templates/    # 소스/분석 노트 템플릿
│   └── index.md       # 분석 노트 인덱스
```

- [ ] **Step 2: 핵심 워크플로우 섹션에 토론 워크플로우 추가**

```markdown
### AI 토론
주제 제공 → `/debate` 스킬로 토론 → 결론 + 토론 기록 노트 생성
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md에 debate 스킬 구조 및 워크플로우 추가"
```

---

### Task 9: 전체 검증 + 최종 커밋

- [ ] **Step 1: 파일 구조 확인**

```bash
find skills/debate -type f | sort
# 예상 출력:
# skills/debate/CHANGELOG.md
# skills/debate/SKILL.md
# skills/debate/evals/evals.json
# skills/debate/references/convergence.md
# skills/debate/references/format-rules.md
# skills/debate/references/worker-prompts.md
```

- [ ] **Step 2: SKILL.md frontmatter 검증**

```bash
head -5 skills/debate/SKILL.md
# 예상:
# ---
# name: debate
# description: AI 모델(Claude, Gemini, Codex)이 주제를 다각도로 토론하여 구조화된 결론 노트를 생성한다
# version: 1
# ---
```

- [ ] **Step 3: evals.json JSON 유효성 검증**

```bash
python3 -c "import json; json.load(open('skills/debate/evals/evals.json')); print('Valid JSON')"
```

- [ ] **Step 4: .claude/skills 심링크에서 debate 스킬 인식 확인**

```bash
ls -la .claude/skills/debate/SKILL.md
# 심링크 경로를 통해 접근 가능해야 함
```

- [ ] **Step 5: 드라이런 — /debate 호출 테스트**

간단한 주제로 스킬을 실행하여 전체 파이프라인이 동작하는지 확인:

```
/debate "탭 vs 스페이스"
```

확인 항목:
- Step 1 (주제 분석) 출력이 콘솔에 표시되는가
- tmux 워커가 정상 스폰되는가
- 라운드별 발언이 수집되는가
- 최종 노트가 `insights/debates/`에 생성되는가
- frontmatter가 올바른가
- 두괄식 구조가 지켜지는가
