# oh-my-ryan

## 목적

Obsidian 기반 AI 인사이트 지식 레포 + Claude Code 스킬 쇼케이스.

공개 버전은 스킬 프레임워크와 소수의 샘플 분석만 포함합니다. 개인 작업 공간은 private 레포 `ryan-lab` 에 있습니다.

## 구조

```
oh-my-ryan/
├── skills/               # Claude Code 스킬
│   ├── analyze-source/   # 트랙 기반 소스 분석 (v2)
│   ├── analyze-repo/     # 레포 DNA 분석
│   ├── debate/           # 멀티 AI 토론 엔진
│   ├── reflect/          # 독자 코멘트 + AI 재코멘트
│   └── self-improve/     # 스킬 품질 회귀 테스트
├── insights/
│   ├── sources/          # 원본 소스 노트
│   ├── analysis/         # 트랙별 분석 노트 (harness/model/ax)
│   ├── _templates/       # 트랙별 템플릿
│   ├── _tags.md          # 태그 레지스트리
│   └── _quality/         # 품질 추적
├── scripts/              # 유틸리티 (ocr.swift 등)
└── docs/plans/           # 설계 문서
```

## 핵심 워크플로우

### 소스 분석
소스 제공 → `/analyze-source` → 트랙 결정(`harness`/`model`/`ax`) → 분석 노트 생성 → 자동 링킹

### 레포 DNA 분석
GitHub URL → `/analyze-repo` → 소스 노트 + 4개 컴포넌트 상세 분석

### AI 토론
주제 제공 → `/debate` → 결론 + 토론 기록

## 노트 언어

한국어
