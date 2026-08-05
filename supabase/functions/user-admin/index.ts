import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const headers = { "Content-Type": "application/json" };
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
const validPhone = (value: unknown): value is string => typeof value === "string" && /^94(7[0-8])\d{7}$/.test(value);
const validId = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return respond({ error: "Method not allowed." }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return respond({ error: "Service configuration is unavailable." }, 503);

  const service = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return respond({ error: "Invalid request." }, 400); }

  if (body.operation === "register_student") {
    if (!validPhone(body.phone) || !validId(body.programId) || !validId(body.batchId) || typeof body.password !== "string" || body.password.length < 8 || typeof body.metadata !== "object" || !body.metadata) {
      return respond({ error: "Invalid registration details." }, 400);
    }
    const metadata = body.metadata as Record<string, unknown>;
    const required = ["first_name", "last_name", "date_of_birth", "address", "school", "medium"];
    if (required.some((key) => typeof metadata[key] !== "string" || !(metadata[key] as string).trim())) return respond({ error: "Complete all required registration fields." }, 400);
    if (!['Sinhala', 'English'].includes(String(metadata.medium))) return respond({ error: "Invalid medium." }, 400);
    const { data: program } = await service.from("programs").select("id").eq("id", body.programId).eq("is_active", true).eq("registration_open", true).maybeSingle();
    if (!program) return respond({ error: "That program is not open for registration." }, 400);
    const { data: batch } = await service
      .from("batches")
      .select("id,academic_batches!inner(id)")
      .eq("id", body.batchId)
      .eq("program_id", body.programId)
      .eq("is_active", true)
      .eq("registration_open", true)
      .eq("academic_batches.is_active", true)
      .maybeSingle();
    if (!batch) return respond({ error: "That class is not open for registration." }, 400);
    const { data, error } = await service.auth.admin.createUser({
      email: `${body.phone}@students.smartict.lk`, password: body.password, email_confirm: true,
      user_metadata: { ...metadata, requested_program_id: body.programId, requested_batch_id: body.batchId, contact_number: body.phone, registration_source: "public_lms" },
    });
    if (error || !data.user) {
      const duplicate = /already|registered|exists/i.test(error?.message || "");
      return respond({ error: duplicate ? "An account already exists for this mobile number." : "We could not create the account." }, duplicate ? 409 : 400);
    }
    return respond({ data: { userId: data.user.id } }, 201);
  }

  const authorization = request.headers.get("Authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  const authenticated = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { autoRefreshToken: false, persistSession: false } });
  const { data: { user } } = await authenticated.auth.getUser(token);
  if (!user) return respond({ error: "Authentication required." }, 401);
  const { data: profile } = await service.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return respond({ error: "Administrator access required." }, 403);

  if (!validId(body.studentId)) return respond({ error: "Invalid student account." }, 400);
  const { data: student } = await service.from("profiles").select("id").eq("id", body.studentId).eq("role", "student").single();
  if (!student) return respond({ error: "Student account not found." }, 404);

  if (body.operation === "update_student_login") {
    if (!validPhone(body.phone) || typeof body.firstName !== "string" || typeof body.lastName !== "string") return respond({ error: "Invalid login details." }, 400);
    const { error } = await service.auth.admin.updateUserById(body.studentId, {
      email: `${body.phone}@students.smartict.lk`, email_confirm: true,
      user_metadata: { first_name: body.firstName, last_name: body.lastName, contact_number: body.phone },
    });
    return error ? respond({ error: error.message }, 400) : respond({ data: { updated: true } });
  }
  if (body.operation === "reset_student_password") {
    if (typeof body.password !== "string" || body.password.length < 8) return respond({ error: "Password must contain at least 8 characters." }, 400);
    const { error } = await service.auth.admin.updateUserById(body.studentId, { password: body.password });
    return error ? respond({ error: error.message }, 400) : respond({ data: { updated: true } });
  }
  if (body.operation === "delete_student") {
    const { error } = await service.auth.admin.deleteUser(body.studentId);
    return error ? respond({ error: error.message }, 400) : respond({ data: { deleted: true } });
  }
  return respond({ error: "Unsupported operation." }, 400);
});
