import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const studentProtected = pathname.startsWith("/app");
  const adminProtected = pathname.startsWith("/adminrandinu/") && pathname !== "/adminrandinu";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    // Supabase isn't configured. Only the protected trees need to bounce somewhere
    // useful (the matcher below now covers the whole site, not just those trees,
    // so this must stay scoped — otherwise a missing env var would take down the
    // public marketing pages too, not just the app/admin areas that need auth).
    if (process.env.NODE_ENV !== "production") return NextResponse.next();
    if (!studentProtected && !adminProtected) return NextResponse.next();
    const destination = request.nextUrl.clone();
    destination.pathname = adminProtected ? "/adminrandinu" : "/login";
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

  // This call is what refreshes an expiring session and persists the rotated
  // cookies onto `response` — the only place in the app that can. A transient
  // failure here (Supabase hiccup, network blip) must not take down every page on
  // the site now that the matcher is broad, so unprotected routes fail open.
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] = null;
  try {
    ({ data: { user } } = await supabase.auth.getUser());
  } catch (error) {
    console.error("proxy: supabase.auth.getUser() failed", error);
    if (!studentProtected && !adminProtected) return response;
  }

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
  // Runs on (almost) every request, not just the protected /app and /adminrandinu
  // trees. supabase.auth.getUser() below is what actually refreshes an expiring
  // session and persists the rotated cookies via `response` — middleware is the
  // only place in this app that CAN persist those cookies (Server Components
  // can only read cookies, never write them). Restricting the matcher to just the
  // protected routes left public pages like "/", "/register" and "/login" reading
  // a stale/expiring session with no way to refresh-and-persist it, which is what
  // produced the "Invalid Refresh Token: Refresh Token Not Found" errors reported
  // there: each public page render could still spend the current refresh token via
  // its own Supabase client, but could never write the rotated replacement back to
  // the browser, so the next request presented an already-consumed token.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)"],
};
