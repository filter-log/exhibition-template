const artworkUpload = window.ExhibitionUpload;
const artworkConfig = artworkUpload.getConfig();

const artworkForm = document.getElementById("artwork-upload-form");
const artworkImageInput = document.getElementById("artwork-image");
const artworkTitleInput = document.getElementById("artwork-title");
const artworkArtistInput = document.getElementById("artwork-artist");
const artworkCameraInput = document.getElementById("artwork-camera");
const artworkLocationInput = document.getElementById("artwork-location");
const artworkSnsInput = document.getElementById("artwork-sns");
const artworkDescriptionInput = document.getElementById("artwork-description");
const artworkDescriptionCount = document.getElementById("artwork-description-count");
const artworkPasswordInput = document.getElementById("artwork-password");
const artworkStatusNode = document.getElementById("artwork-status");
const artworkPayloadPreview = document.getElementById("artwork-payload-preview");
const artworkResponsePreview = document.getElementById("artwork-response-preview");
const runtimeWorkerState = document.getElementById("runtime-worker-state");

artworkUpload.fillRuntimeSummary(artworkConfig);
artworkUpload.setStatus(artworkStatusNode, "작품 업로드 payload를 계산하는 중이다.");
artworkUpload.setCharCount(
  artworkDescriptionInput,
  artworkDescriptionCount,
  artworkConfig.maxArtworkDescriptionLength
);
refreshArtworkPreview();

artworkUpload
  .fetchHealth(artworkConfig)
  .then((payload) => {
    if (payload.previewOnly) {
      runtimeWorkerState.textContent = "Preview only";
      artworkUpload.setStatus(artworkStatusNode, payload.message, "info");
      return;
    }

    runtimeWorkerState.textContent = `Ready (${payload.allowedRepoPrefix || "exhibition"})`;
    artworkUpload.setStatus(
      artworkStatusNode,
      "Worker가 연결되었다. 업로드 시 /auth 후 /upload/artwork로 전송한다.",
      "success"
    );
  })
  .catch((error) => {
    runtimeWorkerState.textContent = "Unavailable";
    artworkUpload.setStatus(artworkStatusNode, error.message, "error");
  });

[artworkImageInput, artworkTitleInput, artworkArtistInput, artworkCameraInput, artworkLocationInput, artworkSnsInput].forEach(
  (input) => input.addEventListener("input", refreshArtworkPreview)
);

artworkDescriptionInput.addEventListener("input", () => {
  artworkUpload.setCharCount(
    artworkDescriptionInput,
    artworkDescriptionCount,
    artworkConfig.maxArtworkDescriptionLength
  );
  refreshArtworkPreview();
});

artworkForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  refreshArtworkPreview();

  if (!artworkImageInput.files?.length) {
    artworkUpload.setStatus(artworkStatusNode, "이미지 파일을 먼저 선택해야 한다.", "error");
    return;
  }

  if (artworkDescriptionInput.value.length > artworkConfig.maxArtworkDescriptionLength) {
    artworkUpload.setStatus(artworkStatusNode, "작품 설명은 200자를 넘길 수 없다.", "error");
    return;
  }

  const payload = buildArtworkPayload();

  if (!artworkConfig.workerApiUrl) {
    artworkUpload.renderJson(artworkResponsePreview, {
      ok: false,
      previewOnly: true,
      message: "Worker URL이 비어 있어서 실제 업로드 대신 payload만 확인했다."
    });
    artworkUpload.setStatus(artworkStatusNode, "Preview mode로 payload만 확인했다.", "info");
    return;
  }

  try {
    artworkUpload.setStatus(artworkStatusNode, "비밀번호를 검증하는 중이다.");
    const authPayload = await artworkUpload.authenticate(artworkConfig, artworkPasswordInput.value);

    artworkUpload.setStatus(artworkStatusNode, "작품 이미지와 Markdown을 저장하는 중이다.");
    const formData = new FormData();
    formData.append("repoName", artworkConfig.repoName);
    formData.append("title", artworkTitleInput.value.trim());
    formData.append("artistName", artworkArtistInput.value.trim());
    formData.append("cameraModel", artworkCameraInput.value.trim());
    formData.append("location", artworkLocationInput.value.trim());
    formData.append("snsId", artworkSnsInput.value.trim());
    formData.append("description", artworkDescriptionInput.value.trim());
    formData.append("image", artworkImageInput.files[0]);

    const responsePayload = await artworkUpload.submitMultipart(
      artworkConfig,
      "/upload/artwork",
      formData,
      authPayload.authToken
    );
    artworkUpload.renderJson(artworkResponsePreview, responsePayload);
    artworkUpload.setStatus(artworkStatusNode, "작품 업로드가 완료되었다.", "success");
  } catch (error) {
    artworkUpload.renderJson(artworkResponsePreview, {
      ok: false,
      error: error.message
    });
    artworkUpload.setStatus(artworkStatusNode, error.message, "error");
  }
});

function buildArtworkPayload() {
  const artistName = artworkArtistInput.value.trim();
  const title = artworkTitleInput.value.trim();
  const artistSlug = artworkUpload.slugify(artistName);
  const artworkSlug = artworkUpload.slugify(`${artistName}-${title}`);
  const imageFile = artworkImageInput.files?.[0];
  const extension = artworkUpload.fileExtension(imageFile?.name || ".jpg") || ".jpg";

  return {
    endpoint: artworkConfig.workerApiUrl ? `${artworkConfig.workerApiUrl}/upload/artwork` : "Preview only",
    repoName: artworkConfig.repoName,
    fields: {
      title,
      artistName,
      cameraModel: artworkCameraInput.value.trim(),
      location: artworkLocationInput.value.trim(),
      snsId: artworkSnsInput.value.trim(),
      description: artworkDescriptionInput.value.trim()
    },
    files: {
      originalImage: `assets/uploads/originals/${artworkSlug}${extension}`,
      thumbnail: `assets/uploads/thumbs/${artworkSlug}.webp`,
      artworkMarkdown: `_artworks/${artworkSlug}.md`,
      artistFallbackMarkdown: `_artists/${artistSlug}.md`
    }
  };
}

function refreshArtworkPreview() {
  artworkUpload.renderJson(artworkPayloadPreview, buildArtworkPayload());
}

