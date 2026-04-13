import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPath =
    pathname.startsWith("/admin") || pathname.startsWith("/admindeoghar");

  if (!isAdminPath) {
    return NextResponse.next();
  }

  const reqHeaders = new Headers(request.headers);
  reqHeaders.set("x-admin-pathname", pathname);

  const nextWithHeaders = () =>
    NextResponse.next({
      request: { headers: reqHeaders },
    });

  if (pathname === "/admin/login" || pathname === "/admindeoghar/login") {
    return nextWithHeaders();
  }

  let response = nextWithHeaders();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = nextWithHeaders();
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/admindeoghar/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/admindeoghar", "/admindeoghar/:path*"],
};
