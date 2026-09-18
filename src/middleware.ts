import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const header = req.headers.get("authorization");

  if (header) {
    const [, encoded] = header.split(" ");
    const [user, pass] = atob(encoded).split(":");
    if (user === process.env.SITE_USER && pass === process.env.SITE_PASS) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Auth required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Protected"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};