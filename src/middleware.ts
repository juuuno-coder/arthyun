import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Temporary: Allow all access. Client-side protection will handle Admin routes.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
