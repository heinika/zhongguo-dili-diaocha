#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const input = process.argv[2];
const outDir = process.argv[3] || "outline_output";

if (!input) {
  console.error("Usage: node tools/extract_land_outline_from_png.mjs <input.png> [out_dir]");
  process.exit(1);
}

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const bytes = fs.readFileSync(input);
if (!bytes.subarray(0, 8).equals(sig)) throw new Error("Input is not a PNG file");

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function parsePng(buf) {
  let pos = 8;
  let width = 0, height = 0, colorType = 0, bitDepth = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos); pos += 4;
    const type = buf.subarray(pos, pos + 4).toString("ascii"); pos += 4;
    const data = buf.subarray(pos, pos + len); pos += len + 4;
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
  }
  if (bitDepth !== 8 || colorType !== 2) {
    throw new Error(`Only 8-bit RGB PNG is supported; got bitDepth=${bitDepth}, colorType=${colorType}`);
  }
  const inflated = zlib.inflateSync(Buffer.concat(idat));
  const bpp = 3;
  const stride = width * bpp;
  const rgb = Buffer.alloc(width * height * bpp);
  let src = 0;
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = inflated[src++];
    const row = Buffer.from(inflated.subarray(src, src + stride));
    src += stride;
    for (let x = 0; x < stride; x++) {
      const left = x >= bpp ? row[x - bpp] : 0;
      const up = prev[x];
      const upLeft = x >= bpp ? prev[x - bpp] : 0;
      if (filter === 1) row[x] = (row[x] + left) & 255;
      else if (filter === 2) row[x] = (row[x] + up) & 255;
      else if (filter === 3) row[x] = (row[x] + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left), pb = Math.abs(p - up), pc = Math.abs(p - upLeft);
        row[x] = (row[x] + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft)) & 255;
      } else if (filter !== 0) {
        throw new Error(`Unsupported PNG filter ${filter}`);
      }
    }
    row.copy(rgb, y * stride);
    prev = row;
  }
  return { width, height, rgb };
}

function writePngRgba(file, width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  let p = 0, q = 0;
  for (let y = 0; y < height; y++) {
    raw[p++] = 0;
    rgba.copy(raw, p, q, q + width * 4);
    p += width * 4;
    q += width * 4;
  }
  const chunks = [];
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  chunks.push(chunk("IHDR", ihdr));
  chunks.push(chunk("IDAT", zlib.deflateSync(raw, { level: 9 })));
  chunks.push(chunk("IEND", Buffer.alloc(0)));
  fs.writeFileSync(file, Buffer.concat([sig, ...chunks]));
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  typeBuf.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 8 + data.length);
  return out;
}

function dilate(mask, width, height, radius) {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    let hit = 0;
    for (let dy = -radius; dy <= radius && !hit; dy++) {
      const yy = y + dy; if (yy < 0 || yy >= height) continue;
      for (let dx = -radius; dx <= radius; dx++) {
        const xx = x + dx; if (xx < 0 || xx >= width) continue;
        if (mask[yy * width + xx]) { hit = 1; break; }
      }
    }
    out[y * width + x] = hit;
  }
  return out;
}

function erode(mask, width, height, radius) {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    let ok = 1;
    for (let dy = -radius; dy <= radius && ok; dy++) {
      const yy = y + dy; if (yy < 0 || yy >= height) { ok = 0; break; }
      for (let dx = -radius; dx <= radius; dx++) {
        const xx = x + dx; if (xx < 0 || xx >= width || !mask[yy * width + xx]) { ok = 0; break; }
      }
    }
    out[y * width + x] = ok;
  }
  return out;
}

