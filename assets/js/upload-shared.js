(function () {
  function normalizeBaseUrl(value) {
    return String(value || "").trim().replace(/\/+$/, "");
  }

  function inferRepoName() {
    const parts = window.location.pathname.split("/").filter(Boolean);
    return parts[0] || "exhibition-template";
  }

  function getConfig() {
    const rawConfig = window.EXHIBITION_CONFIG || {};

    return {
      repoName: rawConfig.repoName || inferRepoName(),
      siteUrl: normalizeBaseUrl(rawConfig.siteUrl || `${window.location.origin}/${inferRepoName()}`),
      workerApiUrl: normalizeBaseUrl(rawConfig.workerApiUrl || ""),
      pagesCmsUrl: String(rawConfig.pagesCmsUrl || "").trim(),
      maxArtworkDescriptionLength: Number(rawConfig.maxArtworkDescriptionLength || 200),
      maxArtistDescriptionLength: Number(rawConfig.maxArtistDescriptionLength || 500)
    };
  }

  function slugify(value) {
    return String(value || "")
      .trim()
      .normalize("NFKC")
      .replace(/[\\/]+/g, " ")
      .replace(/[^\p{L}\p{N}\s-]+/gu, " ")
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
  }

  function fileExtension(fileName) {
    const match = String(fileName || "").toLowerCase().match(/(\.[a-z0-9]+)$/i);
    return match ? match[1] : "";
  }

  function buildRuntimeSummary(config) {
    return {
      repoName: config.repoName,
      workerApiUrl: config.workerApiUrl || "Preview only",
      siteUrl: config.siteUrl || "-",
      pagesCmsUrl: config.pagesCmsUrl || "-"
    };
  }

  function fillRuntimeSummary(config) {
    const summary = buildRuntimeSummary(config);
    setText("runtime-repo-name", summary.repoName);
    setText("runtime-worker-endpoint", summary.workerApiUrl);
    setText("runtime-site-url", summary.siteUrl);
    setText("runtime-cms-url", summary.pagesCmsUrl);
  }

  async function fetchHealth(config) {
    if (!config.workerApiUrl) {
      return {
        ok: false,
        configured: false,
        previewOnly: true,
        message: "Worker URL이 비어 있어서 현재는 preview mode로 동작한다."
      };
    }

    const response = await fetch(`${config.workerApiUrl}/health`, {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || `Health check failed with ${response.status}`);
    }

    return payload;
  }

  async function authenticate(config, password) {
    if (!config.workerApiUrl) {
      return {
        ok: false,
        previewOnly: true
      };
    }

    const response = await fetch(`${config.workerApiUrl}/auth`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ password })
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || `Authentication failed with ${response.status}`);
    }

    return payload;
  }

  async function submitMultipart(config, endpointPath, formData, authToken) {
    if (!config.workerApiUrl) {
      return {
        ok: false,
        previewOnly: true
      };
    }

    const response = await fetch(`${config.workerApiUrl}${endpointPath}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${authToken}`
      },
      body: formData
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || `Upload failed with ${response.status}`);
    }

    return payload;
  }

  function setStatus(node, message, tone = "info") {
    node.textContent = message;
    node.dataset.tone = tone;
  }

  function setText(id, value) {
    const node = document.getElementById(id);
    if (node) {
      node.textContent = value;
    }
  }

  function renderJson(node, value) {
    node.textContent = JSON.stringify(value, null, 2);
  }

  function setCharCount(input, counterNode, limit) {
    counterNode.textContent = String(input.value.length);
    counterNode.parentElement?.classList.toggle("is-over", input.value.length > limit);
  }

  window.ExhibitionUpload = {
    getConfig,
    slugify,
    fileExtension,
    fillRuntimeSummary,
    fetchHealth,
    authenticate,
    submitMultipart,
    setStatus,
    renderJson,
    setCharCount
  };
})();

