import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and getClaims() -- see
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const { data } = await supabase.auth.getClaims()
  const isLoggedIn = Boolean(data?.claims)

  const { pathname } = request.nextUrl

  const areas = [
    { prefix: '/admin', loginPath: '/admin/login', publicPaths: ['/admin/login'] },
    {
      prefix: '/account',
      loginPath: '/account/login',
      publicPaths: ['/account/login', '/account/signup'],
    },
    {
      // NOTE: prefix is singular ("/landscaper") -- the existing public,
      // login-free signup page is plural ("/landscapers"). Matching must
      // not treat "/landscapers" as falling under this prefix.
      prefix: '/landscaper',
      loginPath: '/landscaper/login',
      publicPaths: ['/landscaper/login', '/landscaper/signup'],
    },
  ]

  for (const area of areas) {
    const inArea =
      pathname === area.prefix || pathname.startsWith(`${area.prefix}/`)
    if (!inArea) continue

    const isPublicPath = area.publicPaths.includes(pathname)

    if (!isPublicPath && !isLoggedIn) {
      const url = request.nextUrl.clone()
      url.pathname = area.loginPath
      return NextResponse.redirect(url)
    }

    if (pathname === area.loginPath && isLoggedIn) {
      const url = request.nextUrl.clone()
      url.pathname = area.prefix
      return NextResponse.redirect(url)
    }

    break
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*'],
}
