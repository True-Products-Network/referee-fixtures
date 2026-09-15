import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)
  
  // Protect routes that require authentication
  const protectedPaths = ['/today', '/sources', '/fixtures', '/calendar', '/earnings', '/check', '/more']
  const authPaths = ['/auth/signin', '/auth/signup']
  
  const pathname = request.nextUrl.pathname
  
  // Check if path is protected
  const isProtected = protectedPaths.some(path => pathname.startsWith(path))
  const isAuthPath = authPaths.some(path => pathname === path)
  
  if (isProtected || isAuthPath) {
    // Get the supabase client from the response to check auth
    const supabase = response.headers.get('x-supabase-auth')
    
    // For now, let the client-side handle auth redirects
    // This allows the auth state to be checked properly
  }
  
  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
