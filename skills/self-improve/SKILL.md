---
name: self-improve
description: 분석 스킬의 품질을 추적하고 회귀 테스트와 개선 제안을 수행한다. skill-creator 플러그인의 grader/comparator/analyzer 에이전트를 활용한다.
version: 2
---

# self-improve

분석 스킬(analyze-source, analyze-repo)의 품질을 체계적으로 추적·평가·개선한다.
skill-creator 플러그인의 eval 엔진을 활용하되, 도메인 특화 루브릭과 추적 시스템으로 래핑한다.

## Usage

```
/self-improve eval [--scope all|recent|<파일명>]
/self-improve regression
/self-improve improve
```

## 의존성

- **skill-creator 플러그인** 필수 (`claude plugins list`로 확인)
- 에이전트 경로: `.claude/plugins/cache/claude-plugins-official/skill-creator/*/skills/skill-creator/agents/`
  - `grader.md` — assertion 체크 + claims 추출
  - `comparator.md` — 블라인드 A/B 비교
  - `analyzer.md` — 패턴 분석 + 개선 제안

---

## eval 모드 (품질 평가)

분석 노트의 품질을 assertion 기반 + 루브릭 보조로 평가한다.

### 절차

1. **대상 선정**
   - `--scope all`: `insights/analysis/` 전체
   - `--scope recent`: 최근 7일 이내 생성 노트
   - `--scope <파일명>`: 특정 노트 1개
   - 기본값: `recent`

2. **assertion 평가** (객관적 검증)
   - 노트의 `skill` frontmatter를 확인하여 해당 evals.json 로드
     - analyze-source: `skills/analyze-source/evals/evals.json`
     - analyze-repo: `skills/analyze-repo/evals/evals.json`
   - 각 노트에 대해 evals.json의 expectations를 기반으로 구조 검증
   - **grader 에이전트 spawn**: skill-creator의 `agents/grader.md` 프롬프트로 서브에이전트 실행
     - inputs: expectations 목록, 노트 파일 경로(transcript 대신), 출력 디렉토리
     - grader가 각 expectation에 대해 PASS/FAIL + evidence 판정
     - grader가 implicit claims도 추출하여 검증
   - 결과를 `insights/_quality/reports/eval-runs/iteration-{N}/eval-{노트명}/grading.json`에 저장

3. **루브릭 보조 평가** (주관적 품질)
   - **references/eval-rubrics.md** 의 루브릭을 참조하되 독립 채점이 아닌, grader가 추출한 claims를 evidence로 활용
   - claims에서 루브릭 항목별 근거를 매핑:
     - 인사이트 유용성 ← "핵심 인사이트 섹션이 원본 핵심을 충분히 포착" 류의 claims
     - 계층 분류 ← "원칙/사례/프레임 분류가 적절" 류의 claims
     - 실행 가능성 ← "하네스 적용 제안이 구체적" 류의 claims
     - 근거 충분성 ← URL 포함 여부 assertions + "출처 검증" claims
     - 연결 의미성 ← wikilink assertions + "연결 근거 설명" claims
   - evidence 기반으로 1-5점 채점 (주관 최소화)

4. **메트릭 수집**
   - grading의 `pass_rate` 산출 (PASS 수 / 전체 expectations 수)
   - 가능하면 `tokens`, `duration_s` 기록 (서브에이전트 실행 시)
   - `timing.json`으로 저장

5. **집계 통계 산출**
   - 버전별 평균 (같은 skill_version 끼리)
   - 깊이별 평균 (A/B/C 각각)
   - pass_rate 분포

6. **tracker 업데이트**
   - `insights/_quality/tracker.md` 테이블의 해당 행에 점수 + pass_rate 채움
   - 노트 frontmatter의 `eval_scores`도 업데이트

7. **리포트 생성**
   - 출력: `insights/_quality/reports/eval-YYYY-MM-DD.md`

### eval 리포트 구조

