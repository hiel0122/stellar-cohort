ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS clearance_level int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS allow_pages text[] NULL,
  ADD COLUMN IF NOT EXISTS deny_pages  text[] NULL;

COMMENT ON COLUMN public.profiles.clearance_level IS '1=일반, 2=선임, 3=팀장, 4=임원/관리자급';
COMMENT ON COLUMN public.profiles.allow_pages IS 'role baseline에 추가 허용할 페이지 키 목록';
COMMENT ON COLUMN public.profiles.deny_pages IS 'role baseline에서 제거(차단)할 페이지 키 목록';