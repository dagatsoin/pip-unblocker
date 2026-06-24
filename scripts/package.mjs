/**
 * Builds the Chrome Web Store / Edge Add-ons upload ZIP with **zero external
 * dependencies** — a small hand-rolled ZIP writer on top of Node's built-in
 * `zlib`. No `zip` CLI, no archiver package.
 *
 * The archive at `dist/pip-unblocker-v<version>.zip` contains ONLY the files an
 * unpacked extension needs to run:
 *
 *   manifest.json
 *   src/**            (background.js, content.js, lib/pip-core.js)
 *   icons/**          (the generated PNG set)
 *
 * Everything dev-only is excluded by construction: this script uses an explicit
 * ALLOWLIST of roots (not a denylist), so `test/`, `fixtures/`, `kanban/`,
 * `specs/`, `scripts/`, `qa/`, `dist/`, `node_modules/`, `.git/`, dev docs,
 * `package.json`, and config files can never leak in even if added later.
 *
 * The store unpacks the ZIP and reads `manifest.json` at the archive root, so
 * entries are stored with forward-slash, prefix-free paths (e.g. `manifest.json`,
 * `src/background.js`) exactly as a Chromium browser expects.
 *
 * Run: `npm run package`  (writes dist/pip-unblocker-v<version>.zip)
 */
import { deflateRawSync } from "node:zlib";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  statSync,
  rmSync,
  existsSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, sep } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST_DIR = join(ROOT, "dist");

// Single source of truth for the packaged version: read it straight from the
// manifest so the ZIP name can never drift from what the store will display.
const manifest = JSON.parse(readFileSync(join(ROOT, "manifest.json"), "utf8"));
const VERSION = manifest.version;
const OUT = join(DIST_DIR, `pip-unblocker-v${VERSION}.zip`);

/**
 * Runtime allowlist. A string is a single file (relative to ROOT); these are the
 * ONLY things that can enter the archive. Directories are walked recursively.
 */
const INCLUDE_FILES = ["manifest.json"];
const INCLUDE_DIRS = ["src", "icons"];

/** Defensive: never package OS/editor junk even if it lands in an allowed dir. */
const SKIP_BASENAMES = new Set([".DS_Store", "Thumbs.db"]);

/**
 * Recursively list files under `absDir`, returned as paths relative to ROOT
 * using POSIX separators (ZIP requires `/`). Output is sorted for a stable,
 * reproducible archive byte-for-byte across runs.
 * @param {string} absDir
 * @returns {string[]}
 */
function listDir(absDir) {
  const out = [];
  for (const name of readdirSync(absDir)) {
    if (SKIP_BASENAMES.has(name)) continue;
    const abs = join(absDir, name);
    const st = statSync(abs);
    if (st.isDirectory()) {
      out.push(...listDir(abs));
    } else if (st.isFile()) {
      out.push(relative(ROOT, abs).split(sep).join("/"));
    }
  }
  return out.sort();
}

/** Resolve the full, sorted list of archive entries from the allowlist. */
function collectEntries() {
  const entries = [];
  for (const f of INCLUDE_FILES) {
    const abs = join(ROOT, f);
    if (!existsSync(abs)) throw new Error(`missing required file: ${f}`);
    entries.push(f);
  }
  for (const d of INCLUDE_DIRS) {
    const abs = join(ROOT, d);
    if (!existsSync(abs)) throw new Error(`missing required dir: ${d}/`);
    entries.push(...listDir(abs));
  }
  return entries.sort();
}

// ---- minimal ZIP writer ---------------------------------------------------
//
// We emit a classic ZIP: one local-file header + DEFLATE'd data per entry,
// followed by a central directory and an end-of-central-directory record. Only
// the fields a stock unzip / the Chrome Web Store needs are populated; that is
// enough for a fully standards-compliant archive.

/** Precomputed CRC-32 table (IEEE polynomial), used for each entry's checksum. */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

/** @param {Buffer} buf @returns {number} unsigned CRC-32 of `buf` */
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** DOS time/date for a fixed, reproducible timestamp (2020-01-01 00:00:00). */
const DOS_TIME = 0; // 00:00:00
const DOS_DATE = ((2020 - 1980) << 9) | (1 << 5) | 1; // year/month/day

/**
 * Build the ZIP for the given entries and return it as a Buffer.
 * @param {string[]} entries paths relative to ROOT, POSIX-separated
 */
