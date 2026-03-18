import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parse, stringify } from "yaml";

const REPO_PREFIX = "exhibition";
const GITHUB_OWNER = "filter-log";
const PUBLIC_BASE_URL = "https://filter-log.github.io";
const PAGES_CMS_BASE_URL = "https://app.pagescms.org";
const FIXED_WORKER_API_URL = "https://exhibition-worker.filter-log.workers.dev";

const repoRoot = process.cwd();
const setupPath = path.join(repoRoot, "exhibition.setup.yml");

const setup = parse(await readFile(setupPath, "utf8"));
const repoSeparator = normalizeSeparator(setup?.repository?.separator);
const repoSuffix = readString(setup?.repository?.suffix, "template");
const repoName = `${REPO_PREFIX}${repoSeparator}${repoSuffix}`;

const githubOwner = GITHUB_OWNER;
const publicBaseUrl = PUBLIC_BASE_URL;
const pagesCmsBaseUrl = PAGES_CMS_BASE_URL;
const workerApiUrl = FIXED_WORKER_API_URL;

const siteTitle = readString(setup?.site?.title, "Exhibition");
const siteDescription = readString(
  setup?.site?.description,
  "Reusable archive template for photography exhibitions on GitHub Pages."
);
const siteDates = readString(setup?.site?.dates, "");
const siteVenue = readString(setup?.site?.venue, "");
const siteTagline = readString(setup?.site?.tagline, "");
const posterImage = readString(setup?.site?.poster_image, "/assets/exhibition/poster-template.svg");
const heroAlt = readString(setup?.site?.hero_alt, `${siteTitle} poster`);
const exhibitionMarkdown = String(setup?.content?.exhibition_markdown || "").trim();

const siteUrl = `${publicBaseUrl}/${repoName}`;
const pagesCmsUrl = `${pagesCmsBaseUrl}/${githubOwner}/${repoName}/main`;

await writeFile(path.join(repoRoot, "_config.yml"), buildJekyllConfig());
await writeFile(path.join(repoRoot, "assets", "js", "config.js"), buildClientConfig());
await writeFile(path.join(repoRoot, "_exhibition", "index.md"), buildExhibitionDocument());

console.log(`Synced template config for ${repoName}.`);

function buildJekyllConfig() {
  const config = {
    title: siteTitle,
    description: siteDescription,
    url: publicBaseUrl,
    baseurl: `/${repoName}`,
    timezone: "Asia/Seoul",
    markdown: "kramdown",
    permalink: "pretty",
    collections: {
      artworks: {
        output: true,
        permalink: "/photos/:name/"
      },
      artists: {
        output: false
      },
      exhibition: {
        output: false
      }
    },
    defaults: [
      {
        scope: {
          path: ""
        },
        values: {
          layout: "default"
        }
      },
      {
        scope: {
          path: "",
          type: "artworks"
        },
        values: {
          layout: "artwork"
        }
      }
    ]
  };

  return `# Generated from exhibition.setup.yml. Edit that file instead.\n${stringify(config)}`;
}

function buildClientConfig() {
  return `// Generated from exhibition.setup.yml. Edit that file instead.\nwindow.EXHIBITION_CONFIG = ${JSON.stringify(
    {
      repoName,
      siteUrl,
      workerApiUrl,
      pagesCmsUrl,
      maxArtworkDescriptionLength: 200,
      maxArtistDescriptionLength: 500
    },
    null,
    2
  )};\n`;
}

function buildExhibitionDocument() {
  const frontMatter = stringify({
    title: siteTitle,
    slug: repoName,
    dates: siteDates,
    venue: siteVenue,
    tagline: siteTagline,
    poster_image: posterImage,
    hero_alt: heroAlt,
    cms_url: pagesCmsUrl,
    public_url: siteUrl
  }).trim();

  return `---\n${frontMatter}\n---\n${exhibitionMarkdown}\n`;
}

function readString(value, fallback) {
  const normalized = String(value || "").trim();
  return normalized || fallback;
}

function trimTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function normalizeSeparator(value) {
  const normalized = String(value || "-").trim();
  return normalized === "_" ? "_" : "-";
}
