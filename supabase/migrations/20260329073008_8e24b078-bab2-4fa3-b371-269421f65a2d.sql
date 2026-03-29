
-- 1) survey_reports table
create table public.survey_reports (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  source_type text not null default 'csv',
  file_path text,
  file_name text,
  file_size bigint,
  row_count int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  summary jsonb default '{}'::jsonb,
  questions jsonb default '[]'::jsonb,
  meta jsonb default '{}'::jsonb
);

alter table public.survey_reports enable row level security;

-- RLS policies
create policy "survey_reports_select_own" on public.survey_reports
  for select to authenticated
  using (owner_id = auth.uid() or public.is_admin());

create policy "survey_reports_insert_own" on public.survey_reports
  for insert to authenticated
  with check (owner_id = auth.uid());

create policy "survey_reports_update_own" on public.survey_reports
  for update to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

create policy "survey_reports_delete_own" on public.survey_reports
  for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin());

-- updated_at trigger
create trigger set_survey_reports_updated_at
  before update on public.survey_reports
  for each row execute function public.set_updated_at();

-- 2) survey_uploads storage bucket (private)
insert into storage.buckets (id, name, public) values ('survey_uploads', 'survey_uploads', false);

-- Storage RLS: owner can upload/read/delete their own files
create policy "survey_storage_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'survey_uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "survey_storage_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'survey_uploads' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

create policy "survey_storage_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'survey_uploads' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
