import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/signup";

    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      return null;
    }

    if (!isAuth) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAuthPage = req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/signup";
        if (isAuthPage) return true; // Allow access to login/signup to handle redirect in middleware function
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};
