# v6 — analyze-paper 스킬 설계

## 배경

`analyze-source`는 블로그/스레드/스크린샷 등 "짧은 주장 + 라우팅 + 코멘트" 흐름에 최적화돼 있다. 논문은 결이 다르다:

- 이미 학술적 구조(abstract, method, experiment, related work)를 갖춤
- 주장이 실험 결과·벤치마크·수식에 근거
- 선행/후속 레퍼런스 그래프가 정보의 일부
- 인용 횟수, 재현성(코드 공개 여부), 실험 설계 타당성 같은 메타 축이 비판의 핵심

`analyze-source`에 paper 분기를 추가하는 대신 **별도 스킬(`analyze-paper`)** 로 분리한다. `analyze-repo`가 "레포 DNA는 별도 스킬"로 간 것과 같은 논리: 산출물 구조가 다르면 스킬을 나눈다.

## 목적

논문(arXiv URL / PDF / 텍스트)을 비판적 관점으로 분석하여 다음을 생성한다:

- `insights/sources/{slug}.md` — 소스 노트
- `insights/analysis/{slug}.md` — 짧은 요약 분석 노트 (entry point)
- `insights/papers/{slug}/` — 4파일 상세 (summary / critique / evidence / references)
- `insights/catalogs/benchmarks.md` — 횡단 카탈로그 행 추가

## 스코프

**포함:**
- arXiv URL / PDF 파일 / 텍스트 붙여넣기 처리
- 본문 텍스트 + 페이지 이미지 추출 (캡션 포함 페이지 단위)
- Semantic Scholar 메타데이터 조회 (인용수, 레퍼런스, influential citations)
- 6개 비판 렌즈 강제 적용
- 조건부 섹션(하네스 적용 / 후속 논문 그래프)
- 자체 평가(5항목) + tracker.md 기록

**미포함 (의도적 제외):**
- 수식·표를 텍스트로 완벽 복원 (페이지 이미지 참조로 대체)
- 후속 논문의 "지지 vs 반박" 자동 판단 (제목·저자·인용수만 기록)
- `analyze-source`와의 경로 자동 전환 (사용자가 스킬 선택)

## 입력 처리 (Step 1)

| 입력 형태 | 판별 | 본문 추출 | 이미지 추출 |
|---|---|---|---|
| **arXiv URL** | `arxiv.org/abs/` 패턴 | arXiv API(abstract+메타) + PDF 다운로드 → `pdftotext` | `pdftoppm` 페이지 단위 |
| **PDF 파일** | `resources/*.pdf` | `pdftotext` | `pdftoppm` 페이지 단위 |
| **텍스트 (fallback)** | `.md` 본문 | 그대로 사용 | 사용자에게 스크린샷 요청 |

**페이지 이미지 저장:** `insights/assets/papers/{slug}/page-NN.png`
- 이유: `pdfimages`는 figure 낱개만 뽑아 캡션이 분리됨. 논문 그림은 캡션 없으면 해석 불가. 페이지 단위로 두면 figure+caption+본문 맥락이 한 덩어리로 보존되고, 결과 표(Table) 문제도 같이 해결됨.

**메타데이터 조회:** Semantic Scholar API (arXiv ID 기반)
- 필드: `title, authors, venue, year, citationCount, influentialCitationCount, references[], citations[]`
- 인용수 ≈ 0이면 "발표된 지 얼마 안 된 신규 논문"으로 기록, 레퍼런스 위치 판단 유보

## 소스 노트 (Step 2)

`insights/sources/YYYY-MM-DD-저자명-핵심키워드.md`

frontmatter:
- `title`
- `source_type: paper`
- `source_url` (arXiv URL or DOI)
- `authors: [...]`
- `venue`, `year`
- `citation_count`, `influential_citation_count`
- `code_url` (S2 제공 시)
- `date_collected`
- `tags: []` (분석 단계에서 채움)

본문: abstract + 페이지 이미지 링크 리스트

## 상세 분석 4파일 (Step 4)

### `insights/papers/{slug}/summary.md`
- **기여 (Contribution)** — 저자가 주장하는 새로움
- **방법 (Method)** — 핵심 아이디어를 한국어로
- **결과 (Results)** — 주요 수치, baseline 대비
- **하네스 적용 제안** (조건부) — 기법/도구/아키텍처를 제안하는 논문일 때만

### `insights/papers/{slug}/critique.md` — **스킬의 핵심**

6개 렌즈, 각각 "판단 + 근거 섹션/페이지 참조" 형식:

1. **실험 설계 타당성** — baseline 공정성, ablation 충분성, 데이터셋 적합성
2. **논리 비약** — 측정 지표와 결론 간 거리, overclaim 여부
3. **일반화 한계** — 저자 limitations 인용 + 외삽 가능 범위 평가
4. **재현성** — 코드/데이터/하이퍼파라미터 공개도, 재현 난이도
5. **벤치마크 맥락** — 선택 벤치마크의 의미, cherry-picking 체크
6. **레퍼런스 위치** — 선행 대비 실제 기여 vs rebrand

빈 칸은 자체 평가 "비판 렌즈 충실성" 항목에서 감점.

### `insights/papers/{slug}/evidence.md`
- **주요 벤치마크 표** — 논문의 Table을 한국어 헤더로 재구성 (가능한 범위에서). 수치는 원문 Table N 참조
- **실험 설정** — 데이터셋, 모델 크기, 학습 조건
- **재현성 정보** — 코드 repo URL, 데이터 접근성, 하이퍼파라미터 명시 여부