function keepLargeComponents(mask, width, height, minArea) {
  const seen = new Uint8Array(mask.length);
  const out = new Uint8Array(mask.length);
  const stack = [];
  const comp = [];
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i] || seen[i]) continue;
    comp.length = 0;
    stack.push(i); seen[i] = 1;
    while (stack.length) {
      const p = stack.pop();
      comp.push(p);
      const x = p % width, y = (p / width) | 0;
      const ns = [p - 1, p + 1, p - width, p + width];
      for (const n of ns) {
        if (n < 0 || n >= mask.length || seen[n] || !mask[n]) continue;
        const nx = n % width, ny = (n / width) | 0;
        if (Math.abs(nx - x) + Math.abs(ny - y) !== 1) continue;
        seen[n] = 1; stack.push(n);
      }
    }
    if (comp.length >= minArea) for (const p of comp) out[p] = 1;
  }
  return out;
}

function fillSmallHoles(mask, width, height, maxHoleArea) {
  const inv = new Uint8Array(mask.length);
  for (let i = 0; i < mask.length; i++) inv[i] = mask[i] ? 0 : 1;
  const seen = new Uint8Array(mask.length);
  const out = Uint8Array.from(mask);
  const stack = [], comp = [];
  for (let i = 0; i < inv.length; i++) {
    if (!inv[i] || seen[i]) continue;
    comp.length = 0;
    let touchesEdge = false;
    stack.push(i); seen[i] = 1;
    while (stack.length) {
      const p = stack.pop(); comp.push(p);
      const x = p % width, y = (p / width) | 0;
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) touchesEdge = true;
      const ns = [p - 1, p + 1, p - width, p + width];
      for (const n of ns) {
        if (n < 0 || n >= inv.length || seen[n] || !inv[n]) continue;
        const nx = n % width, ny = (n / width) | 0;
        if (Math.abs(nx - x) + Math.abs(ny - y) !== 1) continue;
        seen[n] = 1; stack.push(n);
      }
    }
    if (!touchesEdge && comp.length <= maxHoleArea) for (const p of comp) out[p] = 1;
  }
  return out;
}

function bbox(mask, width, height) {
  let minX = width, minY = height, maxX = -1, maxY = -1, area = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (!mask[y * width + x]) continue;
    area++;
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY, area };
}

function pathFromMask(mask, width, height, b, step = 2) {
  const lines = [];
  for (let y = b.minY; y <= b.maxY; y += step) {
    for (let x = b.minX; x <= b.maxX; x += step) {
      const inside = mask[y * width + x];
      if (!inside) continue;
      if (x <= 0 || !mask[y * width + x - 1]) lines.push(`M${x} ${y}v${step}`);
      if (x >= width - 1 || !mask[y * width + x + 1]) lines.push(`M${x + step} ${y}v${step}`);
      if (y <= 0 || !mask[(y - 1) * width + x]) lines.push(`M${x} ${y}h${step}`);
      if (y >= height - 1 || !mask[(y + 1) * width + x]) lines.push(`M${x} ${y + step}h${step}`);
    }
  }
  return lines.join("");
}

const { width, height, rgb } = parsePng(bytes);
let land = new Uint8Array(width * height);
let water = new Uint8Array(width * height);

for (let i = 0, p = 0; i < land.length; i++, p += 3) {
  const r = rgb[p], g = rgb[p + 1], b = rgb[p + 2];
  const greenish = g > r + 8 && g > b + 8 && r > 110 && r < 230 && g > 135 && g < 235 && b > 80 && b < 215;
  const blueish = b > r + 24 && b > g + 4 && b > 120 && g > 90 && r < 170;
  land[i] = greenish ? 1 : 0;
  water[i] = blueish ? 1 : 0;
}

land = keepLargeComponents(land, width, height, 3000);
land = erode(dilate(land, width, height, 4), width, height, 4);
land = fillSmallHoles(land, width, height, 50000);
water = keepLargeComponents(water, width, height, 250);
water = dilate(water, width, height, 2);
for (let i = 0; i < land.length; i++) if (water[i]) land[i] = 0;
land = keepLargeComponents(land, width, height, 3000);

const b = bbox(land, width, height);
fs.mkdirSync(outDir, { recursive: true });

