# exhibition-template

`exhibition-template`는 전시회 하나당 저장소 하나를 만드는 GitHub Pages 템플릿이다. 새 저장소를 `exhibition-2026-spring`, `exhibition-2026-photoweek`, `exhibition-filter-showcase`처럼 만들고, `exhibition.setup.yml` 한 파일만 바꾸면 공개 전시 아카이브와 업로드 UI, Pages CMS, GitHub Actions 썸네일 파이프라인이 함께 동작하도록 설계했다.

핵심 원칙은 다음과 같다.

- 전시회 하나당 레포 하나
- 사이트, 작품 마크다운, 작가 마크다운, 전시회 정보, 원본 이미지, 썸네일을 모두 같은 레포에서 관리
- 업로드 처리는 공통 `exhibition-worker`가 담당
- 썸네일과 공개용 JSON 갱신은 각 전시회 레포의 GitHub Actions가 담당
- 고급 사용자는 Pages CMS에서 작품 post를 직접 만들고 수정 가능

## 이 템플릿이 만드는 것

- `/` 전시 랜딩 페이지
- `/artists/` 작가 목록 페이지
- `/photos/` 작품 목록 페이지
- `/photos/{slug}/` 작품 상세 페이지
- `/upload/artwork/` 사진 업로드 페이지
- `/upload/artist/` 작가 정보 업로드 페이지
- `/upload/exhibition/` 전시회 정보 업로드 페이지
- `.pages.yml` 기반 Pages CMS 설정
- `_artworks`, `_artists`, `_exhibition` 컬렉션
- `assets/uploads/originals/` 원본 이미지 경로
- `assets/uploads/thumbs/` 썸네일 경로
- `data/*.json` 공개용 인덱스
- GitHub Actions 기반 썸네일 및 데이터 동기화 워크플로

## 저장소 구조

```text
.
├── .github/workflows/sync-exhibition-assets.yml
├── .github/workflows/sync-template-settings.yml
├── .pages.yml
├── _artworks/
├── _artists/
├── _exhibition/index.md
├── exhibition.setup.yml
├── _layouts/
├── assets/
│   ├── css/site.css
│   ├── exhibition/
│   ├── js/
│   │   ├── config.js
│   │   ├── site.js
│   │   ├── upload-shared.js
│   │   ├── upload-artwork.js
│   │   ├── upload-artist.js
│   │   └── upload-exhibition.js
│   └── uploads/
│       ├── originals/
│       └── thumbs/
├── artists/index.html
├── data/
├── docs/
│   ├── ARCHITECTURE.md
│   └── OPERATIONS.md
├── index.html
├── photos/index.html
├── scripts/sync-exhibition-assets.mjs
└── upload/
    ├── artwork/index.html
    ├── artist/index.html
    └── exhibition/index.html
```

## 템플릿 사용법

### 1. template repository로 지정

1. GitHub에서 `exhibition-template` 저장소의 `Settings -> General`로 이동한다.
2. `Template repository`를 켠다.

### 2. 새 전시회 레포 만들기

1. `Use this template`를 클릭한다.
2. 새 레포 이름을 반드시 `exhibition-...` 형태로 만든다.
3. 예:
   - `exhibition-2026-spring`
   - `exhibition-2026-photoweek`
   - `exhibition-filter-showcase`

중요:

- 공용 Worker는 `repoName`이 `exhibition`으로 시작하는 경우만 업로드를 허용한다.
- `filter-images-1`, `my-test-repo` 같은 이름은 이 Worker로 업로드할 수 없다.

### 3. GitHub Pages 활성화

1. 새 저장소의 `Settings -> Pages`로 이동한다.
2. `Deploy from a branch`를 선택한다.
3. Branch는 `main`, folder는 `/ (root)`를 선택한다.
4. 저장 후 몇 분 뒤 `https://<owner>.github.io/<repo>/`가 공개 URL이 된다.

### 4. 새 레포에서 가장 먼저 바꿀 파일 1개

새 전시회 레포를 만든 뒤 [exhibition.setup.yml](exhibition.setup.yml)만 수정하면 된다. 이 파일을 기준으로 `_config.yml`, `assets/js/config.js`, `_exhibition/index.md`가 자동 생성된다.

예:

```yml
repository:
  separator: "-"
  suffix: 2026-spring

site:
  title: Exhibition 2026 Spring
  description: Public archive for the 2026 Spring exhibition.
  dates: 2026.03.20 - 2026.04.12
  venue: Filter Archive, Seoul
  tagline: Spring edition of the filter exhibition archive.
  poster_image: /assets/exhibition/poster-template.svg
  hero_alt: Exhibition 2026 Spring poster

content:
  exhibition_markdown: |
    전시 설명 본문
```

설정 규칙:

- `repository.suffix`만 바꾸면 `exhibition-2026-spring` 같은 repo 이름이 자동 계산된다.
- `repository.separator`를 `_`로 바꾸면 `exhibition_2026_spring`도 만들 수 있다.
- 접두사 `exhibition`은 고정이다.
- Worker URL은 `https://exhibition-worker.filter-log.workers.dev`로 고정이다.
- GitHub Pages base URL과 Pages CMS URL도 자동 계산된다.

자동 생성 대상:

- `_config.yml`
- `assets/js/config.js`
- `_exhibition/index.md`

즉 비전공자는 이 세 파일을 직접 건드릴 필요가 없다.

## 업로드와 콘텐츠 구조

### 작품 1개 = `_artworks/{slug}.md`

