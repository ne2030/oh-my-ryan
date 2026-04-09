# 태그 레지스트리

> 분석 노트에 태그를 붙일 때 이 레지스트리에서 선택한다. 새 태그가 필요하면 먼저 여기에 등록한다.
>
> **규칙**:
> 1. 렌즈(`technical`, `process`, `org-culture`, `cognitive`)는 태그로 사용하지 않는다 — `analysis_lenses` 필드가 이미 추적
> 2. 태그는 영문 소문자 kebab-case
> 3. 하나의 노트에 3-6개 태그 권장
> 4. 태그 추가 시 정의와 구분 기준을 반드시 작성

---

## AI & 에이전트

| 태그 | 정의 | 사용 기준 | ≠ 구분 |
|------|------|-----------|--------|
| `agent` | 자율 실행 AI 에이전트 | 에이전트 아키텍처, 오케스트레이션, 멀티에이전트 | `ai-tool`(사람이 직접 조작하는 도구) |
| `ai-native` | AI를 전제로 설계된 제품/프로세스 | 기존 방식의 AI 전환, AI-first 설계 철학 | `ai-tool`(도구 자체가 아니라 설계 철학) |
| `ai-tool` | 사람이 직접 사용하는 AI 도구/앱 | NotebookLM, Claude Code 등 특정 도구 활용법 | `agent`(자율 실행이 아닌 인간 주도 사용) |
| `ai-search` | AI 기반 검색/발견 | AI 검색 엔진, GEO, 검색 패러다임 변화 | `search`(전통적 검색 기술) |

## 기술 & 구현

| 태그 | 정의 | 사용 기준 | ≠ 구분 |
|------|------|-----------|--------|
| `architecture` | 시스템/소프트웨어 구조 설계 | 아키텍처 패턴, 시스템 설계, 인프라 구조 | `workflow`(실행 순서가 아닌 구조 자체) |
| `claude-code` | Claude Code 에이전트 관련 | Claude Code 스킬, 플러그인, 활용법 | `ai-tool`의 하위. Claude Code 특정일 때만 |
| `embedding` | 벡터 임베딩 기술 | 임베딩 모델, 벡터 DB, 유사도 검색 | |
| `guardrail` | AI 안전장치/제약 | 가드레일 설계, 에러 방지, 품질 관리 | |
| `harness` | AI 개발 워크플로우 프레임워크 | ryan-lab 하네스 관련, AI 작업 환경 설계 | `workflow`(일반적 작업 흐름) |
| `open-source` | 오픈소스 프로젝트/도구 | 오픈소스 도구 소개, 공개 프로젝트 분석 | |
| `optimization` | 성능/효율 최적화 | 속도, 비용, 정확도 개선 | |
| `orchestration` | 멀티 컴포넌트 조율 | 에이전트 오케스트레이션, 파이프라인 조율 | `agent`(단일 에이전트) vs 이것(여러 에이전트/컴포넌트 조율) |
| `rag` | Retrieval-Augmented Generation | RAG 파이프라인, 검색 증강 생성 | |
| `search` | 전통적 검색 기술 | BM25, 벡터 검색, 하이브리드 검색 구현 | `ai-search`(AI 검색 패러다임) |
| `data-quality` | 데이터 품질 관리 | 클렌징, 검증, 전처리 | |
| `eval` | 평가/측정 | LLM 평가, 벤치마크, 품질 측정 | |

## 비즈니스 & 시장

| 태그 | 정의 | 사용 기준 | ≠ 구분 |
|------|------|-----------|--------|
| `market` | 시장 동향/분석 | 시장 규모, 트렌드, 경쟁 구도 | `strategy`(시장 대응 전략) |
| `saas` | SaaS 비즈니스 | SaaS 모델, 매출, 리텐션 | |
| `startup` | 스타트업 관련 | 창업, 스케일링, 펀딩 | |
| `strategy` | 비즈니스/기술 전략 | 전략적 의사결정, 포지셔닝 | `market`(시장 현황) vs 이것(대응 방법) |
| `valuation` | 기업 가치평가 | ARR, 멀티플, 재무 지표 | |
| `ecommerce` | 이커머스 | 온라인 커머스, 구매 행동 | |
| `d2c` | Direct to Consumer | D2C 모델, 브랜드 직접 판매 | |
| `platform` | 플랫폼 비즈니스 | 플랫폼 전략, 마켓플레이스 | |
| `customer-service` | 고객 서비스 | CS, 고객 지원, CX | |

