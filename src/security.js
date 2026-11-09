import crypto from 'node:crypto';
import { config } from './config.js';
export const id = (prefix='id') => `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(6).toString('hex')}`;
export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
export function verifyPassword(password, stored='') {
  const [salt, expected] = stored.split(':'); if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString('hex');
  try { return crypto.timingSafeEqual(Buffer.from(actual,'hex'), Buffer.from(expected,'hex')); } catch { return false; }
}
const sign = data => crypto.createHmac('sha256', config.sessionSecret).update(data).digest('base64url');
export function makeSession(userId, ttlMs=1000*60*60*24*30){ const p=Buffer.from(JSON.stringify({userId,exp:Date.now()+ttlMs})).toString('base64url'); return `${p}.${sign(p)}`; }
export function readSession(token=''){ const [p,s]=token.split('.'); if(!p||!s||sign(p)!==s)return null; try{const x=JSON.parse(Buffer.from(p,'base64url')); return x.exp>Date.now()?x:null}catch{return null} }
export const csrfFor = token => sign(`csrf:${token}`);
export const safeText = (v,max=500) => String(v??'').replace(/[<>\u0000-\u001f]/g,'').trim().slice(0,max);
export const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||''));
export const strongPassword = v => typeof v==='string' && v.length>=8 && /[A-Za-z]/.test(v) && /\d/.test(v);
export function parseCookies(header=''){ return Object.fromEntries(header.split(';').map(x=>x.trim()).filter(Boolean).map(x=>{const i=x.indexOf('=');return [decodeURIComponent(x.slice(0,i)),decodeURIComponent(x.slice(i+1))]})); }
