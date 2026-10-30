/** DeviceBuffer must give the same bytes and strings as Node's Buffer for everything the server does with it. */
import { Buffer as NodeBuffer } from 'node:buffer';
import { randomBytes as nodeRandomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { DeviceBuffer, type BufferEncoding } from './buffer';

const bytes = (b: Uint8Array) => Array.from(b);
const ENCODINGS: BufferEncoding[] = ['utf8', 'hex', 'base64', 'base64url', 'latin1', 'binary', 'ascii'];
const STRINGS = ['', 'a', 'ab', 'abc', 'Passw0rd!', 'שלום עולם', 'emoji 💪🏽', 'lone \ud800 surrogate', '\u0000ÿĀ', 'x'.repeat(1000)];

describe('DeviceBuffer ↔ Node Buffer', () => {
  it('encodes strings to the same bytes in every encoding', () => {
    for (const s of STRINGS) {
      for (const enc of ENCODINGS) expect(bytes(DeviceBuffer.from(s, enc)), `${enc} ${JSON.stringify(s)}`).toEqual(bytes(NodeBuffer.from(s, enc)));
    }
  });

  it('decodes random bytes to the same strings in every encoding', () => {
    for (let n = 0; n < 70; n++) {
      const raw = nodeRandomBytes(n);
      for (const enc of ENCODINGS) expect(DeviceBuffer.from(raw).toString(enc), `${enc} n=${n}`).toBe(NodeBuffer.from(raw).toString(enc));
    }
  });

  it('round-trips base64 / base64url / hex like Node, including lenient input', () => {
    const inputs = [
      'SGVsbG8=',
      'SGVsbG8',
      'SGVs bG8=\n',
      'SGVsbG8==extra',
      '-_-_',
      '+/+/',
      'AQID BAUG\tBwgJ',
      'QQ',
      'Q',
      '!!!',
      '',
      'AAAA====AAAA',
    ];
    for (const s of inputs) {
      expect(bytes(DeviceBuffer.from(s, 'base64')), `base64 ${s}`).toEqual(bytes(NodeBuffer.from(s, 'base64')));
      expect(bytes(DeviceBuffer.from(s, 'base64url')), `base64url ${s}`).toEqual(bytes(NodeBuffer.from(s, 'base64url')));
    }
    for (const s of ['00ff10', '00FF1', 'zz00', '0g', 'abcdef0123456789', '']) {
      expect(bytes(DeviceBuffer.from(s, 'hex')), `hex ${s}`).toEqual(bytes(NodeBuffer.from(s, 'hex')));
    }
  });

  it('builds from arrays, views and ArrayBuffers like Node', () => {
    expect(bytes(DeviceBuffer.from([0x89, 0x50, 256, -1, 1.7]))).toEqual(bytes(NodeBuffer.from([0x89, 0x50, 256, -1, 1.7])));
    const ab = new Uint8Array([1, 2, 3, 4]).buffer;
    const shared = DeviceBuffer.from(ab, 1, 2);
    expect(bytes(shared)).toEqual(bytes(NodeBuffer.from(ab, 1, 2)));
    new Uint8Array(ab)[1] = 9; // a view on an ArrayBuffer shares memory, like Node
    expect(shared[0]).toBe(9);
    const copy = DeviceBuffer.from(new Uint8Array([5, 6]));
    expect(bytes(copy)).toEqual([5, 6]);
    expect(bytes(DeviceBuffer.alloc(3, 7))).toEqual(bytes(NodeBuffer.alloc(3, 7)));
    expect(bytes(DeviceBuffer.concat([DeviceBuffer.from('ab'), new Uint8Array([1])]))).toEqual(bytes(NodeBuffer.concat([NodeBuffer.from('ab'), new Uint8Array([1])])));
    expect(DeviceBuffer.byteLength('שלום')).toBe(NodeBuffer.byteLength('שלום'));
  });

  it('supports what photo.ts and vapid.ts do: subarray, equals, latin1 slices, indexing', () => {
    const png = DeviceBuffer.from('iVBORw0KGgoAAAANSUhEUg==', 'base64');
    const magic = DeviceBuffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(png.subarray(0, 8)).toBeInstanceOf(DeviceBuffer);
    expect(png.subarray(0, 8).equals(magic)).toBe(NodeBuffer.from('iVBORw0KGgoAAAANSUhEUg==', 'base64').subarray(0, 8).equals(NodeBuffer.from(magic)));
    expect(png.subarray(0, 8).equals(magic)).toBe(true);
    const webp = DeviceBuffer.from('RIFF\u0000\u0000\u0000\u0000WEBPVP8 ', 'latin1');
    expect(webp.subarray(0, 4).toString('latin1')).toBe('RIFF');
    expect(webp.subarray(8, 12).toString('latin1')).toBe('WEBP');
    expect(png[0]).toBe(0x89);
    expect(DeviceBuffer.isBuffer(png)).toBe(true);
    expect(DeviceBuffer.isBuffer(new Uint8Array(1))).toBe(false);
    expect(DeviceBuffer.from('abc').toString('utf8', 1, 2)).toBe(NodeBuffer.from('abc').toString('utf8', 1, 2));
    expect(JSON.stringify(DeviceBuffer.from([1, 2]))).toBe(JSON.stringify(NodeBuffer.from([1, 2])));
  });
});
