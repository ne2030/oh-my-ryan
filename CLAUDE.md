# oh-my-ryan

## 목적

Obsidian 기반 AI 인사이트 지식 레포. 두 가지 축으로 구성:

1. **AI 인사이트 창고** — 다양한 소스(LinkedIn, YouTube, 논문, 스레드 등)에서 인사이트를 수집·분석·연결
2. **AI 하네스** — AI 개발 워크플로우 프레임워크 (점진적 구축 예정)

## 구조

```
oh-my-ryan/
├── insights/
│   ├── sources/       # 원본 소스 노트 (텍스트, 스크린샷, 링크, 레포)
│   ├── analysis/      # 분석 노트 (핵심 산출물 — 글 분석 + 레포 DNA 요약)
│   ├── debates/       # 토론 노트 (debate 스킬 산출물)
│   ├── repos/         # 레포 DNA 상세 분석 (프로젝트별 4개 컴포넌트)
│   ├── catalogs/      # 교차 프로젝트 패턴 카탈로그
│   ├── _templates/    # 소스/분석 노트 템플릿
│   └── index.md       # 분석 노트 인덱스
├── docs/plans/        # 설계 문서 (v1, v2, v3 등)
├── scripts/           # 유틸리티 (ocr.swift 등)
├── repos/             # 분석 대상 레포 원본 (git clone, pull로 추적)
├── skills/            # Claude Code 스킬 (analyze-source, analyze-repo, debate)
├── .claude/skills     # → skills/ 심링크 (Claude Code 호환)
└── resources/         # 분석 전 원본 파일 임시 저장
```

## 핵심 워크플로우

### 글/이미지 분석
소스 제공 → `/analyze-source` 스킬로 분석 → 소스 노트 + 분석 노트 생성 → 태그 기반 자동 링킹

### 레포 DNA 분석
GitHub URL/로컬경로 → `/analyze-repo` 스킬로 분석 → 소스 노트 + 요약(analysis/) + 상세 4파일(repos/{project}/) + 패턴 카탈로그 등록

### AI 토론
주제 제공 → `/debate` 스킬로 토론 → 결론 + 토론 기록 노트 생성 (insights/debates/)

## 노트 언어

한국어
