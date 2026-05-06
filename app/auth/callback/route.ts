import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

const ALLOWED_NEXT_PREFIXES = ["/astrologers", "/user", "/users"];

function safeNext(raw: string | null): string {
  if (!raw) return "/astrologers";
  const path = decodeURIComponent(raw.trim());
  if (!path.startsWith("/") || path.startsWith("//")) return "/astrologers";
  const ok = ALLOWED_NEXT_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`)
  );
  return ok ? path : "/astrologers";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (toSet) => {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // OAuth error — send back to login with error hint
  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