function buildZip(entries) {
  const VERSION_NEEDED = 20; // 2.0 — required for DEFLATE
  const localParts = [];
  const central = [];
  let offset = 0;

  for (const name of entries) {
    const data = readFileSync(join(ROOT, name));
    const nameBuf = Buffer.from(name, "utf8");
    const crc = crc32(data);
    const compressed = deflateRawSync(data, { level: 9 });

    // If DEFLATE didn't help (tiny files), store uncompressed instead so the
    // entry is never larger than the original payload.
    const useStore = compressed.length >= data.length;
    const method = useStore ? 0 : 8; // 0 = stored, 8 = deflate
    const body = useStore ? data : compressed;

    // ---- local file header (0x04034b50) ----
    const lfh = Buffer.alloc(30);
    lfh.writeUInt32LE(0x04034b50, 0);
    lfh.writeUInt16LE(VERSION_NEEDED, 4);
    lfh.writeUInt16LE(0, 6); // flags
    lfh.writeUInt16LE(method, 8);
    lfh.writeUInt16LE(DOS_TIME, 10);
    lfh.writeUInt16LE(DOS_DATE, 12);
    lfh.writeUInt32LE(crc, 14);
    lfh.writeUInt32LE(body.length, 18); // compressed size
    lfh.writeUInt32LE(data.length, 22); // uncompressed size
    lfh.writeUInt16LE(nameBuf.length, 26);
    lfh.writeUInt16LE(0, 28); // extra field length
    localParts.push(lfh, nameBuf, body);

    // ---- central directory header (0x02014b50) ----
    const cdh = Buffer.alloc(46);
    cdh.writeUInt32LE(0x02014b50, 0);
    cdh.writeUInt16LE(VERSION_NEEDED, 4); // version made by
    cdh.writeUInt16LE(VERSION_NEEDED, 6); // version needed
    cdh.writeUInt16LE(0, 8); // flags
    cdh.writeUInt16LE(method, 10);
    cdh.writeUInt16LE(DOS_TIME, 12);
    cdh.writeUInt16LE(DOS_DATE, 14);
    cdh.writeUInt32LE(crc, 16);
    cdh.writeUInt32LE(body.length, 20);
    cdh.writeUInt32LE(data.length, 24);
    cdh.writeUInt16LE(nameBuf.length, 28);
    cdh.writeUInt16LE(0, 30); // extra length
    cdh.writeUInt16LE(0, 32); // comment length
    cdh.writeUInt16LE(0, 34); // disk number start
    cdh.writeUInt16LE(0, 36); // internal attrs
    cdh.writeUInt32LE(0, 38); // external attrs
    cdh.writeUInt32LE(offset, 42); // offset of local header
    central.push(Buffer.concat([cdh, nameBuf]));

    offset += lfh.length + nameBuf.length + body.length;
  }

  const localBuf = Buffer.concat(localParts);
  const centralBuf = Buffer.concat(central);

  // ---- end of central directory (0x06054b50) ----
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4); // this disk
  eocd.writeUInt16LE(0, 6); // disk w/ central dir
  eocd.writeUInt16LE(entries.length, 8); // entries on this disk
  eocd.writeUInt16LE(entries.length, 10); // total entries
  eocd.writeUInt32LE(centralBuf.length, 12); // central dir size
  eocd.writeUInt32LE(localBuf.length, 16); // central dir offset
  eocd.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([localBuf, centralBuf, eocd]);
}

// ---- run ------------------------------------------------------------------

const entries = collectEntries();

// Start from a clean dist/ so a stale ZIP from a prior version can't linger.
// Best-effort: on some mounts the old artifact can't be unlinked; in that case
// we fall through and overwrite the same-named ZIP in place below.
if (existsSync(DIST_DIR)) {
  try {
    rmSync(DIST_DIR, { recursive: true, force: true });
  } catch {
    /* unlink not permitted here — writeFileSync below overwrites in place */
  }
}
mkdirSync(DIST_DIR, { recursive: true });

const zip = buildZip(entries);
writeFileSync(OUT, zip);

// Report exactly what shipped so packaging is auditable from the console.
const rel = (p) => relative(ROOT, p).split(sep).join("/");
console.log(`Packaged ${entries.length} files -> ${rel(OUT)} (${zip.length} bytes)`);
for (const name of entries) {
  const size = statSync(join(ROOT, name)).size;
  console.log(`  ${String(size).padStart(7)}  ${name}`);
}
