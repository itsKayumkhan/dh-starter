import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth/server";

const handler = toNextJsHandler(auth);

function isBlocked(request: Request) {
  let path = new URL(request.url).pathname;
  try {
    for (let index = 0; index < 10; index++) {
      const decoded = decodeURIComponent(path);
      if (decoded === path) break;
      path = decoded;
    }
  } catch {
    return true;
  }
  if (/%[0-9a-f]{2}/i.test(path)) return true;
  return (
    /^\/api\/auth\/admin(?:\/|$)/i.test(path) ||
    /^\/api\/auth\/delete-user\/?$/i.test(path)
  );
}

export function GET(request: Request) {
  if (isBlocked(request)) return new Response(null, { status: 404 });
  return handler.GET(request);
}

export function POST(request: Request) {
  if (isBlocked(request)) return new Response(null, { status: 404 });
  return handler.POST(request);
}
