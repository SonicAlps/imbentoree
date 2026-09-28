import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  /*
   * PUBLIC CUSTOMER PAGES + PUBLIC CUSTOMER API
   */
  const isPublicRoute =
    pathname === "/waitlist" ||
    pathname.startsWith("/track/") ||
    pathname.startsWith("/api/waitlist/");

  if (isPublicRoute) {
    return NextResponse.next();
  }

  /*
   * Everything below here may require authentication.
   */

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(
            ({ name, value, options }) => {
              response.cookies.set(
                name,
                value,
                options
              );
            }
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log(
    "PROXY AUTH:",
    user ? `Logged in as ${user.email}` : "NO USER"
  );

  /*
   * LOGIN PAGE
   */
  if (pathname === "/login") {
    if (user) {
      return NextResponse.redirect(
        new URL("/orders", request.url)
      );
    }

    return response;
  }

  /*
   * EVERYTHING ELSE REQUIRES LOGIN
   */
  if (!user) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};