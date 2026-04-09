---
name: analyze-repo
description: Git 저장소(에이전트 하네스 프로젝트)의 설계 DNA를 추출하여 구조화된 분석 노트를 생성한다
version: 2
---

# analyze-repo

Git 저장소(에이전트 하네스 프로젝트)의 설계 DNA를 추출하여 구조화된 분석 노트를 생성한다.

## Usage

```
/analyze-repo <GitHub URL 또는 로컬 경로>       # 첫 분석
/analyze-repo --update <project-name>            # 증분 업데이트
```

## 전체 파이프라인

```
[첫 분석]
1. 레포 탐색 (Explore)
2. DNA 추출 (Extract) — 4개 컴포넌트별 상세 분석
3. 요약 생성 (Summarize)
4. 카탈로그 등록 (Catalog)
5. 시스템 통합 (Integrate)

[증분 업데이트]
1. git pull → diff 수집
2. 변경 영향 분석 (어떤 DNA 컴포넌트에 영향?)
3. 해당 컴포넌트만 재분석/보완
4. 요약 노트에 "업데이트 이력" 추가
```

---

## Step 1: 레포 탐색 (Explore)

입력을 판별하고 레포를 탐색한다.

| 입력 형태 | 판별 기준 | 전처리 |
|-----------|-----------|--------|
| **GitHub URL** | `github.com` 포함 | `repos/{project-name}/`에 클론 (영구 보관) |
| **로컬 경로** | 디렉토리 경로 | 그대로 사용 |
| **--update** | 플래그 | `repos/{project-name}/`에서 `git pull` 후 diff 기반 분석 |

### 레포 보관 규칙
- 클론 위치: `repos/{project-name}/` (프로젝트 루트)
- `.gitignore`에 `repos/` 포함 — 원본 소스는 커밋하지 않음
- 이후 `git pull`로 최신화하며 diff 기반 증분 분석 가능

### 탐색 순서 (우선순위순)

