/**
 * The part of Node's `Buffer` the server code uses, for device mode (the browser has no `Buffer`).
 *
 * `DeviceBuffer` is a `Uint8Array` subclass, so `subarray`, indexing and `length` work as usual and
 * anything that accepts bytes accepts it. Supported: `Buffer.from(string, encoding)`,
 * `Buffer.from(bytes | number[] | ArrayBuffer)`, `Buffer.alloc`, `Buffer.isBuffer`, `Buffer.byteLength`,
 * `Buffer.concat`, `buf.toString(encoding, start, end)` and `buf.equals(other)`, with the encodings
 * utf8, hex, base64, base64url, latin1/binary and ascii. Decoding follows Node: base64 accepts both
 * alphabets, ignores whitespace and other foreign characters and stops at `=`; hex stops at the first
 * invalid pair. `buffer.test.ts` checks byte-for-byte parity with Node's Buffer.
 */

export type BufferEncoding = 'utf8' | 'utf-8' | 'hex' | 'base64' | 'base64url' | 'latin1' | 'binary' | 'ascii';

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
/** Both alphabets decode (like Node): '+' and '-' are 62, '/' and '_' are 63. */
const B64_DECODE = (() => {
  const table = new Int16Array(128).fill(-1);
  for (let i = 0; i < 64; i++) {
    table[B64.charCodeAt(i)] = i;
    table[B64URL.charCodeAt(i)] = i;
  }
  return table;
})();

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8');

function normalizeEncoding(encoding: string | undefined): BufferEncoding {
  const e = (encoding ?? 'utf8').toLowerCase();
  switch (e) {
    case 'utf8':
    case 'utf-8':
      return 'utf8';
    case 'hex':
    case 'base64':
    case 'base64url':
    case 'latin1':
    case 'ascii':
      return e;
    case 'binary':
      return 'latin1';
    default:
      throw new TypeError(`Unknown encoding: ${encoding}`);
  }
}

function base64ToBytes(input: string): Uint8Array {
  const out = new Uint8Array(Math.ceil((input.length * 3) / 4));
  let bits = 0;
  let value = 0;
  let n = 0;
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    if (code === 61) break; // '=' ends the data
    const v = code < 128 ? (B64_DECODE[code] ?? -1) : -1;
    if (v < 0) continue; // whitespace and foreign characters are skipped
    value = (value << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[n++] = (value >> bits) & 0xff;
    }
  }
  return out.subarray(0, n);
}

function bytesToBase64(bytes: Uint8Array, url: boolean): string {
  const alphabet = url ? B64URL : B64;
  let out = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const v = (bytes[i]! << 16) | (bytes[i + 1]! << 8) | bytes[i + 2]!;
    out += alphabet[(v >> 18) & 63]! + alphabet[(v >> 12) & 63]! + alphabet[(v >> 6) & 63]! + alphabet[v & 63]!;
  }
  const rest = bytes.length - i;
  if (rest === 1) {
    const v = bytes[i]! << 16;
    out += alphabet[(v >> 18) & 63]! + alphabet[(v >> 12) & 63]! + (url ? '' : '==');
  } else if (rest === 2) {
    const v = (bytes[i]! << 16) | (bytes[i + 1]! << 8);
    out += alphabet[(v >> 18) & 63]! + alphabet[(v >> 12) & 63]! + alphabet[(v >> 6) & 63]! + (url ? '' : '=');
  }
  return out;
}

function hexToBytes(input: string): Uint8Array {
  const out = new Uint8Array(input.length >> 1);
  let n = 0;
  for (let i = 0; i + 1 < input.length; i += 2) {
    const hi = parseInt(input[i]!, 16);
    const lo = parseInt(input[i + 1]!, 16);
    if (Number.isNaN(hi) || Number.isNaN(lo)) break; // Node stops at the first invalid pair
    out[n++] = (hi << 4) | lo;
  }
  return out.subarray(0, n);
}

function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (const b of bytes) out += b.toString(16).padStart(2, '0');
  return out;
}

function stringToBytes(value: string, encoding: BufferEncoding): Uint8Array {
  switch (encoding) {
    case 'utf8':
    case 'utf-8':
      return encoder.encode(value);
    case 'hex':
      return hexToBytes(value);
    case 'base64':
    case 'base64url':
      return base64ToBytes(value);
    case 'latin1':
    case 'binary':
    case 'ascii': {
      const out = new Uint8Array(value.length);
      for (let i = 0; i < value.length; i++) out[i] = value.charCodeAt(i) & 0xff;
      return out;
    }
  }
}

