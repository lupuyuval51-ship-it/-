/**
 * Dependency-free MP4 validator for exercise technique clips. Pure TypeScript over a Uint8Array so it runs in
 * Node (hosted) and in the Device Mode worker. It validates the container, it does not decode video.
 */
export interface Mp4Report {
  ok: boolean;
  errors: string[];
  durationSec: number | null;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  faststart: boolean;
  videoCodec: string | null;
  hasAudio: boolean;
}

export const MP4_LIMITS = { maxBytes: 4 * 1024 * 1024, minSec: 6, maxSec: 10, sizes: [[720, 720], [720, 1280]] as const } as const;

interface Box { type: string; start: number; end: number; body: number }

const u32 = (b: Uint8Array, o: number): number => (((b[o] ?? 0) << 24) | ((b[o + 1] ?? 0) << 16) | ((b[o + 2] ?? 0) << 8) | (b[o + 3] ?? 0)) >>> 0;
const fourcc = (b: Uint8Array, o: number): string => String.fromCharCode(b[o] ?? 0, b[o + 1] ?? 0, b[o + 2] ?? 0, b[o + 3] ?? 0);

function boxes(b: Uint8Array, start: number, end: number): Box[] {
  const out: Box[] = [];
  let o = start;
  while (o + 8 <= end) {
    let size = u32(b, o);
    const type = fourcc(b, o + 4);
    let header = 8;
    if (size === 1) { size = u32(b, o + 8) * 2 ** 32 + u32(b, o + 12); header = 16; }
    else if (size === 0) size = end - o;
    if (size < header || o + size > end) break;
    out.push({ type, start: o, end: o + size, body: o + header });
    o += size;
  }
  return out;
}
const child = (b: Uint8Array, p: Box, type: string): Box[] => boxes(b, p.body, p.end).filter((x) => x.type === type);

export function validateMp4(bytes: Uint8Array): Mp4Report {
  const errors: string[] = [];
  const r: Mp4Report = { ok: false, errors, durationSec: null, width: null, height: null, sizeBytes: bytes.length, faststart: false, videoCodec: null, hasAudio: false };
  if (bytes.length > MP4_LIMITS.maxBytes) errors.push(`size ${bytes.length} exceeds ${MP4_LIMITS.maxBytes}`);
  const top = boxes(bytes, 0, bytes.length);
  const ftyp = top.find((x) => x.type === 'ftyp');
  if (!ftyp) { errors.push('missing ftyp: not an MP4'); return r; }
  const moov = top.find((x) => x.type === 'moov'); const mdat = top.find((x) => x.type === 'mdat');
  if (!moov) { errors.push('missing moov'); return r; }
  if (!mdat) errors.push('missing mdat');
  r.faststart = !!mdat && moov.start < mdat.start;
  if (!r.faststart) errors.push('moov must precede mdat (+faststart)');

  const mvhd = child(bytes, moov, 'mvhd')[0];
  if (mvhd) {
    const version = bytes[mvhd.body] ?? 0;
    const o = mvhd.body + 4;
    const timescale = version === 1 ? u32(bytes, o + 16) : u32(bytes, o + 8);
    const duration = version === 1 ? u32(bytes, o + 20) * 2 ** 32 + u32(bytes, o + 24) : u32(bytes, o + 12);
    r.durationSec = timescale > 0 ? duration / timescale : null;
  } else errors.push('missing mvhd');
  if (r.durationSec !== null && (r.durationSec < MP4_LIMITS.minSec || r.durationSec > MP4_LIMITS.maxSec)) errors.push(`duration ${r.durationSec.toFixed(2)}s outside ${MP4_LIMITS.minSec}-${MP4_LIMITS.maxSec}s`);

  let videoTracks = 0;
  for (const trak of child(bytes, moov, 'trak')) {
    const mdia = child(bytes, trak, 'mdia')[0]; if (!mdia) continue;
    const hdlr = child(bytes, mdia, 'hdlr')[0]; const handler = hdlr ? fourcc(bytes, hdlr.body + 8) : '';
    if (handler === 'soun') r.hasAudio = true;
    if (handler !== 'vide') continue;
    videoTracks++;
    const tkhd = child(bytes, trak, 'tkhd')[0];
    if (tkhd) {
      const version = bytes[tkhd.body] ?? 0; const o = tkhd.body + (version === 1 ? 88 : 76);
      r.width = u32(bytes, o) >>> 16; r.height = u32(bytes, o + 4) >>> 16;
    }
    const minf = child(bytes, mdia, 'minf')[0]; const stbl = minf ? child(bytes, minf, 'stbl')[0] : undefined; const stsd = stbl ? child(bytes, stbl, 'stsd')[0] : undefined;
    if (stsd) r.videoCodec = fourcc(bytes, stsd.body + 12);
  }
  if (videoTracks !== 1) errors.push(`expected 1 video track, found ${videoTracks}`);
  if (r.hasAudio) errors.push('audio track present: clips must be silent');
  if (r.videoCodec !== 'avc1') errors.push(`video codec ${r.videoCodec ?? 'unknown'} is not H.264 (avc1)`);
  if (r.width === null || r.height === null || !MP4_LIMITS.sizes.some(([w, h]) => w === r.width && h === r.height)) errors.push(`dimensions ${r.width}x${r.height} must be 720x720 or 720x1280`);
  r.ok = errors.length === 0;
  return r;
}
