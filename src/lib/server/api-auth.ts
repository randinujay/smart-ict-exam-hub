import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function requireApiUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  return { supabase, user };
}

export async function requireApiAdmin() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth;
  const { data: profile } = await auth.supabase.from("profiles").select("role").eq("id", auth.user.id).single();
  if (profile?.role !== "admin") return { error: NextResponse.json({ error: "Administrator permission required." }, { status: 403 }) };
  return auth;
}