function bytesToString(bytes: Uint8Array, encoding: BufferEncoding): string {
  switch (encoding) {
    case 'utf8':
    case 'utf-8':
      return decoder.decode(bytes);
    case 'hex':
      return bytesToHex(bytes);
    case 'base64':
      return bytesToBase64(bytes, false);
    case 'base64url':
      return bytesToBase64(bytes, true);
    case 'latin1':
    case 'binary':
    case 'ascii': {
      const mask = encoding === 'ascii' ? 0x7f : 0xff;
      let out = '';
      for (let i = 0; i < bytes.length; i += 8192) {
        out += String.fromCharCode(...Array.from(bytes.subarray(i, i + 8192), (b) => b & mask));
      }
      return out;
    }
  }
}

export class DeviceBuffer extends Uint8Array {
  static override from(value: string, encoding?: BufferEncoding): DeviceBuffer;
  static override from(value: ArrayBuffer, byteOffset?: number, length?: number): DeviceBuffer;
  static override from(value: ArrayLike<number> | Iterable<number>): DeviceBuffer;
  static override from<T>(value: ArrayLike<T> | Iterable<T>, mapfn: (v: T, k: number) => number, thisArg?: unknown): DeviceBuffer;
  static override from(value: unknown, encodingOrOffset?: unknown, length?: unknown): DeviceBuffer {
    if (typeof encodingOrOffset === 'function') {
      // TypedArray.from(source, mapfn, thisArg)
      const mapped = Array.from(value as ArrayLike<unknown>, encodingOrOffset as (v: unknown, k: number) => number, length);
      return DeviceBuffer.from(mapped);
    }
    if (typeof value === 'string') {
      const bytes = stringToBytes(value, normalizeEncoding(encodingOrOffset as string | undefined));
      return DeviceBuffer.copyOf(bytes);
    }
    if (value instanceof ArrayBuffer) {
      // Like Node: a view on the same memory.
      return new DeviceBuffer(value, (encodingOrOffset as number | undefined) ?? 0, length as number | undefined);
    }
    if (ArrayBuffer.isView(value)) {
      return DeviceBuffer.copyOf(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
    }
    if (value != null && (typeof value === 'object' || typeof value === 'function')) {
      const items = Array.from(value as ArrayLike<number>);
      const out = new DeviceBuffer(items.length);
      items.forEach((v, i) => (out[i] = Number(v) & 0xff));
      return out;
    }
    throw new TypeError('The first argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.');
  }

  static alloc(size: number, fill = 0): DeviceBuffer {
    return new DeviceBuffer(size).fill(fill & 0xff) as DeviceBuffer;
  }

  static isBuffer(value: unknown): value is DeviceBuffer {
    return value instanceof DeviceBuffer;
  }

  static byteLength(value: string | ArrayBufferView | ArrayBuffer, encoding?: BufferEncoding): number {
    if (typeof value === 'string') return stringToBytes(value, normalizeEncoding(encoding)).length;
    return value.byteLength;
  }

  static concat(list: readonly Uint8Array[], totalLength?: number): DeviceBuffer {
    const total = totalLength ?? list.reduce((n, b) => n + b.length, 0);
    const out = new DeviceBuffer(total);
    let offset = 0;
    for (const b of list) {
      if (offset >= total) break;
      out.set(b.subarray(0, total - offset), offset);
      offset += Math.min(b.length, total - offset);
    }
    return out;
  }

  private static copyOf(bytes: Uint8Array): DeviceBuffer {
    const out = new DeviceBuffer(bytes.length);
    out.set(bytes);
    return out;
  }

  /** Same memory, still a DeviceBuffer (as Buffer#subarray returns a Buffer). */
  override subarray(start?: number, end?: number): DeviceBuffer {
    return super.subarray(start, end) as DeviceBuffer;
  }

  override toString(encoding?: BufferEncoding, start = 0, end = this.length): string {
    return bytesToString(this.subarray(Math.max(0, start), Math.min(this.length, end)), normalizeEncoding(encoding));
  }

  equals(other: Uint8Array): boolean {
    if (!(other instanceof Uint8Array)) throw new TypeError('The "otherBuffer" argument must be an instance of Buffer or Uint8Array.');
    if (other.length !== this.length) return false;
    for (let i = 0; i < this.length; i++) if (this[i] !== other[i]) return false;
    return true;
  }

  toJSON(): { type: 'Buffer'; data: number[] } {
    return { type: 'Buffer', data: Array.from(this) };
  }
}
