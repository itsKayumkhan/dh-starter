import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { ROUTES } from "@/lib/constants/routes";

export function proxy(request: NextRequest) {
  // Cookie presence is an optimistic UX gate. Real authorization runs server-side.
  const signedIn = Boolean(getSessionCookie(request));
  const path = request.nextUrl.pathname;
  if (
    !signedIn &&
    (path === ROUTES.dashboard ||
      path.startsWith(`${ROUTES.dashboard}/`) ||
      path === ROUTES.admin ||
      path.startsWith(`${ROUTES.admin}/`))
  ) {
    const url = new URL(ROUTES.login, request.url);
    url.searchParams.set("next", path + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  if (signedIn && (path === ROUTES.login || path === ROUTES.signup))
    return NextResponse.redirect(new URL(ROUTES.dashboard, request.url));
  return NextResponse.next();
}
