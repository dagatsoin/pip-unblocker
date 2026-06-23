/**
 * Generates the three-state toolbar icon set (default / orange / green) at the
 * sizes Chrome wants (16/32/48/128), with zero external dependencies — a tiny
 * hand-rolled PNG encoder on top of Node's built-in zlib.
 *
 * Each icon is a rounded-corner square filled with the state color and a white
 * "PiP" motif: an outer frame outline plus a small inner rectangle nested in
 * the lower-right corner (the universal picture-in-picture glyph). The three
 * states are deliberately high-contrast so QA can tell them apart at 16px.
 *
 *   default -> slate grey   (neutral, "nothing to do")
 *   orange  -> amber        (blocker detected)
 *   green   -> emerald      (unblocked, PiP available)
 *
 * Run: `npm run icons`  (writes PNGs into ../icons/)
 *
 * @implements FS-001.2 (orange), FS-001.3 (default), FS-001.5 (green)
 */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(__dirname, "..", "icons");

const SIZES = [16, 32, 48, 128];

const STATES = {
  default: { bg: [0x4b, 0x55, 0x63], fg: [0xff, 0xff, 0xff] }, // slate-600 / white
  orange: { bg: [0xf9, 0x73, 0x16], fg: [0xff, 0xff, 0xff] }, // orange-500 / white
  green: { bg: [0x16, 0xa3, 0x4a], fg: [0xff, 0xff, 0xff] }, // green-600 / white
};

// ---- pixel buffer helpers -------------------------------------------------

function makeCanvas(size) {
  // RGBA, all transparent to start.
  return { size, data: new Uint8Array(size * size * 4) };
}

function setPx(c, x, y, [r, g, b], a = 255) {
  if (x < 0 || y < 0 || x >= c.size || y >= c.size) return;
  const i = (y * c.size + x) * 4;
  c.data[i] = r;
  c.data[i + 1] = g;
  c.data[i + 2] = b;
  c.data[i + 3] = a;
}

function fillRoundedRect(c, x0, y0, w, h, radius, color, a = 255) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      // Round the four corners.
      const inCornerTL = x < x0 + radius && y < y0 + radius;
      const inCornerTR = x >= x0 + w - radius && y < y0 + radius;
      const inCornerBL = x < x0 + radius && y >= y0 + h - radius;
      const inCornerBR = x >= x0 + w - radius && y >= y0 + h - radius;
      let skip = false;
      const test = (cx, cy) => (x - cx) ** 2 + (y - cy) ** 2 > radius ** 2;
      if (inCornerTL) skip = test(x0 + radius - 0.5, y0 + radius - 0.5);
      else if (inCornerTR) skip = test(x0 + w - radius - 0.5, y0 + radius - 0.5);
      else if (inCornerBL) skip = test(x0 + radius - 0.5, y0 + h - radius - 0.5);
      else if (inCornerBR)
        skip = test(x0 + w - radius - 0.5, y0 + h - radius - 0.5);
      if (!skip) setPx(c, x, y, color, a);
    }
  }
}

function strokeRect(c, x0, y0, w, h, thickness, color) {
  for (let t = 0; t < thickness; t++) {
    for (let x = x0; x < x0 + w; x++) {
      setPx(c, x, y0 + t, color);
      setPx(c, x, y0 + h - 1 - t, color);
    }
    for (let y = y0; y < y0 + h; y++) {
      setPx(c, x0 + t, y, color);
      setPx(c, x0 + w - 1 - t, y, color);
    }
  }
}

// ---- PNG encoding ---------------------------------------------------------

function crc32(buf) {
  let crc = ~0;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let k = 0; k < 8; k++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (~crc) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePNG(canvas) {
  const { size, data } = canvas;
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); // width
  ihdr.writeUInt32BE(size, 4); // height
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(6, 9); // color type 6 = RGBA
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  // Raw scanlines with a 0 (None) filter byte per row.
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(data.buffer, y * stride, stride).copy(
      raw,
      y * (stride + 1) + 1
    );
  }

  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- glyph ---------------------------------------------------------------

function drawIcon(size, state) {
  const c = makeCanvas(size);
  const { bg, fg } = STATES[state];

  // Background tile fills the whole icon with a soft rounded corner.
  const radius = Math.max(2, Math.round(size * 0.18));
  fillRoundedRect(c, 0, 0, size, size, radius, bg);

  // Outer "screen" frame (white outline) — the PiP motif.
  const m = Math.round(size * 0.2); // outer margin
  const frameW = size - m * 2;
  const frameH = Math.round(frameW * 0.72);
  const frameX = m;
  const frameY = Math.round((size - frameH) / 2);
  const stroke = Math.max(1, Math.round(size * 0.06));
  strokeRect(c, frameX, frameY, frameW, frameH, stroke, fg);

  // Inner picture-in-picture rectangle, nested bottom-right (filled white).
  const innerW = Math.round(frameW * 0.46);
  const innerH = Math.round(frameH * 0.46);
  const innerPad = Math.max(1, Math.round(size * 0.045));
  const innerX = frameX + frameW - innerW - innerPad - stroke;
  const innerY = frameY + frameH - innerH - innerPad - stroke;
  fillRoundedRect(
    c,
    innerX,
    innerY,
    innerW,
    innerH,
    Math.max(1, Math.round(size * 0.03)),
    fg
  );

  return encodePNG(c);
}

// ---- main ----------------------------------------------------------------

mkdirSync(ICONS_DIR, { recursive: true });

let written = 0;
for (const state of Object.keys(STATES)) {
  for (const size of SIZES) {
    const png = drawIcon(size, state);
    const file = join(ICONS_DIR, `${state}-${size}.png`);
    writeFileSync(file, png);
    written++;
  }
}

console.log(
  `Wrote ${written} PNG icons (${Object.keys(STATES).length} states x ${SIZES.length} sizes) to ${ICONS_DIR}`
);
