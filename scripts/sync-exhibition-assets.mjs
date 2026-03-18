import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const repoRoot = process.cwd();
const artworksDir = path.join(repoRoot, "_artworks");
const artistsDir = path.join(repoRoot, "_artists");
const exhibitionFile = path.join(repoRoot, "_exhibition", "index.md");
const thumbsDir = path.join(repoRoot, "assets", "uploads", "thumbs");
const dataDir = path.join(repoRoot, "data");
const thumbEdge = Number(process.env.THUMB_LONG_EDGE || 720);
const thumbQuality = Number(process.env.WEBP_QUALITY || 82);

const exhibition = await readDocument(exhibitionFile);
const artworks = await readCollection(artworksDir);
const artists = await readCollection(artistsDir);

for (const artwork of artworks) {
  await ensureArtworkThumb(artwork);
}

await mkdir(dataDir, { recursive: true });

await writeJson(path.join(dataDir, "exhibition.json"), {
  ...exhibition.data,
  body: exhibition.body
});

await writeJson(
  path.join(dataDir, "artists.json"),
  artists
    .sort((left, right) => compareByOrder(left, right, "name"))
    .map((artist) => ({
      ...artist.data,
      portrait_image: artist.data.portrait_image || "/assets/exhibition/artist-placeholder.svg",
      body: artist.body
    }))
);

await writeJson(
  path.join(dataDir, "artworks.json"),
  artworks
    .sort((left, right) => compareByOrder(left, right, "title"))
    .map((artwork) => {
      const thumbPath = artwork.data.thumb_image || `/assets/uploads/thumbs/${artwork.data.slug}.webp`;

      return {
        ...artwork.data,
        thumb_image: thumbPath,
        url: `/photos/${artwork.data.slug}/`,
        body: artwork.body
      };
    })
);

console.log(`Synced ${artworks.length} artwork(s), ${artists.length} artist(s), and exhibition metadata.`);

async function readCollection(collectionDir) {
  const entries = await readdir(collectionDir, { withFileTypes: true });
  const documents = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue;
    }

    documents.push(await readDocument(path.join(collectionDir, entry.name)));
  }

  return documents;
}

async function readDocument(filePath) {
  const raw = await readFile(filePath, "utf8");
  const { data, body } = parseFrontMatter(raw);

  return {
    filePath,
    data,
    body
  };
}

function parseFrontMatter(source) {
  if (!source.startsWith("---\n")) {
    return {
      data: {},
      body: source.trim()
    };
  }

  const lines = source.split("\n");
  const data = {};
  let cursor = 1;

  for (; cursor < lines.length; cursor += 1) {
    const line = lines[cursor];

    if (line === "---") {
      cursor += 1;
      break;
    }

    const match = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    data[key] = parseScalar(rawValue);
  }

  return {
    data,
    body: lines.slice(cursor).join("\n").trim()
  };
}

function parseScalar(rawValue) {
  const value = String(rawValue || "").trim();

  if (!value.length) {
    return "";
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  return value;
}

async function ensureArtworkThumb(artwork) {
  const originalRelative = stripLeadingSlash(artwork.data.image);
  if (!originalRelative || !artwork.data.slug) {
    return;
  }

  const sourcePath = path.join(repoRoot, originalRelative);
  const thumbPath = path.join(thumbsDir, `${artwork.data.slug}.webp`);

  try {
    const [sourceStat, existingThumbStat] = await Promise.all([
      stat(sourcePath),
      stat(thumbPath).catch(() => null)
    ]);

    if (existingThumbStat && existingThumbStat.mtimeMs >= sourceStat.mtimeMs) {
      return;
    }

    await mkdir(path.dirname(thumbPath), { recursive: true });
    await sharp(sourcePath, { failOn: "none" })
      .rotate()
      .resize({
        width: thumbEdge,
        height: thumbEdge,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({ quality: thumbQuality })
      .toFile(thumbPath);
  } catch (error) {
    console.warn(`Failed to generate thumbnail for ${artwork.data.slug}: ${error.message}`);
  }
}

function compareByOrder(left, right, fallbackField) {
  const leftOrder = Number.isFinite(left.data.order) ? left.data.order : Number.MAX_SAFE_INTEGER;
  const rightOrder = Number.isFinite(right.data.order) ? right.data.order : Number.MAX_SAFE_INTEGER;

  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }

  return String(left.data[fallbackField] || "").localeCompare(String(right.data[fallbackField] || ""));
}

function stripLeadingSlash(value) {
  return String(value || "").replace(/^\/+/, "");
}

async function writeJson(filePath, payload) {
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}
