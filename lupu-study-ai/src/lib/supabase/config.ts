/** האם Supabase הוגדר (משתני NEXT_PUBLIC מוטמעים בזמן build). בלעדיו האפליקציה פועלת במצב מקומי. */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