const rgba = Buffer.alloc(width * height * 4);
for (let i = 0, p = 0; i < land.length; i++, p += 4) {
  if (land[i]) {
    rgba[p] = 178; rgba[p + 1] = 211; rgba[p + 2] = 160; rgba[p + 3] = 255;
  }
}

const pngPath = path.join(outDir, "land_mask_no_real_water.png");
writePngRgba(pngPath, width, height, rgba);

const pathData = pathFromMask(land, width, height, b, 2);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <title>Land outline without real water areas</title>
  <path d="${pathData}" fill="none" stroke="#2b2b2b" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"/>
</svg>
`;
const svgPath = path.join(outDir, "land_outline_no_real_water.svg");
fs.writeFileSync(svgPath, svg);

const cropPad = 24;
const crop = {
  minX: Math.max(0, b.minX - cropPad),
  minY: Math.max(0, b.minY - cropPad),
  maxX: Math.min(width - 1, b.maxX + cropPad),
  maxY: Math.min(height - 1, b.maxY + cropPad),
};
const cropW = crop.maxX - crop.minX + 1;
const cropH = crop.maxY - crop.minY + 1;
const cropped = Buffer.alloc(cropW * cropH * 4);
for (let y = 0; y < cropH; y++) {
  const srcStart = ((crop.minY + y) * width + crop.minX) * 4;
  rgba.copy(cropped, y * cropW * 4, srcStart, srcStart + cropW * 4);
}
const cropPath = path.join(outDir, "land_mask_no_real_water_cropped.png");
writePngRgba(cropPath, cropW, cropH, cropped);

const outline = Buffer.alloc(cropW * cropH * 4);
for (let y = 0; y < cropH; y++) {
  for (let x = 0; x < cropW; x++) {
    const srcX = crop.minX + x;
    const srcY = crop.minY + y;
    const srcI = srcY * width + srcX;
    if (!land[srcI]) continue;
    const boundary =
      srcX <= 0 || srcY <= 0 || srcX >= width - 1 || srcY >= height - 1 ||
      !land[srcI - 1] || !land[srcI + 1] || !land[srcI - width] || !land[srcI + width];
    if (!boundary) continue;
    const q = (y * cropW + x) * 4;
    outline[q] = 28;
    outline[q + 1] = 28;
    outline[q + 2] = 28;
    outline[q + 3] = 255;
  }
}
const outlinePngPath = path.join(outDir, "land_outline_no_real_water_cropped.png");
writePngRgba(outlinePngPath, cropW, cropH, outline);

const outlinePreview = Buffer.alloc(cropW * cropH * 4);
for (let i = 0; i < outlinePreview.length; i += 4) {
  outlinePreview[i] = 255;
  outlinePreview[i + 1] = 255;
  outlinePreview[i + 2] = 255;
  outlinePreview[i + 3] = 255;
}
for (let i = 0; i < outline.length; i += 4) {
  if (!outline[i + 3]) continue;
  outlinePreview[i] = outline[i];
  outlinePreview[i + 1] = outline[i + 1];
  outlinePreview[i + 2] = outline[i + 2];
}
const outlinePreviewPath = path.join(outDir, "land_outline_no_real_water_preview.png");
writePngRgba(outlinePreviewPath, cropW, cropH, outlinePreview);

fs.writeFileSync(path.join(outDir, "metadata.json"), JSON.stringify({
  source: path.resolve(input),
  width,
  height,
  land_pixels: b.area,
  bounds: b,
  crop_bounds: crop,
  outputs: [pngPath, cropPath, outlinePngPath, outlinePreviewPath, svgPath],
}, null, 2));

console.log(`Wrote ${pngPath}`);
console.log(`Wrote ${cropPath}`);
console.log(`Wrote ${outlinePngPath}`);
console.log(`Wrote ${outlinePreviewPath}`);
console.log(`Wrote ${svgPath}`);
console.log(`Bounds: ${JSON.stringify(b)}`);
