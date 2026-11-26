# oh-my-ryan

> AI 인사이트 분석 + 하네스 구축을 위한 Claude Code 스킬 모음

개인 지식 창고 + AI 개발 워크플로우 프레임워크입니다. Obsidian 기반 vault 구조로 다양한 소스(LinkedIn 글, 논문, 레포, 영상 등)에서 인사이트를 수집·분석·연결하고, 그 과정을 자동화하는 Claude Code 스킬을 제공합니다.

## 핵심 컨셉

**3개 트랙** 으로 분석 노트를 조직화:

| Track | 대상 | 질문 |
|---|---|---|
| `harness` | 에이전트·워크플로우·가드레일 구축 | "내 하네스에 어떻게 반영할 것인가?" |
| `model` | LLM·모델 아키텍처·학습·벤치마크 | "모델 역량의 어느 축을 바꾸는가?" |
| `ax` | 조직·사람·시장의 AI 수용 | "AI를 어떻게 받아들이는가?" |

## 스킬

| 스킬 | 역할 |
|---|---|
| `rg-visual-explainer` | 개념·원인·아키텍처·흐름을 SVG 도식으로 시각화 (1장면 콘티 + 문제/해결 분리 + 자동 린트, v1.2.0) |
| `rg-explain-html` | 이슈·개념·아키텍처·비교를 한눈에 이해되는 설명용 HTML 페이지로 작성 (`rg-visual-explainer` 연동, v1.1.0) |
| `analyze-source` | 텍스트·이미지·URL 소스를 구조화된 분석 노트로 변환 (트랙 라우팅 + 범용 루브릭) |
| `analyze-repo` | Git 저장소의 설계 DNA를 4개 컴포넌트로 추출 |
| `debate` | Claude·Gemini·Codex 멀티 AI 토론 엔진 |
| `reflect` | 독자 코멘트 → AI 재코멘트 시스템 |
| `self-improve` | 스킬 품질 회귀 테스트 + 개선 제안 |

## 구조

```
oh-my-ryan/
├── skills/               # AI 에이전트 스킬 (rg-visual-explainer, rg-explain-html, analyze-source, analyze-repo, debate, reflect, self-improve)
├── insights/
│   ├── sources/          # 원본 소스 노트
│   ├── analysis/
│   │   ├── harness/      # 하네스 구축 관점 분석
│   │   ├── model/        # 모델·기술 관점 분석
│   │   └── ax/           # 조직·시장 관점 분석
│   ├── _templates/       # 트랙별 분석 템플릿
│   └── _quality/         # 루브릭 점수 추적
├── scripts/              # ocr.swift 등 유틸리티
└── docs/plans/           # 설계 문서
```

## 빠른 시작

### 시각화 · 설명용 HTML 스킬만 설치하기

사용 중인 AI 에이전트(Claude Code, Codex, Cursor, Antigravity 등)에 아래 프롬프트를 그대로 붙여넣으면 됩니다:

```text
https://github.com/ne2030/oh-my-ryan 의 `skills/rg-visual-explainer` 스킬을 설치하고 싶어.

설치하기 전에 먼저 아래 2가지를 나에게 물어보고 선택을 받아줘:
1. 전역으로 설치할지, 현재 프로젝트에만 설치할지
2. 설명용 HTML 문서 스킬(`skills/rg-explain-html`)도 같이 설치할지, `rg-visual-explainer`만 설치할지

선택을 받으면 현재 사용 중인 AI 에이전트의 스킬 경로와 규격에 맞게 설치하고, 정상 인식 여부와 검증 스크립트(`lint-visuals.mjs`, `check-html.mjs`) 실행 여부를 확인해줘.
```

### 인사이트 분석 워크플로우

```bash
# 1. 소스 파일을 resources/ 에 넣기 (텍스트/이미지/URL)
echo "https://example.com/blog-post" > resources/blog-post.md

# 2. Claude Code 에서 분석 실행
/analyze-source blog-post.md
```

스킬이 자동으로:
1. 입력 전처리 (OCR / WebFetch)
2. 소스 노트 생성
3. 라우팅 결정 (트랙 + 깊이 + 렌즈)
4. 트랙별 템플릿으로 분석 노트 작성
5. 자체 평가 + 품질 트래커 기록

## 샘플 분석

`insights/analysis/harness/` 에 공개 샘플 2건이 포함되어 있습니다:
- [Ryan Lopopolo — 하네스 엔지니어링](insights/analysis/harness/2026-02-11-ryan-lopopolo-harness-engineering.md) — OpenAI 엔지니어의 백만 줄 0코딩 실험
- [Andrej Karpathy — LLM Knowledge Bases](insights/analysis/harness/2026-04-05-andrej-karpathy-llm-knowledge-bases.md) — LLM으로 개인 지식 베이스 구축

## 버전

현재 analyze-source **v2** — 트랙 기반 라우팅 + 범용 평가 루브릭. 자세한 내용은 [CHANGELOG](skills/analyze-source/CHANGELOG.md).

## 라이선스

MIT
