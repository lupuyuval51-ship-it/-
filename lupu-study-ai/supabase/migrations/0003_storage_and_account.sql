-- LUPU Study AI – אחסון קבצים פרטי ומחיקת חשבון

-- דלי פרטי: קובצי PDF, תמונות ותמונות תרגילים. הנתיב: {user_id}/{file_id}
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'study-files', 'study-files', false, 15728640,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'text/plain', 'text/markdown']
)
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy study_files_select on storage.objects for select to authenticated
  using (bucket_id = 'study-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy study_files_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'study-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy study_files_update on storage.objects for update to authenticated
  using (bucket_id = 'study-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy study_files_delete on storage.objects for delete to authenticated
  using (bucket_id = 'study-files' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- מחיקת החשבון וכל הנתונים (מחיקת auth.users מוחקת בשרשור את כל הטבלאות דרך on delete cascade).
-- קבצים בדלי נמחקים על ידי הלקוח דרך Storage API לפני הקריאה לפונקציה.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
