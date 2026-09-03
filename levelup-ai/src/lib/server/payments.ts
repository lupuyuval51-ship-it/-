import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { z } from 'zod';
import { config, type Plan } from './config';
import { assert, isAdult } from './auth';
import { audit, id, now, one, run, transaction, type Row } from './db';
import { orderDto, preferences } from './store';
import { readLimitedBody } from './transport';

export interface PaymentAdapter { create(userId: string, input: unknown): { order: Row; payment: { phone: string; url: string | null; manual: boolean } }; }
export const paymentAdapter: PaymentAdapter = {
  create(userId, input) {
    const value = z.object({ plan: z.enum(['BASIC', 'PLUS', 'PRO']).optional(), marketplacePathId: z.string().max(100).optional(), payerAuthorized: z.boolean().optional() }).parse(input);
    assert(!!value.plan !== !!value.marketplacePathId, 400, 'בחרו תוכנית או מסלול אחד. / Select one plan or path.');
    const profile = preferences(userId), minor = !isAdult(profile.birthYear);
    assert(!minor || value.payerAuthorized, 403, 'לרכישה נדרש אישור הורה או בעל חשבון תשלום מורשה. / A parent or authorized account holder must approve the purchase.', 'PAYER_AUTHORIZATION_REQUIRED');
    let amount: number;
    if (value.plan) amount = one('SELECT price FROM plans WHERE id=?', value.plan)?.price ?? config.prices[value.plan as Plan];
    else { const listing = one('SELECT * FROM marketplace_paths WHERE id=? AND status=? AND deleted_at IS NULL', value.marketplacePathId!, 'approved'); assert(listing && listing.price > 0, 404, 'המסלול אינו זמין לרכישה. / Path is not available for purchase.'); assert(!one('SELECT id FROM marketplace_sales WHERE buyer_id=? AND marketplace_path_id=?', userId, listing.id), 409, 'המסלול כבר נרכש. / You already own this path.'); amount = listing.price; }
    const orderId = `LU-${new Date().getUTCFullYear()}-${id().slice(0, 8).toUpperCase()}`, time = now();
    run('INSERT INTO orders(id,user_id,plan_id,marketplace_path_id,amount,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)', orderId, userId, value.plan || null, value.marketplacePathId || null, amount, 'awaiting_payment', time, time);
    audit(userId, 'payment.created', orderId, { amount, plan: value.plan, marketplacePathId: value.marketplacePathId, payerAuthorized: value.payerAuthorized || !minor });
    return { order: orderDto(one('SELECT * FROM orders WHERE id=?', orderId)!), payment: { phone: config.bit.phone, url: config.bit.url, manual: true } };
  },
};
export function validateUpload(bytes: Buffer, claimedMime: string, purpose: string) {
  assert(bytes.length > 0 && bytes.length <= config.maxFileBytes, 400, 'הקובץ חייב להיות בגודל עד 5 MB. / File must be nonempty and at most 5 MB.', 'FILE_TOO_LARGE');
  const mime = bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ? 'image/png' : bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff ? 'image/jpeg' : bytes.subarray(0, 5).toString() === '%PDF-' ? 'application/pdf' : bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP' ? 'image/webp' : purpose === 'task' && claimedMime === 'text/plain' && !bytes.includes(0) ? 'text/plain' : null;
  assert(mime && mime === claimedMime, 400, 'סוג הקובץ אינו מורשה. אפשר להעלות PNG, JPG, WebP או PDF. / File type is not allowed. Use PNG, JPG, WebP or PDF.', 'FILE_TYPE_NOT_ALLOWED');
  if (purpose === 'avatar') assert(mime.startsWith('image/'), 400, 'תמונת פרופיל חייבת להיות קובץ תמונה. / Profile pictures must be images.');
  return mime;
}
export async function upload(userId: string, request: Request) {
  const length = Number(request.headers.get('content-length') || 0);
  assert(length <= config.maxFileBytes + 65536, 413, 'הקובץ גדול מדי. / File is too large.', 'FILE_TOO_LARGE');
  const raw = await readLimitedBody(request, config.maxFileBytes + 65536);
  const bounded = new Request(request.url, { method: 'POST', headers: request.headers, body: raw });
  const form = await bounded.formData(), file = form.get('file'), purpose = z.enum(['payment', 'task', 'avatar']).parse(form.get('purpose') || 'task'), orderId = String(form.get('orderId') || '');
  assert(file instanceof File, 400, 'יש לבחור קובץ. / Select a file.');
  assert(file.size <= config.maxFileBytes, 413, 'הקובץ גדול מדי. / File is too large.', 'FILE_TOO_LARGE');
  if (purpose === 'payment') {
    const order = one('SELECT * FROM orders WHERE id=? AND user_id=?', orderId, userId);
    assert(order && ['awaiting_payment', 'created', 'rejected'].includes(order.status), 409, 'לא ניתן להעלות אישור במצב ההזמנה הנוכחי. / This order cannot accept a proof in its current state.', 'ORDER_STATE_INVALID');
  }
  const bytes = Buffer.from(await file.arrayBuffer()), mime = validateUpload(bytes, file.type, purpose), fileId = id(), storageName = `${fileId}.bin`;
  const storage = resolve(process.env.LEVELUP_UPLOAD_DIR || resolve(process.cwd(), 'data', 'uploads'));
  await mkdir(storage, { recursive: true });
  const storedPath = resolve(storage, storageName);
  await writeFile(storedPath, bytes, { flag: 'wx', mode: 0o600 });
  try {
    transaction(() => {
      if (purpose === 'payment') {
        const order = one('SELECT * FROM orders WHERE id=? AND user_id=?', orderId, userId);
        assert(order && ['awaiting_payment', 'created', 'rejected'].includes(order.status), 409, 'ההזמנה השתנתה. / The order changed.');
      }
      run('INSERT INTO payment_proofs(id,user_id,order_id,purpose,file_name,mime,bytes,storage_name,sha256,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)', fileId, userId, orderId || null, purpose, file.name.replace(/[^\p{L}\p{N} ._()-]/gu, '').slice(0, 120) || 'upload', mime, bytes.length, storageName, createHash('sha256').update(bytes).digest('hex'), now(), now());
      if (purpose === 'payment') { run("UPDATE orders SET proof_id=?,status='under_review',review_note=NULL,updated_at=? WHERE id=? AND user_id=?", fileId, now(), orderId, userId); audit(userId, 'payment.proof_uploaded', orderId, { fileId }); audit(userId, 'payment.under_review', orderId); }
      if (purpose === 'avatar') { const { displayName, birthYear, ...profile } = preferences(userId); void displayName; void birthYear; run('UPDATE profiles SET preferences=?,updated_at=? WHERE user_id=?', JSON.stringify({ ...profile, avatarId: fileId }), now(), userId); }
    });
  } catch (error) {
    // A rejected write must not leave an unreferenced file behind in private storage.
    await rm(storedPath, { force: true }).catch(() => {});
    throw error;
  }
  return { fileId, id: fileId, name: file.name, mime, bytes: bytes.length, url: `/api/files/${fileId}`, status: purpose === 'payment' ? 'under_review' : 'saved' };
}
export async function fileResponse(user: Row, fileId: string) {
  const file = one('SELECT * FROM payment_proofs WHERE id=? AND deleted_at IS NULL', fileId);
  assert(file && (file.user_id === user.id || user.role === 'admin'), 404, 'הקובץ לא נמצא. / File not found.');
  assert(/^[a-f0-9-]+\.bin$/.test(file.storage_name), 500, 'Invalid storage reference.');
  const bytes = await readFile(resolve(process.env.LEVELUP_UPLOAD_DIR || resolve(process.cwd(), 'data', 'uploads'), file.storage_name));
  return new Response(bytes, { headers: { 'Content-Type': file.mime, 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.file_name)}`, 'Content-Length': String(bytes.length), 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store', 'Content-Security-Policy': "default-src 'none'; sandbox" } });
}