## 인지 & 학습

| 태그 | 정의 | 사용 기준 | ≠ 구분 |
|------|------|-----------|--------|
| `mental-model` | 사고 틀/인지 프레임워크 | 프레임 전환, 해석 틀, 패러다임 변화 | `learning`(학습 과정) vs 이것(사고 구조 자체) |
| `learning` | 학습 방법/전략 | 학습법, 지식 습득, 교육 방법론 | `mental-model`(사고 틀) vs 이것(학습 과정) |
| `problem-solving` | 문제 해결 접근 | 디버깅, 근본 원인 분석, 의사결정 | |
| `prompt-engineering` | 프롬프트 설계 | 질문 전략, 프롬프트 패턴, AI 상호작용 설계 | |
| `developer-identity` | 개발자 역할/정체성 | 개발자 역할 변화, 정체성 전환 | |
| `consumer-behavior` | 소비자 행동 | 구매 심리, 소비 패턴 | |

## 조직 & 사람

| 태그 | 정의 | 사용 기준 | ≠ 구분 |
|------|------|-----------|--------|
| `leadership` | 리더십/관리 | 리더의 의사결정, 팀 관리, 경영 | |
| `communication` | 의사소통 | 설득, 보고, 크로스펑셔널 소통 | |
| `employment` | 고용/노동 시장 | 채용, 일자리 변화, 노동 시장 구조 | |

## 도구 & 산출물

| 태그 | 정의 | 사용 기준 | ≠ 구분 |
|------|------|-----------|--------|
| `presentation` | 프레젠테이션/슬라이드 | PPT 도구, 발표 자료 제작 | |
| `design` | 디자인/UI | 시각 디자인, UI/UX | |
| `data-analysis` | 데이터 분석 | 분석 방법론, 데이터 해석 | |
| `seo` | 검색엔진 최적화 | 전통적 SEO | `ai-search`(AI 검색) |
| `geo` | Generative Engine Optimization | AI 검색엔진 최적화 | `seo`(전통적 SEO) |
| `marketing` | 마케팅 | 마케팅 전략, 채널, 그로스 | |
| `workflow` | 작업 흐름/방법론 | 단계별 프로세스, 파이프라인, 자동화 흐름 | `architecture`(구조) vs 이것(실행 순서) |
| `productivity` | 생산성 | 효율성, 작업 속도, 자동화 | |

---

## 폐기 태그

> 렌즈와 중복되어 태그로 사용하지 않는 것들. 기존 노트에서 점진적으로 제거.

| 폐기 태그 | 사유 | 대체 |
|-----------|------|------|
| `technical` | `analysis_lenses: technical`과 중복 | 렌즈로만 추적 |
| `process` | `analysis_lenses: process`와 중복 | 렌즈로만 추적. 작업 흐름은 `workflow` 사용 |
| `cognitive` | `analysis_lenses: cognitive`와 중복 | 렌즈로만 추적. 인지 관련은 `mental-model` 또는 `learning` 사용 |
| `org-culture` | `analysis_lenses: org-culture`와 중복 | 렌즈로만 추적 |
| `ai` | 범위가 너무 넓음 | `ai-native`, `ai-tool`, `agent` 등 구체적 태그 사용 |
| `tool` | 범위가 너무 넓음 | `ai-tool`, `claude-code` 등 구체적 태그 사용 |
| `labor` | `employment`와 중복 | `employment` 사용 |
| `education` | `learning`과 중복 | `learning` 사용 |

---

## 변경 이력

| 날짜 | 변경 |
|------|------|
| 2026-03-13 | 최초 생성. 18개 분석 노트에서 50개 태그 추출, 42개로 정리. 렌즈 중복 태그 4개 + 범용 태그 4개 폐기 |
