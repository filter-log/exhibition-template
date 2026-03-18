const artistUpload = window.ExhibitionUpload;
const artistConfig = artistUpload.getConfig();

const artistForm = document.getElementById("artist-upload-form");
const artistNameInput = document.getElementById("artist-name");
const artistCameraInput = document.getElementById("artist-camera");
const artistBioInput = document.getElementById("artist-bio");
const artistBioCount = document.getElementById("artist-bio-count");
const artistPasswordInput = document.getElementById("artist-password");
const artistStatusNode = document.getElementById("artist-status");
const artistPayloadPreview = document.getElementById("artist-payload-preview");
const artistResponsePreview = document.getElementById("artist-response-preview");
const artistRuntimeWorkerState = document.getElementById("runtime-worker-state");

artistUpload.fillRuntimeSummary(artistConfig);
artistUpload.setStatus(artistStatusNode, "작가 정보 payload를 계산하는 중이다.");
artistUpload.setCharCount(artistBioInput, artistBioCount, artistConfig.maxArtistDescriptionLength);
refreshArtistPreview();

artistUpload
  .fetchHealth(artistConfig)
  .then((payload) => {
    if (payload.previewOnly) {
      artistRuntimeWorkerState.textContent = "Preview only";
      artistUpload.setStatus(artistStatusNode, payload.message, "info");
      return;
    }

    artistRuntimeWorkerState.textContent = `Ready (${payload.allowedRepoPrefix || "exhibition"})`;
    artistUpload.setStatus(
      artistStatusNode,
      "Worker가 연결되었다. 업로드 시 /auth 후 /upload/artist로 전송한다.",
      "success"
    );
  })
  .catch((error) => {
    artistRuntimeWorkerState.textContent = "Unavailable";
    artistUpload.setStatus(artistStatusNode, error.message, "error");
  });

[artistNameInput, artistCameraInput].forEach((input) => input.addEventListener("input", refreshArtistPreview));

artistBioInput.addEventListener("input", () => {
  artistUpload.setCharCount(artistBioInput, artistBioCount, artistConfig.maxArtistDescriptionLength);
  refreshArtistPreview();
});

artistForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  refreshArtistPreview();

  if (artistBioInput.value.length > artistConfig.maxArtistDescriptionLength) {
    artistUpload.setStatus(artistStatusNode, "작가 설명은 500자를 넘길 수 없다.", "error");
    return;
  }

  if (!artistConfig.workerApiUrl) {
    artistUpload.renderJson(artistResponsePreview, {
      ok: false,
      previewOnly: true,
      message: "Worker URL이 비어 있어서 실제 업로드 대신 payload만 확인했다."
    });
    artistUpload.setStatus(artistStatusNode, "Preview mode로 payload만 확인했다.", "info");
    return;
  }

  try {
    artistUpload.setStatus(artistStatusNode, "비밀번호를 검증하는 중이다.");
    const authPayload = await artistUpload.authenticate(artistConfig, artistPasswordInput.value);

    artistUpload.setStatus(artistStatusNode, "작가 Markdown을 저장하는 중이다.");
    const formData = new FormData();
    formData.append("repoName", artistConfig.repoName);
    formData.append("artistName", artistNameInput.value.trim());
    formData.append("cameraModel", artistCameraInput.value.trim());
    formData.append("bio", artistBioInput.value.trim());

    const responsePayload = await artistUpload.submitMultipart(
      artistConfig,
      "/upload/artist",
      formData,
      authPayload.authToken
    );
    artistUpload.renderJson(artistResponsePreview, responsePayload);
    artistUpload.setStatus(artistStatusNode, "작가 정보 업로드가 완료되었다.", "success");
  } catch (error) {
    artistUpload.renderJson(artistResponsePreview, {
      ok: false,
      error: error.message
    });
    artistUpload.setStatus(artistStatusNode, error.message, "error");
  }
});

function buildArtistPayload() {
  const artistName = artistNameInput.value.trim();
  const artistSlug = artistUpload.slugify(artistName);

  return {
    endpoint: artistConfig.workerApiUrl ? `${artistConfig.workerApiUrl}/upload/artist` : "Preview only",
    repoName: artistConfig.repoName,
    fields: {
      artistName,
      cameraModel: artistCameraInput.value.trim(),
      bio: artistBioInput.value.trim()
    },
    files: {
      artistMarkdown: `_artists/${artistSlug}.md`
    }
  };
}

function refreshArtistPreview() {
  artistUpload.renderJson(artistPayloadPreview, buildArtistPayload());
}

