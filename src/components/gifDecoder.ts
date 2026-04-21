/**
 * gifDecoder — decodes an animated GIF into a list of PNG data-URL frames,
 * auto-cropping transparent padding and chroma-keying the dominant background
 * color so the output is ready to drop into an `<img>` tag with no halo.
 *
 * Handles three common GIF shapes:
 *   - true alpha transparency (alpha = 0 on the background)
 *   - solid-backdrop GIFs (e.g. white or black canvas behind the sprite)
 *   - mixed (transparent padding around a colored backdrop)
 *
 * Pipeline:
 *   1. Parse + composite every frame onto a canvas of the GIF's logical size.
 *   2. Detect background colors: top quantized-histogram buckets (≥15%) +
 *      the 4 corner pixels. alpha=0 is always background.
 *   3. Compute the union bounding box of non-background pixels across frames.
 *   4. Crop each frame to that bbox, key out the background, scale to targetH.
 *   5. Serialize each frame canvas as a PNG data URL.
 */

import { parseGIF, decompressFrames, type ParsedFrame } from 'gifuct-js';

export interface DecodedGif {
  /** One PNG data URL per GIF frame. */
  frames: string[];
  /** Rendered frame dimensions (bbox-cropped then scaled to targetH). */
  frameWidth: number;
  frameHeight: number;
  /** Average inter-frame delay in ms (used to derive fps). */
  avgDelay: number;
}

type BgKey = { colors: Array<[number, number, number]>; tol: number };

