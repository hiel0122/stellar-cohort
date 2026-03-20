const TARGET_API_URL = "https://link24.kr/api/shoturl.apsl";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json",
};

const supportedKeys = ["customer_id", "customerId", "api_key", "apiKey", "org_url", "orgUrl"];

type RequestPayload = Record<string, unknown>;

function isRecord(value: unknown): value is RequestPayload {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders,
  });
}

async function parseRequestBody(req: Request): Promise<RequestPayload> {
  try {
    const json = await req.clone().json();
    if (isRecord(json)) {
      return json;
    }
  } catch {
    // fall through to text parsing
  }

  const rawText = await req.text();
  const text = rawText.trim();
  if (!text) {
    return {};
  }

  const formPayload = Object.fromEntries(new URLSearchParams(text).entries());
  if (Object.keys(formPayload).some((key) => supportedKeys.includes(key))) {
    return formPayload;
  }

  try {
    const json = JSON.parse(text);
    if (isRecord(json)) {
      return json;
    }
  } catch {
    // ignore malformed fallback JSON
  }

  return {};
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get("content-type") ?? "";
    const payload = await parseRequestBody(req);

    const customer_id = getTrimmedString(payload.customer_id ?? payload.customerId);
    const api_key = getTrimmedString(payload.api_key ?? payload.apiKey);
    const org_url = getTrimmedString(payload.org_url ?? payload.orgUrl);

    console.log("link24-shoturl request", {
      contentType,
      hasCustomerId: !!customer_id,
      hasApiKey: !!api_key,
      hasOrgUrl: !!org_url,
      orgUrlPrefix: org_url.slice(0, 60),
    });

    if (!customer_id) {
      return jsonResponse({ ok: false, status: 400, message: "missing customer_id" }, 400);
    }

    if (!api_key) {
      return jsonResponse({ ok: false, status: 400, message: "missing api_key" }, 400);
    }

    if (!org_url) {
      return jsonResponse({ ok: false, status: 400, message: "missing org_url" }, 400);
    }

    if (!/^https?:\/\//i.test(org_url)) {
      return jsonResponse(
        { ok: false, status: 400, message: "invalid org_url (must start with http/https)" },
        400,
      );
    }

    const params = new URLSearchParams({
      customer_id,
      api_key,
      org_url,
    });

    const response = await fetch(TARGET_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const bodyText = await response.text();
    console.log("link24-shoturl link24 response", {
      status: response.status,
      bodyPreview: bodyText.slice(0, 300),
    });

    let parsedBody: RequestPayload | null = null;
    try {
      const json = JSON.parse(bodyText);
      if (isRecord(json)) {
        parsedBody = json;
      }
    } catch {
      // allow non-JSON body from Link24
    }

    const result = getTrimmedString(parsedBody?.result);
    const url = getTrimmedString(parsedBody?.url ?? parsedBody?.short_url ?? parsedBody?.shortUrl);
    const message = getTrimmedString(parsedBody?.message);

    if (response.ok && result === "OK" && url) {
      return jsonResponse({ ok: true, url, message });
    }

    return jsonResponse(
      {
        ok: false,
        status: 502,
        message: `link24 failed: ${message || `unexpected response (status ${response.status})`}`,
        raw: bodyText.slice(0, 300),
      },
      502,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    console.error("link24-shoturl unexpected error", { message });
    return jsonResponse({ ok: false, status: 500, message }, 500);
  }
});
