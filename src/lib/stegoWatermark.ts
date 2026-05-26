// Lightweight LSB steganography for PNG images (browser-only).
// Embeds a UTF-8 JSON payload prefixed with magic "CMF1" + 32-bit length
// into the least-significant bit of R/G/B channels.

const MAGIC = "CMF1";

export interface WatermarkPayload {
  certificateId: string;
  stageName: string;
  registrationDate: string;
  issuer: string; // "ClaimMyFace.com"
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function bytesToBits(bytes: Uint8Array): number[] {
  const bits: number[] = [];
  for (const b of bytes) {
    for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
  }
  return bits;
}

function bitsToBytes(bits: number[]): Uint8Array {
  const out = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < out.length; i++) {
    let v = 0;
    for (let j = 0; j < 8; j++) v = (v << 1) | bits[i * 8 + j];
    out[i] = v;
  }
  return out;
}

async function loadImage(src: string | Blob): Promise<HTMLImageElement> {
  const url = typeof src === "string" ? src : URL.createObjectURL(src);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Embed payload into image source (URL/Blob). Returns a PNG Blob. */
export async function embedWatermark(
  source: string | Blob,
  payload: WatermarkPayload
): Promise<Blob> {
  const img = await loadImage(source);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  const json = JSON.stringify(payload);
  const payloadBytes = textEncoder.encode(json);
  const lenBytes = new Uint8Array(4);
  new DataView(lenBytes.buffer).setUint32(0, payloadBytes.length, false);
  const magicBytes = textEncoder.encode(MAGIC);
  const full = new Uint8Array(magicBytes.length + lenBytes.length + payloadBytes.length);
  full.set(magicBytes, 0);
  full.set(lenBytes, magicBytes.length);
  full.set(payloadBytes, magicBytes.length + lenBytes.length);
  const bits = bytesToBits(full);

  // Capacity = pixels * 3 (R,G,B); skip alpha.
  const capacity = (data.length / 4) * 3;
  if (bits.length > capacity) throw new Error("Image too small to hold watermark");

  let bi = 0;
  for (let i = 0; i < data.length && bi < bits.length; i += 4) {
    for (let c = 0; c < 3 && bi < bits.length; c++) {
      data[i + c] = (data[i + c] & 0xfe) | bits[bi++];
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG encode failed"))), "image/png")
  );
}

/** Extract payload, or null if no watermark found. */
export async function extractWatermark(source: string | Blob): Promise<WatermarkPayload | null> {
  const img = await loadImage(source);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  const readBytes = (n: number, offsetBits: number): Uint8Array => {
    const bits: number[] = [];
    let bi = 0;
    let target = n * 8;
    for (let i = 0; i < data.length && bits.length < offsetBits + target; i += 4) {
      for (let c = 0; c < 3 && bits.length < offsetBits + target; c++) {
        bits.push(data[i + c] & 1);
        bi++;
      }
    }
    return bitsToBytes(bits.slice(offsetBits, offsetBits + target));
  };

  const header = readBytes(4 + 4, 0);
  const magic = textDecoder.decode(header.slice(0, 4));
  if (magic !== MAGIC) return null;
  const len = new DataView(header.buffer, header.byteOffset + 4, 4).getUint32(0, false);
  if (len <= 0 || len > 4096) return null;
  const all = readBytes(4 + 4 + len, 0);
  try {
    const json = textDecoder.decode(all.slice(8));
    return JSON.parse(json) as WatermarkPayload;
  } catch {
    return null;
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
