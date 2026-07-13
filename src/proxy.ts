import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    if (process.env.NODE_ENV !== "production") return NextResponse.next();
    if (request.nextUrl.pathname.replace(/\/+$/, "") === "/adminrandinu") return NextResponse.next();
    const destination = request.nextUrl.clone();
    destination.pathname = request.nextUrl.pathname.startsWith("/adminrandinu/") ? "/adminrandinu" : "/login";
    destination.search = "";
    destination.searchParams.set("error", "configuration");
    return NextResponse.redirect(destination);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const studentProtected = pathname.startsWith("/app");
  const adminProtected = pathname.startsWith("/adminrandinu/") && pathname !== "/adminrandinu";

  if (studentProtected && !user) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (adminProtected) {
    if (!user) return NextResponse.redirect(new URL("/adminrandinu", request.url));
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*", "/adminrandinu/:path*"],
};
