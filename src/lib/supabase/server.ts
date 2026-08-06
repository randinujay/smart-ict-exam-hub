import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cached per request: Server Components/Actions that need a Supabase client all
// call this function independently (getPublicPrograms, getTestimonials, etc. are
// each wrapped in their own `cache()` too). Without sharing one client instance,
// concurrent calls in the same request (e.g. the homepage's
// `Promise.all([getPublicPrograms(), getTestimonials()])`) each construct their own
// client and can independently redeem the same refresh-token cookie at the same
// time. Supabase rotates refresh tokens on use, so whichever call loses the race
// gets "Invalid Refresh Token: Refresh Token Not Found" even though the session was
// perfectly valid a moment earlier. Sharing one client per request means there is
// only ever one in-flight refresh, not N of them.
export const createClient = cache(async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) throw new Error("Supabase server environment variables are not configured.");

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Session refresh is handled by proxy.ts when this runs in a Server Component.
        }
      },
    },
  });
});
