# Architecture

## 목표

- 전시회 하나당 저장소 하나
- 정적 사이트와 콘텐츠 파일과 이미지 파일을 모두 한 저장소에서 운영
- 업로드 인증과 GitHub 쓰기는 공통 Worker 하나로 통합
- Pages CMS와 업로드 UI가 같은 Markdown 스키마를 사용
- 썸네일 생성은 GitHub Actions로 분리

## 데이터 모델

### `_artworks`

- 작품당 Markdown 1개
- Jekyll collection으로 상세 페이지 출력
- 업로드 UI와 Pages CMS가 같은 front matter 사용

### `_artists`

- 작가당 Markdown 1개
- 작가 목록 페이지에서 사용
- 작품 업로드 시 없는 작가 파일은 Worker가 스텁으로 자동 생성 가능

### `_exhibition/index.md`

- 전시회 정보 단일 파일
- 랜딩 페이지와 footer, 공개 메타데이터의 기준

### 이미지

- 원본: `assets/uploads/originals/`
- 썸네일: `assets/uploads/thumbs/`
- 전시 포스터: `assets/exhibition/`

## 렌더링

- GitHub Pages의 기본 Jekyll 빌드를 사용
- 랜딩, 작가, 작품 목록은 정적 HTML + Liquid로 렌더링
- 작품 상세 페이지는 `_artworks` output collection으로 생성
- `data/*.json`은 외부 도구나 향후 JS 확장을 위해 함께 공개

## 업로드 흐름

1. 전시 레포의 업로드 페이지가 `repoName`과 입력값을 준비한다.
2. 공통 Worker에 비밀번호 인증을 요청한다.
3. Worker는 `repoName`이 `exhibition` prefix인지 검사한다.
4. Worker가 GitHub REST API로 원본 이미지와 Markdown을 저장한다.
5. 저장소의 GitHub Actions가 썸네일과 `data/*.json`을 갱신한다.

## 왜 Worker와 Actions를 분리했는가

- Worker는 인증과 GitHub 파일 쓰기에 집중하므로 유지보수가 쉽다.
- 이미지 처리는 GitHub Actions에서 재시도와 재실행이 쉽다.
- 전시회별로 독립 실행되므로 특정 레포만 재빌드해도 된다.

