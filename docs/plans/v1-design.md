# oh-my-ryan v1 설계안

## 1. 프로젝트 개요

두 가지 목적을 가진 Obsidian 기반 지식 레포:
1. **AI 인사이트 창고** - 다양한 소스(LinkedIn, YouTube, 논문, 스레드)에서 인사이트를 수집/분석/연결
2. **나만의 AI 하네스** - 계획/구현/테스트/개선 등 AI 개발 워크플로우 프레임워크 (점진적 구축)

인사이트 창고에서 나온 학습이 하네스에 자동 제안되며, 두 영역이 시너지를 이룸.

## 2. 디렉토리 구조

```
oh-my-ryan/
├── insights/
│   ├── sources/       # 원본 소스 (텍스트, 스크린샷, 링크 메모)
│   ├── analysis/      # 분석 노트 (핵심 산출물)
│   └── _templates/    # Obsidian 노트 템플릿
├── harness/           # AI 하네스 (점진적 구조화)
├── docs/
│   └── plans/         # 설계 문서
└── resources/         # 레거시 (마이그레이션 후 정리)
```

## 3. 핵심 설계 결정

- **Obsidian 퍼스트**: `[[위키링크]]`, 태그, frontmatter 적극 활용
- **노트 언어**: 한국어
- **입력 형태**: 텍스트(주), 스크린샷, 링크 모두 지원
- **분석 깊이**: A/B/C 라우팅 + 추천 + 사용자 승인
- **연결 전략**: 태그 기반 자동 링킹, 시너지 분석은 요청 시에만
- **하네스 연결**: 새 인사이트마다 하네스 적용 포인트 자동 제안

## 4. 태그 체계

**주제 태그** (Obsidian 태그):
- 핵심 기술: `#agent`, `#eval`, `#guardrail`, `#harness`, `#prompt-engineering`, `#rag`, `#fine-tuning`, `#ontology`
- 활용/전략: `#ai-native`, `#workflow`, `#productivity`, `#architecture`
- 산업/비즈니스: `#saas`, `#market`
- 점진적 추가 가능

**메타데이터** (frontmatter):
- `source_type`: 소스 유형
- `analysis_depth`: 분석 깊이
- `harness_applicable`: 하네스 적용 가능 여부

## 5. 분석 노트 템플릿

```yaml
---
title: ""
source_type:         # linkedin | youtube | paper | thread | comment
source_url: ""
author: ""
date_collected:
tags: []
analysis_depth:      # A | B | C
harness_applicable:
---
```

```markdown
## 원본 요약
## 핵심 인사이트
## 근거 및 출처 (B, C)
## 추가 리서치 (C)
## 관련 노트
## 하네스 적용 제안
```

## 6. 워크플로우

```
사용자가 소스 제공 (텍스트/스크린샷/링크)
    -> Claude가 원본을 sources/에 저장
    -> 분석 깊이 추천 (A/B/C) + 사용자 승인
    -> 분석 노트 생성 -> analysis/에 저장
    -> 태그 기반 기존 노트 자동 링킹
    -> 하네스 적용 포인트 자동 제안
```

## 7. TODO

- [ ] 분석 프로세스 상세 설계 (v2)
  - 어떤 측면으로 분석할 것인지
  - 근거 확보 방법
  - 리서치 트리거 조건
  - 분석 결과물 구체 정의
- [ ] 하네스 초기 구조 설계
- [ ] 기존 파일 마이그레이션
- [ ] 소스 그룹핑 & 영향도 모델 설계
  - 브랜드/개인 단위로 소스를 그룹핑
  - 내부(오피셜) vs 외부 소스 신뢰도·영향도 구분
  - 그룹 내 일관성 추적 및 변화 감지
  - 내부 강연결 / 외부 약연결 링킹 전략
