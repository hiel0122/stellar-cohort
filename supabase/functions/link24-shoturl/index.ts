import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const TARGET_API_URL = "https://link24.kr/api/shoturl.apsl";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-user-jwt, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

type Rec = Record<string, unknown>;
function isRecord(v: unknown): v is Rec {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

async function parseBody(req: Request): Promise<Rec> {
  try {
    const j = await req.clone().json();
    if (isRecord(j)) return j;
  } catch { /* fall through */ }
  const raw = (await req.text()).trim();
  if (!raw) return {};
  try {
    const j = JSON.parse(raw);
    if (isRecord(j)) return j;
  } catch { /* ignore */ }
  return {};
}

/* ── Permission check ── */
const BASELINE_ALLOWED_ROLES = new Set(["admin", "marketing"]);
const PAGE_KEY = "link_tracking";

function hasLinkTrackingAccess(
  role: string,
  allowPages: string[] | null,
  denyPages: string[] | null,
): boolean {
  if (role === "pending") return false;
  if (denyPages?.includes(PAGE_KEY)) return false;
  const baselineAllowed = BASELINE_ALLOWED_ROLES.has(role);
  const overrideAllowed = allowPages?.includes(PAGE_KEY) ?? false;
  return baselineAllowed || overrideAllowed;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    /* ── 1. Auth check via x-user-jwt header ── */
    const userJwt = req.headers.get("x-user-jwt");
    if (!userJwt?.startsWith("Bearer ")) {
      return jsonResponse({ ok: false, message: "Unauthorized (missing x-user-jwt)" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: userJwt } },
    });

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return jsonResponse({ ok: false, message: "Unauthorized" }, 401);
    }

    /* ── 2. Profile & permission check ── */
    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("role, allow_pages, deny_pages")
      .eq("id", user.id)
      .maybeSingle();

    if (profErr || !profile) {
      return jsonResponse({ ok: false, message: "Profile not found" }, 403);
    }

    if (!hasLinkTrackingAccess(profile.role, profile.allow_pages, profile.deny_pages)) {
      return jsonResponse({ ok: false, message: "Forbidden: no link_tracking access" }, 403);
    }

    /* ── 3. Read org_url from request body ── */
    const payload = await parseBody(req);
    const org_url = str(payload.org_url ?? payload.orgUrl);

    if (!org_url) return jsonResponse({ ok: false, status: 400, message: "missing org_url" }, 400);
    if (!/^https?:\/\//i.test(org_url)) {
      return jsonResponse({ ok: false, status: 400, message: "invalid org_url (must start with http/https)" }, 400);
    }

    /* ── 4. Read customer_id from DB (app_settings) ── */
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: settingsRow, error: settingsErr } = await adminClient
      .from("app_settings")
      .select("value")
      .eq("key", "link24")
      .maybeSingle();

    if (settingsErr || !settingsRow) {
      return jsonResponse({ ok: false, message: "Link24 설정이 없습니다. 관리자에게 문의하세요." }, 400);
    }

    const settingsVal = settingsRow.value as Rec;
    const customer_id = str(settingsVal?.customer_id);
    if (!customer_id) {
      return jsonResponse({ ok: false, message: "Customer ID가 설정되지 않았습니다." }, 400);
    }

    /* ── 5. Read API key from Secrets ── */
    const api_key = Deno.env.get("LINK24_ACCESS_KEY") ?? "";
    if (!api_key) {
      return jsonResponse({ ok: false, message: "Link24 API Key가 서버에 설정되지 않았습니다." }, 500);
    }

    /* ── 6. Call Link24 API ── */
    const params = new URLSearchParams({ customer_id, api_key, org_url });
    const response = await fetch(TARGET_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const bodyText = await response.text();
    let parsedBody: Rec | null = null;
    try {
      const j = JSON.parse(bodyText);
      if (isRecord(j)) parsedBody = j;
    } catch { /* allow non-JSON */ }

    const result = str(parsedBody?.result);
    const url = str(parsedBody?.url ?? parsedBody?.short_url ?? parsedBody?.shortUrl);
    const message = str(parsedBody?.message);
    const isSuccess = response.ok && (result === "OK" || result === "Y" || result === "true" || parsedBody?.result === true);

    if (isSuccess && url) {
      return jsonResponse({ ok: true, short_url: url, message, raw_result: result });
    }

    return jsonResponse({
      ok: false,
      message: `link24 failed: ${message || `unexpected response (status ${response.status})`}`,
      link24_status: response.status,
      link24_body: bodyText.slice(0, 300),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    console.error("link24-shoturl error", { message });
    return jsonResponse({ ok: false, status: 500, message }, 500);
  }
});
