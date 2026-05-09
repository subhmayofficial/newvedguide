import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { safeAuthRedirect } from "@/lib/auth/safe-redirect";
import { isAdminUser } from "@/lib/admin/admin-auth";

function isAdminPath(pathname: string): boolean {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/admindeoghar") ||
    pathname.startsWith("/astro-ops")
  );
}

function isAdminLoginPath(pathname: string): boolean {
  return (
    pathname === "/admin/login" || pathname === "/admindeoghar/login"
  );
}

function isProtectedCustomerPath(pathname: string): boolean {
  if (pathname === "/user" || pathname.startsWith("/user/")) return true;
  if (pathname.startsWith("/users/")) return true;
  if (pathname.startsWith("/astrologers/chats")) return true;
  return false;
}

/** Multipart upload route: avoid proxy auth round-trip to prevent request body parse failures. */
function shouldBypassProxy(pathname: string): boolean {
  return /^\/api\/admin\/orders\/[^/]+\/kundli-report-upload$/.test(pathname);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (shouldBypassProxy(pathname)) {
    return NextResponse.next({ request });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (isAdminPath(pathname)) {
    const reqHeaders = new Headers(request.headers);
    reqHeaders.set("x-admin-pathname", pathname);

    const nextWithAdminHeaders = () =>
      NextResponse.next({
        request: { headers: reqHeaders },
      });

    if (isAdminLoginPath(pathname)) {
      return nextWithAdminHeaders();
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      const loginUrl = new URL("/admindeoghar/login", request.url);
      loginUrl.searchParams.set("error", "config");
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    let adminResponse = nextWithAdminHeaders();

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          adminResponse = nextWithAdminHeaders();
          cookiesToSet.forEach(({ name, value, options }) =>
            adminResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL("/admindeoghar/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!isAdminUser(user)) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return adminResponse;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    user &&
    (pathname === "/login" || pathname === "/signup")
  ) {
    const dest = safeAuthRedirect(request.nextUrl.searchParams.get("redirect"));
    return NextResponse.redirect(new URL(dest, request.url));
  }

  if (isProtectedCustomerPath(pathname) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "redirect",
      `${pathname}${request.nextUrl.search}`
    );
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
