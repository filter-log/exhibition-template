---
title: "Filter Spring Exhibition"
slug: "filter-spring-exhibition"
dates: "2026.03.20 - 2026.04.12"
venue: "Filter Archive, Seoul"
tagline: "A minimal archive for photographs, artist notes, and exhibition metadata."
poster_image: "/assets/exhibition/poster-template.svg"
hero_alt: "Filter Spring Exhibition poster"
cms_url: "https://app.pagescms.org/filter-log/exhibition-template/main"
public_url: "https://filter-log.github.io/exhibition-template"
---
`exhibition-template`는 새로운 전시회 저장소를 빠르게 시작하기 위한 기본 아카이브다. 상단의 포스터와 설명, 하단의 썸네일 타일, 작가 목록, 업로드 UI, Pages CMS, GitHub Actions 후처리 파이프라인이 하나의 저장소 안에서 함께 동작하도록 설계했다.

새 전시회를 만들 때는 이 파일의 제목, 설명, 날짜, 장소, 포스터만 바꾸면 랜딩 페이지의 주요 텍스트가 즉시 반영된다. 작품과 작가 데이터는 각각 컬렉션 파일로 분리되어 있어서 Pages CMS와 Worker 업로드가 같은 마크다운 구조를 공유한다.