### `insights/papers/{slug}/references.md`
- **주요 선행 3~5편** — 본문에서 여러 번 인용되거나 S2 `isInfluential=true`
- **후속 논문 top 3** (조건부: 인용수 100+ 또는 서베이 논문일 때만)
  - 제목 / 저자 / 인용수만 기록
  - "지지 vs 반박" 판단은 "별도 분석 필요"로 명시

## 요약 분석 노트 (Step 5)

`insights/analysis/{slug}.md` — entry point 역할

- frontmatter: `skill: analyze-paper`, `skill_version`, `eval_scores`, `read_status: unread`
- 본문: 2~3문단 요약 + 핵심 인사이트 3~5개 + `insights/papers/{slug}/` 링크
- 끝에 빈 `## 독자 코멘트` 섹션 (analyze-source와 동일)

## 벤치마크 카탈로그 (Step 6)

`insights/catalogs/benchmarks.md` — 여러 논문을 가로질러 수치 비교

행 추가: `| 논문 | 태스크 | 벤치마크 | 수치 | baseline | 출처 |`

나중에 "같은 태스크에서 여러 논문 비교" 요청이 올 때 이 파일이 작동한다.

## 자체 평가

5항목, 1~5점, 기준선 3.5, 미달 시 보완 후 재평가.

| 항목 | 기준 |
|---|---|
| 원본 이해도 | 원본 안 읽어도 기여·방법·결과 파악 가능한가 |
| **비판 렌즈 충실성** | 6개 렌즈가 실질 내용으로 채워졌는가 (빈 칸 = 감점) |
| **근거 추적 가능성** | 주장마다 섹션/페이지/이미지 참조가 걸려 있는가 |
| 실행 가능성 | (조건부) 하네스 적용 제안이 구체적인가 |
| 연결 의미성 | 기존 `insights/analysis` 노트와의 링크가 실질적인가 |

`insights/_quality/tracker.md`에 행 추가, 분석 노트 frontmatter `eval_scores`에 기록.

## 파이프라인 요약

```
1. 입력 판별 (arXiv URL / PDF / 텍스트)
2. 본문 텍스트 추출 (pdftotext)
3. 페이지 이미지 추출 (pdftoppm → insights/assets/papers/{slug}/)
4. Semantic Scholar 메타데이터 조회
5. 소스 노트 생성 (insights/sources/)
6. 논문 읽기 (텍스트 + 주요 페이지 이미지 Read)
7. 4파일 상세 작성 (insights/papers/{slug}/)
   - summary.md
   - critique.md (6개 비판 렌즈 필수)
   - evidence.md (벤치마크·실험·재현성)
   - references.md (선행 + 조건부 후속)
8. 요약 분석 노트 (insights/analysis/{slug}.md)
9. 벤치마크 행 추가 (insights/catalogs/benchmarks.md)
10. 자체 평가 → frontmatter + tracker.md
11. 인덱스 업데이트(index.md), 역링크, resources/ 정리
```

## 재사용되는 기존 자산

- `insights/_templates/` — 새 템플릿 2개 추가 (paper-source-note, paper-analysis-note) + 4파일 템플릿
- `insights/_tags.md` — 태그 레지스트리 그대로
- `insights/index.md` — 분석 노트 인덱스에 추가
- `insights/_quality/tracker.md` — tracker 스키마 그대로 (skill 필드만 `analyze-paper`)
- `references/linking-rules.md` — 링킹 규칙 재사용

## analyze-source와의 경계

- `source_type: paper`인 항목은 앞으로 `analyze-paper`로 라우팅 (사용자가 스킬 선택)
- `analyze-source`의 A/B/C 렌즈와는 독립. 논문은 처음부터 "C 레벨(근거 검증 필요)" 로 시작하므로 동일 프레임 재사용하지 않음
- 두 스킬은 `insights/_templates/`, `_tags.md`, `index.md`, `tracker.md`를 공유

## 의사결정 기록

| 질문 | 결정 | 근거 |
|---|---|---|
| Q1 주 용도 | 하이브리드 (practical + academic) | 실제 사용 패턴이 섞여 있음 |
| Q2 비판 렌즈 | 1,2,4,5,6,7 (6개) | AI가 판단 가능하면서 실질적 |
| Q3 라우팅 | 없음, 조건부 섹션만 | practical/academic 경로가 체크 항목 수준에선 겹침 |
| Q4 PDF 처리 | D (URL + 파일 + fallback), 방식2(페이지 단위 이미지) | 캡션 보존 + 표 문제 해결 |
| Q5 메타데이터 | Semantic Scholar | 단일 API로 citations+references+influential 다 커버 |
| Q6 산출물 구조 | B (4파일 분리 + 카탈로그) | 논문 분량이 블로그 2~3배, analyze-repo 대칭성 |
| Q7 레퍼런스 그래프 | C (기본 선행만, 조건부 후속 top 3) | 신규 논문은 후속이 비어있어 노이즈 |
| Q8 자체 평가 | 5항목 (원본이해/비판충실/근거추적/실행가능/연결의미) | 논문 특화, 계층분류 제거, 근거추적 신설 |

## 열린 질문 (구현 단계에서 결정)

- 페이지 이미지 해상도 (`pdftoppm -r` 값)
- arXiv PDF 다운로드 캐싱 위치
- Semantic Scholar rate limit 초과 시 fallback (OpenAlex? 스킵?)
- `catalogs/benchmarks.md`의 정확한 스키마

## 다음 단계

1. 이 스펙 사용자 리뷰
2. `writing-plans` 스킬로 구현 플랜 작성
3. 스킬 디렉토리 생성 (`skills/analyze-paper/SKILL.md` + `references/`)
4. 템플릿 4개 + 2개 작성
5. 테스트 논문으로 dry run (예: 최근 arXiv 논문 1편)
