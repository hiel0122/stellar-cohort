import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const ADMIN_EMAIL = "admin@bobusanggroup.com";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const password = Deno.env.get("BOOTSTRAP_ADMIN_PASSWORD");
  if (!password) {
    return new Response(JSON.stringify({ error: "missing password secret" }), { status: 500 });
  }

  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = list?.users.find((u) => u.email === ADMIN_EMAIL);

  let userId = existing?.id;
  if (existing) {
    await supabase.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Administrator" },
    });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    userId = data.user.id;
  }

  await supabase.from("profiles").upsert({
    id: userId,
    email: ADMIN_EMAIL,
    full_name: "Administrator",
    role: "admin",
    clearance_level: 5,
  });

  return new Response(JSON.stringify({ ok: true, userId }), {
    headers: { "Content-Type": "application/json" },
  });
});
