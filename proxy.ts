import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const ROLE_ROUTES: { path: string; roles: string[] }[] = [
  { path: "/roles",       roles: ["superadmin"] },
  { path: "/employees",   roles: ["superadmin", "admin", "hr_manager"] },
  { path: "/departments", roles: ["superadmin", "admin", "hr_manager"] },
];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const pathname = req.nextUrl.pathname;
  const isAuthPage = pathname.startsWith("/login");
  const isChangePasswordPage = pathname.startsWith("/change-password");

  if (!isLoggedIn && !isAuthPage && !isChangePasswordPage)
    return NextResponse.redirect(new URL("/login", req.url));

  if (isLoggedIn && isAuthPage)
    return NextResponse.redirect(new URL("/dashboard", req.url));

  if (isLoggedIn) {
    const user = req.auth?.user as any;
    // force password change before accessing anything else
    if (user?.mustChangePassword && !isChangePasswordPage)
      return NextResponse.redirect(new URL("/change-password", req.url));

    const role = user?.role || "employee";
    const restricted = ROLE_ROUTES.find((r) => pathname.startsWith(r.path));
    if (restricted && !restricted.roles.includes(role))
      return NextResponse.redirect(new URL("/dashboard", req.url));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