```markdown
# 품질 평가 리포트 — YYYY-MM-DD

## 전체 요약
- 평가 대상: N개 노트
- 전체 pass_rate: XX%
- 전체 루브릭 평균: X.X / 5.0
- 기준선(3.5) 미달: N개

## Assertion 결과

| 노트 | pass_rate | 실패 항목 |
|------|-----------|-----------|

## 버전별 품질

| 스킬 | 버전 | 노트 수 | pass_rate | 루브릭 평균 |
|------|------|--------|-----------|-----------|

## 깊이별 품질

| 깊이 | 노트 수 | pass_rate | 루브릭 평균 |
|------|--------|-----------|-----------|

## 기준선 미달 노트

| 파일명 | pass_rate | 루브릭 평균 | 약한 항목 |
|--------|-----------|-----------|-----------|

## 메트릭

| 항목 | 값 |
|------|-----|
| 총 tokens | |
| 총 duration | |
| 평균 tokens/노트 | |

## 추이 (이전 eval 대비)
- 이전 eval: [날짜] pass_rate XX%, 루브릭 X.X
- 현재: pass_rate XX%, 루브릭 X.X
- 변화: [상승/하락/유지]
```

---

## regression 모드 (회귀 테스트)

스킬 변경 후 품질 회귀가 없는지, 블라인드 비교로 검증한다.

### 절차

1. **기준 노트 로드**
   - `insights/_quality/golden-notes.md`에서 골든 노트 목록 읽기
   - 목록이 비어있으면 안내 메시지 출력 후 종료

2. **서브에이전트 재분석**
   - 각 골든 노트의 원본 소스 파일(`insights/sources/` 에서 동일 이름) 읽기
   - 현재 스킬 버전으로 **서브에이전트에서 재분석** 실행 (skill-creator의 with_skill 패턴)
     - 실제 파일 시스템에 쓰지 않고, 재분석 결과를 격리된 출력 디렉토리에 저장
   - 재분석 결과를 `insights/_quality/reports/regression-runs/{골든노트명}-v{N}/reanalysis/`에 저장

3. **블라인드 비교**
   - **comparator 에이전트 spawn**: skill-creator의 `agents/comparator.md` 프롬프트로 실행
     - output_a: 골든 노트 (원본)
     - output_b: 재분석 결과
     - A/B 할당을 랜덤으로 (편향 방지)
     - eval_prompt: 해당 소스의 원본 분석 요청
     - expectations: evals.json의 해당 expectations
   - comparator가 rubric 생성 → 양쪽 채점 → winner 판정
   - 결과를 `comparison.json`으로 저장

4. **회귀 판정**
   - comparator의 winner 판정 기준:
     - 골든 노트가 winner 또는 TIE → **PASS**
     - 재분석 결과가 winner이면서 점수 차 0.5 미만 → **PASS** (개선)
     - 재분석 결과가 loser → **REGRESSION**
   - assertion pass_rate도 보조 지표로 확인

5. **REGRESSION 시 원인 분석**
   - **analyzer 에이전트 spawn**: skill-creator의 `agents/analyzer.md` 프롬프트로 실행
     - winner/loser 스킬 경로, 비교 결과, 트랜스크립트 제공
   - analyzer가 약점 분석 + 개선 제안 생성
   - 결과를 `analysis.json`으로 저장

6. **리포트 생성**
   - 출력: `insights/_quality/reports/regression-YYYY-MM-DD.md`

### regression 리포트 구조

```markdown
# 회귀 테스트 리포트 — YYYY-MM-DD

## 테스트 환경
- analyze-source: v{N} (변경사항: ...)
- analyze-repo: v{N} (변경사항: ...)

## 결과 요약
- PASS: N개
- REGRESSION: N개

## 노트별 상세

### {골든노트명}
- **comparator 판정**: A wins / B wins / TIE
- **winner**: 골든 노트 / 재분석 / 동점
- **판정**: PASS / REGRESSION

| 기준 | 골든 노트 | 재분석 | 차이 |
|------|-----------|--------|------|

#### REGRESSION 원인 (해당 시)
- analyzer 분석 요약
- 개선 제안

## assertion pass_rate 비교

| 골든 노트 | 골든 pass_rate | 재분석 pass_rate | 변화 |
|-----------|---------------|-----------------|------|
```

---

## improve 모드 (개선 제안)

eval + regression 데이터를 분석하여 구체적 스킬 개선 방향을 제안한다.

### 절차

1. **데이터 로드**
   - 최신 eval 리포트 + grading.json 파일들 읽기
   - 최신 regression 리포트 + comparison.json/analysis.json 읽기
   - 없으면 `eval --scope all` 먼저 실행

2. **패턴 분석** (skill-creator analyzer 패턴 적용)
   - grading.json의 실패 assertions에서 공통 패턴 추출
     - "어떤 expectation이 반복적으로 실패하는가"
     - "특정 깊이/유형에서만 실패하는 패턴이 있는가"
   - grader가 추출한 claims에서 품질 약점 패턴 추출
   - comparator의 loser 약점 분석 (regression 결과가 있을 때)
   - 루브릭 항목별 평균 추이

