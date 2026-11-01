/** Compile-time parity: define a feature's English tree once and Hebrew MUST provide the identical shape. */
export type Widen<T> = T extends string ? string : { -readonly [K in keyof T]: Widen<T[K]> };
export interface FeatureDict<T> { en: T; he: Widen<T> }
export function defineFeature<T extends Record<string, unknown>>(en: T, he: Widen<T>): FeatureDict<T> { return { en, he }; }
