type UserAdminOperation =
  | "register_student"
  | "update_student_login"
  | "reset_student_password"
  | "delete_student";

export async function callUserAdminFunction<T>(
  operation: UserAdminOperation,
  payload: Record<string, unknown>,
  accessToken?: string,
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase is not configured.");

  const response = await fetch(`${url}/functions/v1/user-admin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${accessToken || key}`,
    },
    body: JSON.stringify({ operation, ...payload }),
    cache: "no-store",
  });
  const result = (await response.json().catch(() => ({}))) as { data?: T; error?: string };
  if (!response.ok) throw new Error(result.error || "Account operation failed.");
  return result.data as T;
}