3. **원인 분석**
   - 현재 스킬 파일(SKILL.md + references/) 전체 읽기
   - 실패 패턴 ↔ 스킬 지시사항 교차 매핑
   - "지시사항이 부족한가" vs "지시사항은 있지만 불명확한가" 판별
   - evals.json의 expectations 자체 품질도 평가 (grader의 eval critique 활용)

4. **개선 제안 생성**
   - 각 제안에 구조화된 필드:
     - `priority`: high / medium / low
     - `category`: instruction | assertion | template | reference | description
     - `expected_impact`: 어떤 metrics가 얼마나 개선될지 예측
   - 우선순위순 정렬 (영향도 × 실현 용이성)
   - **Description Optimization 제안** 포함: 스킬 트리거 정확도 개선 방향

5. **리포트 생성**
   - 출력: `insights/_quality/reports/improve-YYYY-MM-DD.md`

### improve 리포트 구조

```markdown
# 개선 제안 리포트 — YYYY-MM-DD

## 데이터 기반

### Assertion 실패 패턴
| expectation | 실패 횟수 | 관련 노트 |
|-------------|----------|----------|

### 루브릭 약한 영역
| 항목 | 전체 평균 | 가장 약한 조건 |
|------|-----------|---------------|

### Grader Claims 요약
- [추출된 주요 품질 이슈]

## 개선 제안

### 1. [제안 제목]
- **priority**: high/medium/low
- **category**: instruction/assertion/template/reference/description
- **현재 상태**: [약한 점 + 데이터]
- **제안**: [구체적 변경 내용]
- **수정 대상**: [파일 경로]
- **expected_impact**: [어떤 metrics가 개선될지]

### 2. ...

## Description Optimization
- 현재 description: "..."
- 개선 제안: "..."
- 이유: [트리거 정확도 개선 근거]

## 적용 시 예상 버전
- analyze-source: v{현재} → v{다음}
- analyze-repo: v{현재} → v{다음}
```

---

## workspace 구조

eval/regression 실행 결과의 저장 구조:

```
insights/_quality/
├── tracker.md                    # 마스터 추적 테이블
├── golden-notes.md               # 회귀 테스트 기준 노트
├── reports/
│   ├── eval-YYYY-MM-DD.md        # eval 리포트
│   ├── regression-YYYY-MM-DD.md  # regression 리포트
│   ├── improve-YYYY-MM-DD.md     # improve 리포트
│   ├── eval-runs/                # grader 실행 결과
│   │   └── iteration-{N}/
│   │       └── eval-{노트명}/
│   │           ├── grading.json  # assertion 결과 + claims
│   │           └── timing.json   # tokens, duration
│   └── regression-runs/          # comparator 실행 결과
│       └── {골든노트명}-v{N}/
│           ├── reanalysis/       # 재분석 결과물
│           ├── comparison.json   # 블라인드 비교 결과
│           └── analysis.json     # post-hoc 원인 분석
└── evals/                        # 테스트 케이스 원본 (백업)
```

### grading.json 스키마

```json
{
  "expectations": [
    {
      "text": "expectation 문장",
      "passed": true,
      "evidence": "판정 근거"
    }
  ],
  "claims": [
    {
      "claim": "추출된 주장",
      "verified": true,
      "evidence": "검증 근거"
    }
  ],
  "eval_critique": [
    "assertion 개선 제안 (있을 경우)"
  ],
  "pass_rate": 0.85
}
```

### comparison.json 스키마

```json
{
  "winner": "A",
  "content_scores": {"A": 4.2, "B": 3.8},
  "structure_scores": {"A": 4.0, "B": 3.5},
  "reasoning": "판정 근거",
  "rubric": { "criteria": ["..."] }
}
```

---

## 스킬 변경 워크플로우

스킬(analyze-source 또는 analyze-repo)을 변경할 때의 필수 절차:

1. 변경 사항 반영 (SKILL.md 또는 references/ 수정)
2. frontmatter의 `version` +1 증가
3. 해당 스킬의 `CHANGELOG.md` 업데이트
4. `/self-improve regression` 실행
5. 모든 PASS 확인 후 사용 시작
6. REGRESSION 발생 시 원인 분석 후 수정 또는 롤백
