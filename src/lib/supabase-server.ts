import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

// User-scoped client: reads the session from cookies. Used for identity
// (auth.getUser) in route handlers and server components.
export async function supabaseServer() {
  // Auth checks read the clock internally. They must run on an actual request,
  // not while Cache Components speculatively prerenders a signed-in session.
  await connection();
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a server component: cookie writes are handled by
            // the proxy on the next request.
          }
        },
      },
    }
  );
}

export async function currentUser() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
