const exhibitionUpload = window.ExhibitionUpload;
const exhibitionConfig = exhibitionUpload.getConfig();

const exhibitionForm = document.getElementById("exhibition-upload-form");
const exhibitionTitleInput = document.getElementById("exhibition-title");
const exhibitionDescriptionInput = document.getElementById("exhibition-description");
const exhibitionPosterInput = document.getElementById("exhibition-poster");
const exhibitionPasswordInput = document.getElementById("exhibition-password");
const exhibitionStatusNode = document.getElementById("exhibition-status");
const exhibitionPayloadPreview = document.getElementById("exhibition-payload-preview");
const exhibitionResponsePreview = document.getElementById("exhibition-response-preview");
const exhibitionRuntimeWorkerState = document.getElementById("runtime-worker-state");

exhibitionUpload.fillRuntimeSummary(exhibitionConfig);
exhibitionUpload.setStatus(exhibitionStatusNode, "전시회 정보 payload를 계산하는 중이다.");
refreshExhibitionPreview();

exhibitionUpload
  .fetchHealth(exhibitionConfig)
  .then((payload) => {
    if (payload.previewOnly) {
      exhibitionRuntimeWorkerState.textContent = "Preview only";
      exhibitionUpload.setStatus(exhibitionStatusNode, payload.message, "info");
      return;
    }

    exhibitionRuntimeWorkerState.textContent = `Ready (${payload.allowedRepoPrefix || "exhibition"})`;
    exhibitionUpload.setStatus(
      exhibitionStatusNode,
      "Worker가 연결되었다. 업로드 시 /auth 후 /upload/exhibition으로 전송한다.",
      "success"
    );
  })
  .catch((error) => {
    exhibitionRuntimeWorkerState.textContent = "Unavailable";
    exhibitionUpload.setStatus(exhibitionStatusNode, error.message, "error");
  });

[exhibitionTitleInput, exhibitionDescriptionInput, exhibitionPosterInput].forEach((input) =>
  input.addEventListener("input", refreshExhibitionPreview)
);

exhibitionForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  refreshExhibitionPreview();

  if (!exhibitionConfig.workerApiUrl) {
    exhibitionUpload.renderJson(exhibitionResponsePreview, {
      ok: false,
      previewOnly: true,
      message: "Worker URL이 비어 있어서 실제 업로드 대신 payload만 확인했다."
    });
    exhibitionUpload.setStatus(exhibitionStatusNode, "Preview mode로 payload만 확인했다.", "info");
    return;
  }

  try {
    exhibitionUpload.setStatus(exhibitionStatusNode, "비밀번호를 검증하는 중이다.");
    const authPayload = await exhibitionUpload.authenticate(exhibitionConfig, exhibitionPasswordInput.value);

    exhibitionUpload.setStatus(exhibitionStatusNode, "전시회 정보와 포스터를 저장하는 중이다.");
    const formData = new FormData();
    formData.append("repoName", exhibitionConfig.repoName);
    formData.append("title", exhibitionTitleInput.value.trim());
    formData.append("description", exhibitionDescriptionInput.value.trim());
    if (exhibitionPosterInput.files?.[0]) {
      formData.append("poster", exhibitionPosterInput.files[0]);
    }

    const responsePayload = await exhibitionUpload.submitMultipart(
      exhibitionConfig,
      "/upload/exhibition",
      formData,
      authPayload.authToken
    );
    exhibitionUpload.renderJson(exhibitionResponsePreview, responsePayload);
    exhibitionUpload.setStatus(exhibitionStatusNode, "전시회 정보 업로드가 완료되었다.", "success");
  } catch (error) {
    exhibitionUpload.renderJson(exhibitionResponsePreview, {
      ok: false,
      error: error.message
    });
    exhibitionUpload.setStatus(exhibitionStatusNode, error.message, "error");
  }
});

function buildExhibitionPayload() {
  const title = exhibitionTitleInput.value.trim();
  const posterFile = exhibitionPosterInput.files?.[0];
  const posterStem = exhibitionUpload.slugify(title || posterFile?.name || "poster") || "poster";
  const posterExt = exhibitionUpload.fileExtension(posterFile?.name || ".jpg") || ".jpg";

  return {
    endpoint: exhibitionConfig.workerApiUrl ? `${exhibitionConfig.workerApiUrl}/upload/exhibition` : "Preview only",
    repoName: exhibitionConfig.repoName,
    fields: {
      title,
      description: exhibitionDescriptionInput.value.trim()
    },
    files: {
      exhibitionMarkdown: "_exhibition/index.md",
      posterImage: posterFile ? `assets/exhibition/${posterStem}${posterExt}` : "No poster selected"
    }
  };
}

function refreshExhibitionPreview() {
  exhibitionUpload.renderJson(exhibitionPayloadPreview, buildExhibitionPayload());
}

