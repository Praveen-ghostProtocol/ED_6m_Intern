import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { roleHomePath, roles, type AppRole } from "@/lib/rbac";
import { getSupabaseAnonKey, getSupabaseUrl, hasSupabasePublicEnv } from "./env";

type SupabaseCookie = { name: string; value: string; options: CookieOptions };

const protectedPrefixes = ["/student", "/recruiter", "/organizer"];
const authPages = ["/login", "/change-password"];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function roleFromPath(pathname: string): AppRole | null {
  return roles.find((role) => pathname === `/${role}` || pathname.startsWith(`/${role}/`)) ?? null;
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  const loginUrl = new URL("/login", request.url);

  if (isProtectedPath(url.pathname)) {
    loginUrl.searchParams.set("next", `${url.pathname}${url.search}`);
  }

  return NextResponse.redirect(loginUrl);
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: SupabaseCookie[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const pathname = request.nextUrl.pathname;
  const requiresAuth = isProtectedPath(pathname) || authPages.includes(pathname);

  if (!requiresAuth) {
    return response;
  }

  if (!hasSupabasePublicEnv()) {
    return isProtectedPath(pathname) ? redirectToLogin(request) : response;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return pathname === "/login" ? response : redirectToLogin(request);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,must_change_password,is_active")
    .eq("id", user.id)
    .single();

  if (!profile?.is_active || !roles.includes(profile.role as AppRole)) {
    return redirectToLogin(request);
  }

  const role = profile.role as AppRole;

  if (profile.must_change_password && pathname !== "/change-password") {
    return NextResponse.redirect(new URL("/change-password", request.url));
  }

  if (pathname === "/login") {
    return NextResponse.redirect(new URL(roleHomePath[role], request.url));
  }

  const requiredRole = roleFromPath(pathname);

  if (requiredRole && requiredRole !== role) {
    return NextResponse.redirect(new URL(roleHomePath[role], request.url));
  }

  return response;
}