1. **README.md, CONTRIBUTING.md, docs/** — 철학/가치 추출
2. **디렉토리 구조** (`ls -R` 또는 `tree`) — 아키텍처 파악
3. **핵심 진입점** (main, index, app, SKILL.md, CLAUDE.md) — 오케스트레이션 패턴
4. **설정/타입 파일** (config, schema, types) — 상태/라우팅 패턴
5. **에이전트/스킬 정의** — 기능 맵
6. **에러 핸들링 코드** — 에러 패턴
7. **CHANGELOG, releases, 이슈** — 진화 방향, 트레이드오프

**탐색 결과물**: 프로젝트 개요 + 핵심 파일 목록 + 프로젝트 유형 판정(코드 중심/프롬프트 중심/하이브리드)

## Step 2: 소스 노트 생성

`insights/sources/` 에 레포 소스 노트를 생성한다.

**파일명 규칙**: `{project-name}-repo.md` (영문 kebab-case)

**템플릿**: `insights/_templates/repo-source-note.md` 참조

frontmatter 필드:
- `title`: 프로젝트명 + 간략 설명
- `source_type`: repo
- `source_url`: GitHub URL
- `project_name`: 프로젝트명
- `author`: 주요 maintainer
- `date_collected`: 수집일 (YYYY-MM-DD)
- `commit_hash`: 분석 시점의 HEAD commit hash
- `tags`: 아직 비워둠 (분석 단계에서 결정)

## Step 3: DNA 추출 (Extract)

4개 DNA 컴포넌트별로 **references/repo-analysis-guide.md**를 읽고 따라 상세 분석을 수행한다.

각 컴포넌트별 출력 파일:

| 컴포넌트 | 출력 경로 | 템플릿 |
|----------|-----------|--------|
| 철학 | `insights/repos/{project}/philosophy.md` | `_templates/repo-philosophy.md` |
| 패턴 | `insights/repos/{project}/patterns.md` | `_templates/repo-patterns.md` |
| 기능맵 | `insights/repos/{project}/feature-map.md` | `_templates/repo-feature-map.md` |
| 트레이드오프 | `insights/repos/{project}/tradeoffs.md` | `_templates/repo-tradeoffs.md` |

**핵심 원칙**:
- 각 패턴/기능에는 반드시 **구현 위치**(파일 경로)를 포함한다
- 철학↔패턴↔기능맵 간의 **교차 링크**를 반드시 포함한다
- 추측이 아닌 코드/문서에서 **근거를 인용**한다
- 비교 섹션("다른 프로젝트와의 철학적 차이", "경쟁 프로젝트 대비 약점")은 비교 대상이 있을 때만 작성한다. 첫 분석 시에는 비워둔다.

## Step 4: 요약 생성 (Summarize)

4개 DNA 상세 파일에서 핵심을 추출하여 요약 분석 노트를 생성한다.

- **출력**: `insights/analysis/{project}-repo-analysis.md`
- **템플릿**: `insights/_templates/repo-analysis-note.md` 참조
- 각 DNA 섹션에 상세 파일로의 wikilink 포함
- **하네스 시사점** 섹션: 자체 하네스 설계에 가져갈 수 있는 구체적 패턴/원칙 3-5개
- **source_ref**: `[[insights/sources/{project}-repo]]`로 소스 노트 연결

**메타데이터 기록**: 요약 분석 노트 frontmatter에 아래를 반드시 포함한다:
- `skill: analyze-repo`
- `skill_version`: 이 스킬의 현재 `version` 값 (frontmatter에서 읽기)
- `eval_scores`: 자체 평가에서 산출된 항목별 점수를 기록 (예: `{설계_파악도: 4, 패턴_구체성: 4, 교차_연결: 3, 비교_가능성: 4}`)

## Step 5: 카탈로그 등록 (Catalog)

`insights/catalogs/patterns.md`에 추출된 패턴을 등록한다.

- 기존 패턴과 동일하면 "사용 프로젝트" 항목에 추가
- 새로운 패턴이면 새 행 추가
- 비교 매트릭스 테이블 업데이트
- 철학-패턴 연결 맵 업데이트

## Step 6: 시스템 통합 (Integrate)

- `insights/index.md`에 분석 노트 등록 (깊이: `DNA`로 표기, 렌즈: `기술+프로세스`)
- 기존 분석 노트 중 관련된 것에 역방향 링크 추가 (**references/repo-linking-rules.md** 참조)
- 태그 일관성 확인
- `insights/_quality/tracker.md` 에 새 분석 노트의 품질 데이터 행 추가 (파일명, 스킬, 버전, 각 항목별 점수, 평균, 날짜)

## 자체 평가

분석 노트 작성 후 4항목 평가를 수행한다 (1-5점, 기준선 3.5):

| 항목 | 기준 |
|------|------|
| 설계 파악도 | 요약만 읽어도 프로젝트의 핵심 설계와 철학을 파악할 수 있는가 |
| 패턴 구체성 | 패턴이 구현 위치와 함께 구체적으로 기술되어 있는가 |
| 교차 연결 | 철학↔패턴↔기능맵 간의 연결이 자연스러운가 |
| 비교 가능성 | 다른 프로젝트 분석과 나란히 놓았을 때 같은 관점으로 비교 가능한가 |

평균 3.5 미만이면 보완 후 재평가한다.

평가 점수를 분석 노트 frontmatter의 `eval_scores`에 기록한다.

## 증분 업데이트 워크플로우

`/analyze-repo --update {project-name}` 실행 시:

### 1. Diff 수집
```bash
cd repos/{project-name}
git pull origin main
git log --oneline {prev-commit}..HEAD    # 이전 분석 이후 커밋
git diff {prev-commit}..HEAD --stat      # 변경 파일 통계
```
- `{prev-commit}`은 소스 노트(`insights/sources/{project}-repo.md`)의 `commit_hash`에서 읽는다

### 2. 변경 영향 매핑

| 변경 영역 | 영향받는 DNA 컴포넌트 |
|-----------|---------------------|
| README, docs, CLAUDE.md | 철학 |
| 아키텍처 구조, 진입점, 라우팅 | 패턴 |
| 에이전트/스킬 추가·삭제, 설정 | 기능맵 |
| 이슈, 한계 관련 코드 변경 | 트레이드오프 |

### 3. 선택적 재분석
- 영향받는 DNA 컴포넌트 파일만 업데이트한다 (전체 재작성 X)
- 기존 내용에 **변경사항 반영** 형태로 수정
- 요약 분석 노트도 해당 섹션만 업데이트

### 4. 업데이트 기록
소스 노트의 `commit_hash`를 최신으로 갱신하고, 요약 분석 노트에 업데이트 이력 추가:
```markdown
## 업데이트 이력
| 날짜 | 커밋 범위 | 변경 요약 | 영향 컴포넌트 |
|------|-----------|-----------|--------------|
| YYYY-MM-DD | abc123..def456 | [주요 변경 1줄] | 패턴, 기능맵 |
```

## 템플릿 회고 (2개 프로젝트 분석 후)

2번째 프로젝트 분석 완료 후, 아래를 점검한다:
- 5개 패턴 카테고리(오케스트레이션, 라우팅, 상태관리, 에러처리, 컨텍스트관리)가 모든 유형의 프로젝트에 적합한가?
- 프롬프트 중심 프로젝트에서 비어 있는 섹션이 과도한가?
- 추가해야 할 DNA 컴포넌트나 패턴 카테고리가 있는가?
- 결과를 바탕으로 템플릿을 조정한다.
