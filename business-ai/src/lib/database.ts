/**
 * Typed access to the generated Supabase schema (`npm run db:types` → @db).
 * Row types use plain `string` for CHECK-constrained text columns; narrow them with the guards
 * in the owning feature (e.g. `parseProfile` in src/features/settings/api.ts).
 */
import type { Database } from '@db';

export type { Database, Json } from '@db';

type PublicSchema = Database['public'];

export type TableName = keyof PublicSchema['Tables'];
export type Row<T extends TableName> = PublicSchema['Tables'][T]['Row'];
export type InsertRow<T extends TableName> = PublicSchema['Tables'][T]['Insert'];
export type UpdateRow<T extends TableName> = PublicSchema['Tables'][T]['Update'];
export type RpcName = keyof PublicSchema['Functions'];
export type RpcReturns<F extends RpcName> = PublicSchema['Functions'][F]['Returns'];