Worker와 Pages CMS가 같은 front matter를 사용한다.

예:

```md
---
title: "River Surface"
slug: "kim-minseo-river-surface"
artist_name: "Kim Minseo"
artist_slug: "kim-minseo"
camera_model: "Fujifilm GFX 50R"
location: "Hangang, Seoul"
sns_id: "@example"
image: "/assets/uploads/originals/kim-minseo-river-surface.jpg"
thumb_image: "/assets/uploads/thumbs/kim-minseo-river-surface.webp"
featured: true
order: 2
---
작품 설명 본문
```

파일명 규칙:

- 원본 이미지: `assets/uploads/originals/{artist}-{title}.ext`
- 썸네일: `assets/uploads/thumbs/{artist}-{title}.webp`
- 작품 Markdown: `_artworks/{artist}-{title}.md`

### 작가 1명 = `_artists/{slug}.md`

예:

```md
---
name: "Kim Minseo"
slug: "kim-minseo"
camera_model: "Fujifilm GFX 50R"
order: 2
---
작가 설명 본문
```

### 전시회 정보 = `_exhibition/index.md`

전시회 정보는 단일 파일로 유지한다. Worker 업로드 페이지와 Pages CMS 모두 이 파일을 수정한다.

## Pages CMS 사용법

`exhibition-template`에는 `.pages.yml`이 이미 들어 있다. 즉 새 전시회 레포를 만들면 바로 Pages CMS에서 아래 작업을 할 수 있다.

- Exhibition Info 단일 파일 편집
- Artists 컬렉션 생성/수정
- Artworks 컬렉션 생성/수정
- 원본 이미지와 전시 포스터 업로드

### Pages CMS에서 작품 post를 직접 만드는 방법

1. `https://app.pagescms.org/<owner>/<repo>/main`을 연다.
2. `Artworks` 컬렉션으로 이동한다.
3. `Create`를 누른다.
4. 아래 필드를 채운다.
   - `title`
   - `slug`
   - `artist_name`
   - `artist_slug`
   - `camera_model`
   - `location`
   - `sns_id` 선택
   - `image`
   - `body`
5. `slug`는 업로드 UI와 같은 `{artist}-{title}` 머신 이름을 넣는다.
6. 저장하면 GitHub에 `_artworks/{slug}.md`가 생성된다.
7. GitHub Actions가 썸네일과 `data/artworks.json`을 자동 갱신한다.

즉 업로드 페이지와 Pages CMS는 같은 마크다운 구조를 공유한다.

## 업로드 페이지 동작 방식

세 업로드 페이지는 모두 같은 공통 Worker를 호출한다.

- `/upload/artwork/` -> `POST /upload/artwork`
- `/upload/artist/` -> `POST /upload/artist`
- `/upload/exhibition/` -> `POST /upload/exhibition`

프론트엔드 동작:

1. `exhibition.setup.yml`에서 생성된 `assets/js/config.js`가 `repoName`을 읽는다.
2. 화면에서 입력값으로 저장 경로 preview를 만든다.
3. `POST /auth`로 공통 암호를 검증한다.
4. 발급받은 Bearer 토큰으로 실제 업로드 엔드포인트를 호출한다.
5. Worker는 GitHub REST API로 현재 레포에 파일을 저장한다.
6. 이후 해당 레포의 GitHub Actions가 썸네일과 공개용 JSON을 갱신한다.

중요:

- 요청 payload에는 항상 `repoName`이 포함된다.
- 공용 Worker는 `repoName` prefix가 `exhibition`인지 검사한다.

## 썸네일 생성 구조

썸네일은 Worker가 아니라 GitHub Actions가 만든다.

이 구조를 선택한 이유:

- Worker는 GitHub 저장과 인증만 맡아 단순해진다.
- 썸네일 생성 실패가 업로드 API를 직접 깨뜨리지 않는다.
- 각 전시회 레포에서 재실행이 가능해 복구가 쉽다.
- 원본은 그대로 보존하고, 타일 뷰 전용 썸네일만 안정적으로 만들 수 있다.

워크플로:

1. Worker 또는 Pages CMS가 원본 이미지와 Markdown을 커밋한다.
2. `.github/workflows/sync-exhibition-assets.yml`가 실행된다.
3. `scripts/sync-exhibition-assets.mjs`가 `assets/uploads/originals/`를 읽는다.
4. 각 작품 slug 기준으로 `.webp` 썸네일을 생성한다.
5. `data/artworks.json`, `data/artists.json`, `data/exhibition.json`을 갱신한다.
6. GitHub Actions가 결과를 다시 커밋한다.

## 비전공자용 빠른 절차

1. `exhibition-template`에서 새 레포를 만든다.
2. `Settings -> Pages`에서 Pages를 켠다.
3. `exhibition.setup.yml` 한 파일만 수정한다.
4. `Sync Template Settings` 워크플로가 `_config.yml`, `assets/js/config.js`, `_exhibition/index.md`를 자동 갱신한다.
5. Pages CMS에 접속해서 작가/작품을 직접 만들거나 업로드 페이지를 사용한다.
6. 업로드가 끝나면 GitHub Actions가 썸네일을 자동 생성한다.

## 로컬 메모

썸네일과 공개용 JSON을 직접 갱신하고 싶다면:

```bash
npm install
npm run sync:template
npm run sync:assets
```

## 참고 문서

- 아키텍처 개요: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- 운영 가이드: [docs/OPERATIONS.md](docs/OPERATIONS.md)
