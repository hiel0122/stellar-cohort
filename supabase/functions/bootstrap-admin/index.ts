import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const EMAIL = "admin@admin.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const password = Deno.env.get("BOOTSTRAP_ADMIN_PASSWORD")!;

  let userId: string | null = null;
  const { data: created, error } = await admin.auth.admin.createUser({
    email: EMAIL,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Administrator" },
  });
  if (created?.user) userId = created.user.id;

  if (!userId) {
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const found = list?.users.find((u) => u.email === EMAIL);
    if (found) {
      userId = found.id;
      await admin.auth.admin.updateUserById(found.id, { password, email_confirm: true });
    }
  }

  if (!userId) {
    return new Response(JSON.stringify({ error: error?.message ?? "failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await admin.from("profiles").upsert(
    { id: userId, email: EMAIL, full_name: "Administrator", role: "admin", clearance_level: 5 },
    { onConflict: "id" },
  );

  return new Response(JSON.stringify({ ok: true, userId }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
