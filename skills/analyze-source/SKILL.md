---
name: analyze-source
description: resources/ 폴더의 소스(텍스트, 스크린샷, 링크)를 분석하여 구조화된 소스 노트 + 트랙별 분석 노트를 생성한다
version: 2
---

# analyze-source (v2)

소스 노트를 분석하여 **트랙별**(harness / model / ax) 분석 노트를 생성한다.

## 주요 변경 (v1 → v2)

- **트랙(track) 차원 도입**: 분석 노트가 `harness`·`model`·`ax` 세 트랙으로 분리 저장된다 (`insights/analysis/{track}/`).
- **범용 평가 루브릭**: `실행_가능성` 같은 하네스 특화 항목 제거. 새 5항목 = `인사이트_밀도 / 계층_자연성 / 근거_강도 / 부가가치 / 연결_품질`.
- **템플릿 분리**: 트랙별 전용 템플릿(`analysis-note-{harness,model,ax}.md`).
- **트랙 delta 섹션**: harness → "하네스 적용 제안", model → "기술 의미", ax → "도입 조건". 다른 트랙 섹션은 존재하지 않는다.
- **`harness_applicable` 필드 제거**: track 으로 대체.

## Usage

```
/analyze-source <resources 폴더 내 파일명 또는 경로>
```

인자 없이 호출하면 `resources/` 폴더를 자동 탐색.

## 전체 파이프라인

```
1. 입력 전처리
2. 소스 노트 생성
3. 라우팅 (트랙 + 깊이 + 렌즈)
4. 분석 실행 (트랙별 템플릿)
5. 분석 노트 저장 (analysis/{track}/)
6. 정리 (삭제, 인덱스, 역링크)
```

---

## Step 1: 입력 전처리

| 입력 형태 | 전처리 |
|---|---|
| 텍스트 (md) | 그대로 사용 |
| 스크린샷 (png/jpg) | Apple Vision OCR → `insights/assets/` 이동 |
| 링크 (URL만 있는 md) | WebFetch로 본문 수집 |

### 스크린샷 OCR (macOS)
```bash
swift scripts/ocr.swift "<이미지 경로>"
```

## Step 2: 소스 노트 생성

`insights/sources/` 에 생성 (트랙 무관 단일 폴더 — 동일 소스가 여러 트랙에 재사용될 수 있음).

- **파일명**: `YYYY-MM-DD-저자명-핵심키워드.md`
- **템플릿**: `insights/_templates/source-note.md`
- **frontmatter**: title, source_type, source_url, author, date_collected, tags(비움)

## Step 3: 라우팅 (3차원)

**references/routing-rules.md** 와 **references/tracks.md** 를 따른다.

### 3-1. 트랙 결정

| Track | 판별 질문 |
|---|---|
| `harness` | "내 하네스에 어떻게 반영할 것인가"에 답하는가 |
| `model` | 모델 자체의 역량·한계·아키텍처를 다루는가 |
| `ax` | 조직·사람·시장의 AI 수용을 다루는가 |
| `?` | 셋 다 애매함 → 임시 미분류 |

**디폴트 트랙 강제 배정 금지.** 애매하면 `?` (하네스 편향 재발 방지).

### 3-2. 깊이 & 렌즈

- 깊이: A / B / C (routing-rules.md 표)
- 렌즈: technical / process / org-culture / cognitive
- 트랙별 B/C 검증 포커스: tracks.md 참조

라우팅 판단 결과는 "라우팅 판단 기록" 섹션에 기록.

## Step 4: 분석 실행

**references/analysis-guide.md** 를 따른다. 트랙에 맞는 템플릿을 복사:

- `harness` → `insights/_templates/analysis-note-harness.md`
- `model` → `insights/_templates/analysis-note-model.md`
- `ax` → `insights/_templates/analysis-note-ax.md`

섹션별 작성 기준:
- **원본 요약**: 3-5문장 (누가/무엇을/근거/결론) — analysis-guide §1
- **핵심 인사이트**: 원칙/사례/프레임 — analysis-guide §2
- **근거 및 출처** (B/C): 트랙별 검증 포커스 — analysis-guide §3, tracks.md
- **추가 리서치** (C): analysis-guide §4
- **분석자 코멘트**: 논리/신뢰도/확장/비판 (공통) — analysis-guide §5
- **트랙 delta 섹션**: 트랙 전용 — analysis-guide §6
- **관련 노트**: index.md + linking-rules.md (트랙 교차 연결 권장)
- **독자 코멘트**: 빈 섹션

## Step 5: 분석 노트 저장

경로: `insights/analysis/{track}/파일명.md` (소스 노트와 동일 파일명). 트랙이 `?` 면 `insights/analysis/_unsorted/`.

**wiki link 규칙**:
- 소스: `[[insights/sources/파일명|표시명]]`
- 분석: `[[insights/analysis/{track}/파일명|표시명]]`

**필수 frontmatter**:
```yaml
track: harness | model | ax
skill: analyze-source
skill_version: 2
eval_scores:
  인사이트_밀도: N
  계층_자연성: N
  근거_강도: N   # A 깊이에서도 채점 (논리 일관성)
  부가가치: N
  연결_품질: N
read_status: unread
```

## Step 6: 정리

- 텍스트/링크 소스: `resources/` 에서 삭제
- 이미지 소스: `resources/` → `insights/assets/` 이동
- `insights/index.md` 에 새 행 추가 (track 컬럼 포함)
- 역방향 링크 추가 (트랙 교차 포함)
- `insights/_quality/tracker.md` 에 새 행 (track 컬럼 포함)

## 자체 평가 (범용 5항목)

| 항목 | 기준 |
|---|---|
| 인사이트 밀도 | 원본 안 읽어도 핵심 파악 가능한가 |
| 계층 자연성 | 원칙/사례/프레임 구분이 억지 없이 떨어지는가 |
| 근거 강도 | B/C: 출처·수치 / A: 논리 일관성 |
| 부가가치 | 단순 요약을 넘어 분석자 시각이 더해졌는가 |
| 연결 품질 | 관련 노트 연결이 실질적 의미를 갖는가 |

평균 3.5 미만이면 보완 후 재평가.

---

## References

- `references/tracks.md` — 트랙 정의, 판별 알고리즘, 트랙 간 경계
- `references/routing-rules.md` — 3차원 라우팅 (트랙 + 깊이 + 렌즈)
- `references/analysis-guide.md` — 요약/계층화/검증/평가 루브릭
- `references/linking-rules.md` — 관련 노트 연결 규칙 (트랙 교차 포함)