export async function decodeGif(url: string, targetH = 128): Promise<DecodedGif> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} – ${url}`);
  const buffer = await res.arrayBuffer();
  const gif = parseGIF(buffer);
  const frames = decompressFrames(gif, true);
  if (!frames.length) throw new Error('no frames decoded');

  const srcW = gif.lsd.width;
  const srcH = gif.lsd.height;

  const composed = composeAllFrames(frames, srcW, srcH);
  const bgKey = detectBackgroundKey(composed, srcW, srcH);
  const { minX, minY, maxX, maxY } = computeBbox(composed, srcW, srcH, bgKey);

  const pad = 2;
  const bX = Math.max(0, minX - pad);
  const bY = Math.max(0, minY - pad);
  const bW = Math.min(srcW - 1, maxX + pad) - bX + 1;
  const bH = Math.min(srcH - 1, maxY + pad) - bY + 1;

  const ratio = targetH / bH;
  const dstW = Math.max(1, Math.round(bW * ratio));
  const dstH = Math.max(1, Math.round(bH * ratio));

  const frameCanvas = document.createElement('canvas');
  frameCanvas.width = bW;
  frameCanvas.height = bH;
  const fctx = frameCanvas.getContext('2d')!;

  const scaled = document.createElement('canvas');
  scaled.width = dstW;
  scaled.height = dstH;
  const sctx = scaled.getContext('2d')!;
  sctx.imageSmoothingEnabled = false;

  const urls: string[] = [];
  const delays: number[] = [];
  for (let i = 0; i < frames.length; i++) {
    fctx.clearRect(0, 0, bW, bH);
    fctx.putImageData(cropAndKey(composed[i], srcW, bX, bY, bW, bH, bgKey), 0, 0);
    sctx.clearRect(0, 0, dstW, dstH);
    sctx.drawImage(frameCanvas, 0, 0, bW, bH, 0, 0, dstW, dstH);
    urls.push(scaled.toDataURL('image/png'));
    delays.push(frames[i].delay || 100);
  }

  const avgDelay = delays.reduce((a, b) => a + b, 0) / delays.length;
  return { frames: urls, frameWidth: dstW, frameHeight: dstH, avgDelay };
}

function composeAllFrames(
  frames: ParsedFrame[],
  srcW: number,
  srcH: number,
): Uint8ClampedArray[] {
  const canvas = document.createElement('canvas');
  canvas.width = srcW;
  canvas.height = srcH;
  const c = canvas.getContext('2d', { willReadFrequently: true })!;

  const out: Uint8ClampedArray[] = [];
  for (const frame of frames) {
    const fw = frame.dims.width;
    const fh = frame.dims.height;
    if (frame.patch && frame.patch.length === fw * fh * 4) {
      const img = new ImageData(new Uint8ClampedArray(frame.patch), fw, fh);
      c.putImageData(img, frame.dims.left, frame.dims.top);
    }
    out.push(new Uint8ClampedArray(c.getImageData(0, 0, srcW, srcH).data));
    if (frame.disposalType === 2) {
      c.clearRect(frame.dims.left, frame.dims.top, fw, fh);
    }
  }
  return out;
}

function detectBackgroundKey(
  composed: Uint8ClampedArray[],
  srcW: number,
  srcH: number,
): BgKey {
  const first = composed[0];
  const total = srcW * srcH;
  const BUCKET = 16;
  const hist = new Map<number, number>();
  for (let i = 0; i < first.length; i += 4) {
    if (first[i + 3] === 0) continue;
    const qr = Math.floor(first[i] / BUCKET);
    const qg = Math.floor(first[i + 1] / BUCKET);
    const qb = Math.floor(first[i + 2] / BUCKET);
    const k = (qr << 16) | (qg << 8) | qb;
    hist.set(k, (hist.get(k) ?? 0) + 1);
  }

  const colors: Array<[number, number, number]> = [];
  const addColor = (r: number, g: number, b: number) => {
    if (!colors.some((c) => c[0] === r && c[1] === g && c[2] === b)) {
      colors.push([r, g, b]);
    }
  };

  for (const [k, count] of [...hist.entries()].sort((a, b) => b[1] - a[1])) {
    if (count / total < 0.15) break;
    const qr = (k >> 16) & 0xff;
    const qg = (k >> 8) & 0xff;
    const qb = k & 0xff;
    addColor(qr * BUCKET + BUCKET / 2, qg * BUCKET + BUCKET / 2, qb * BUCKET + BUCKET / 2);
  }

  const corners: Array<[number, number]> = [
    [0, 0],
    [srcW - 1, 0],
    [0, srcH - 1],
    [srcW - 1, srcH - 1],
  ];
  for (const [x, y] of corners) {
    const o = (y * srcW + x) * 4;
    if (first[o + 3] !== 0) addColor(first[o], first[o + 1], first[o + 2]);
  }

  return { colors, tol: 12 };
}

function isBackground(r: number, g: number, b: number, a: number, bg: BgKey): boolean {
  if (a === 0) return true;
  for (const [cr, cg, cb] of bg.colors) {
    if (
      Math.abs(r - cr) <= bg.tol &&
      Math.abs(g - cg) <= bg.tol &&
      Math.abs(b - cb) <= bg.tol
    ) {
      return true;
    }
  }
  return false;
}

function computeBbox(
  composed: Uint8ClampedArray[],
  srcW: number,
  srcH: number,
  bg: BgKey,
): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = srcW;
  let minY = srcH;
  let maxX = -1;
  let maxY = -1;
  for (const data of composed) {
    for (let y = 0; y < srcH; y++) {
      const base = y * srcW * 4;
      for (let x = 0; x < srcW; x++) {
        const o = base + x * 4;
        if (!isBackground(data[o], data[o + 1], data[o + 2], data[o + 3], bg)) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
  }
  if (maxX < minX || maxY < minY) {
    return { minX: 0, minY: 0, maxX: srcW - 1, maxY: srcH - 1 };
  }
  return { minX, minY, maxX, maxY };
}

function cropAndKey(
  rgba: Uint8ClampedArray,
  srcW: number,
  bX: number,
  bY: number,
  bW: number,
  bH: number,
  bg: BgKey,
): ImageData {
  const out = new Uint8ClampedArray(bW * bH * 4);
  for (let y = 0; y < bH; y++) {
    for (let x = 0; x < bW; x++) {
      const src = ((bY + y) * srcW + (bX + x)) * 4;
      const dst = (y * bW + x) * 4;
      const r = rgba[src];
      const g = rgba[src + 1];
      const b = rgba[src + 2];
      const a = rgba[src + 3];
      if (isBackground(r, g, b, a, bg)) {
        out[dst + 3] = 0;
      } else {
        out[dst] = r;
        out[dst + 1] = g;
        out[dst + 2] = b;
        out[dst + 3] = 255;
      }
    }
  }
  return new ImageData(out, bW, bH);
}
