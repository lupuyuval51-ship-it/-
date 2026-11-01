export const REPO_ROOT: string;
export function walk(dir: string, exts: string[], out?: string[]): string[];
export function read(p: string): string;
export function rel(p: string): string;
export function report(tool: string, violations: string[]): number;
export function lineOf(text: string, idx: number): number;
