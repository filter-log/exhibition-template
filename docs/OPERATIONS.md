# Operations

## 새 전시회 시작 체크리스트

1. `Use this template`로 `exhibition-*` 이름의 새 레포 생성
2. GitHub Pages 활성화
3. `_config.yml` 수정
4. `assets/js/config.js` 수정
5. `_exhibition/index.md` 수정
6. 공용 Worker URL 입력
7. Pages CMS 접속 확인

## 작품 업로드 후 기대 동작

1. Worker가 원본 이미지와 `_artworks/{slug}.md`를 저장
2. 필요하면 `_artists/{artist}.md` 스텁도 저장
3. GitHub Actions가 `assets/uploads/thumbs/{slug}.webp` 생성
4. `data/artworks.json`과 `data/artists.json` 갱신
5. 공개 페이지에서 썸네일과 상세 링크 반영

## 자주 수정하는 파일

- `_config.yml`: GitHub Pages base URL
- `assets/js/config.js`: 레포 이름, Worker URL, CMS URL
- `_exhibition/index.md`: 전시 제목, 설명, 일정, 장소, 포스터

## Pages CMS 운영 팁

- 작가나 작품을 Pages CMS에서 만들 때 `slug`는 업로드 UI와 같은 규칙을 유지
- 작품 이미지는 `assets/uploads/originals/`에 두면 GitHub Actions가 썸네일을 생성
- `thumb_image`가 비어 있어도 템플릿은 `{slug}.webp` 경로를 기본값으로 사용

## 문제 해결

### 썸네일이 안 보일 때

- GitHub Actions 실행 결과를 먼저 확인
- 원본 이미지가 `assets/uploads/originals/`에 있는지 확인
- 작품 파일의 `slug`가 올바른지 확인

### 업로드 페이지가 preview only로 보일 때

- `assets/js/config.js`의 `workerApiUrl`이 비어 있는지 확인

### Worker가 업로드를 거부할 때

- 레포 이름이 `exhibition`으로 시작하는지 확인
- 비밀번호가 Cloudflare secret과 맞는지 확인
- `repoName`이 `assets/js/config.js`와 실제 저장소 이름과 같은지 확인

