export interface CoachStatus { provider: string; freeTierNotice: boolean; limits: { perMinute: number; perDay: number } }
export interface ThreadRow { id: string; title: string; updatedAt: string }
export interface CoachMsg { id: string; role: 'user' | 'assistant'; content: string; provider: string | null; safetyCategory: string | null; createdAt?: string }
export interface ThreadDetail { thread: { id: string; title: string }; messages: CoachMsg[] }
export const ck = { status: ['coach', 'status'] as const, threads: ['coach', 'threads'] as const, thread: (id: string) => ['coach', 'thread', id] as const };
