import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
export async function GET(request: Request){const url=new URL(request.url);const code=url.searchParams.get("code");if(code&&isSupabaseConfigured()){const supabase=await createClient();await supabase.auth.exchangeCodeForSession(code);}return NextResponse.redirect(new URL("/app/dashboard",request.url));}
