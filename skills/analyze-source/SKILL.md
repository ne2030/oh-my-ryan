---
name: analyze-source
description: resources/ 폴더의 소스(텍스트, 스크린샷, 링크)를 분석하여 구조화된 소스 노트 + 분석 노트를 생성한다
---

# analyze-source

소스 노트를 분석하여 구조화된 분석 노트를 생성한다.

## Usage

```
/analyze-source <resources 폴더 내 파일명 또는 경로>
```

여러 파일을 한번에 지정할 수 있다:
```
/analyze-source file1.md file2.md file3.png
```

인자 없이 호출하면 `resources/` 폴더의 모든 분석 대상 파일을 자동 탐색한다.

## 전체 파이프라인

```
1. 입력 전처리
2. 소스 노트 생성
3. 라우팅 (깊이 추천 + 렌즈 선택)
4. 분석 실행
5. 분석 노트 저장
6. 정리 (삭제, 인덱스, 역링크)
```

---

## Step 1: 입력 전처리

소스 파일의 형태를 판별하고 텍스트를 확보한다.

| 입력 형태 | 판별 기준 | 전처리 |
|-----------|-----------|--------|
| **텍스트 (md)** | `.md` 확장자, 본문이 텍스트 | 그대로 사용 |
| **스크린샷 (png/jpg)** | 이미지 확장자 | Apple Vision OCR로 텍스트 추출 (아래 스크립트 사용). 원본 이미지는 소스 노트에 첨부 |
| **링크 (URL만 있는 md)** | 본문이 URL 1줄 | WebFetch로 본문 수집. 실패 시 사용자에게 텍스트 붙여넣기 요청 |

### 스크린샷 OCR (macOS Apple Vision)

```bash
swift scripts/ocr.swift "<이미지 경로>"
```

`scripts/ocr.swift` — Apple Vision 기반 한국어+영어 OCR. 줄 단위 텍스트를 stdout으로 출력한다.

**전처리 결과물**: 분석 가능한 텍스트 + 메타데이터(저자, URL, 소스 타입)

## Step 2: 소스 노트 생성

`insights/sources/` 에 소스 노트를 생성한다.

**파일명 규칙**: `YYYY-MM-DD-저자명-핵심키워드.md` (영문 kebab-case)

**템플릿**: `insights/_templates/source-note.md` 참조

frontmatter 필드:
- `title`: 원본 제목 또는 핵심 내용 요약 (한국어)
- `source_type`: linkedin | youtube | paper | thread | comment | blog | screenshot
- `source_url`: 원본 URL (없으면 빈 문자열)
- `author`: 저자명
- `date_collected`: 수집일 (YYYY-MM-DD)
- `tags`: 아직 비워둠 (분석 단계에서 `insights/_tags.md` 레지스트리에서 선택)

## Step 3: 라우팅

**references/routing-rules.md** 를 읽고 따라 깊이와 렌즈를 결정한다. 별도 승인 없이 바로 분석을 진행한다.

라우팅 판단 결과는 분석 노트의 "라우팅 판단 기록" 섹션에 기록한다.

## Step 4: 분석 실행

**references/analysis-guide.md** 를 읽고 따른다.

각 섹션별 작성 기준:
- **라우팅 판단 기록**: Step 3의 판단 근거를 그대로 기록
- **원본 요약**: analysis-guide.md의 요약 작성법 참조
- **핵심 인사이트**: analysis-guide.md의 계층화 기준 참조
- **근거 및 출처** (B/C): analysis-guide.md의 검증 방법 참조
- **추가 리서치** (C): analysis-guide.md의 리서치 방법 참조
- **분석자 코멘트**: analysis-guide.md의 코멘트 작성법 참조
- **관련 노트**: `insights/index.md`를 먼저 읽고 후보를 좁힌 뒤, **references/linking-rules.md** 를 따른다
- **하네스 적용 제안**: 해당하는 경우에만 작성

## Step 5: 분석 노트 저장

`insights/analysis/` 에 분석 노트를 생성한다.

**파일명**: 소스 노트와 동일한 이름 사용 (디렉토리가 다르므로 구분됨)

**템플릿**: `insights/_templates/analysis-note.md` 참조

**wiki link 규칙**: 항상 전체 경로 사용 `[[insights/sources/파일명|표시명]]`

## Step 6: 정리

- **텍스트/링크 소스**: 분석 완료된 원본 파일을 `resources/` 에서 삭제
- **이미지 소스**: `resources/`에서 `insights/assets/`로 이동 (삭제하지 않음). 소스 노트의 이미지 링크가 `insights/assets/` 경로를 가리키도록 작성
- `insights/index.md` 에 새 분석 노트 항목 추가
- 기존 분석 노트 중 관련 노트 섹션 업데이트가 필요한 것이 있으면 역방향 링크 추가

## 자체 평가

분석 노트 작성 후 5항목 평가를 수행한다 (1-5점, 기준선 3.5):

| 항목 | 기준 |
|------|------|
| 인사이트 유용성 | 원본 안 읽어도 핵심 파악 가능한가 |
| 계층 분류 자연스러움 | 원칙/사례/프레임 구분이 모호하지 않은가 |
| 실행 가능성 | 하네스 적용 제안이 구체적 방향을 제시하는가 |
| 근거 충분성 | (B/C) 검증에 출처 URL이 포함되어 있는가 |
| 연결 의미성 | 관련 노트 연결이 실질적 의미가 있는가 |

평균 3.5 미만이면 보완 후 재평가한다.
