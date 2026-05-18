import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(toSet: CookieToSet[]) {
          toSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        }
      }
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = req.nextUrl.pathname;

  const protectedPaths = ['/onboarding', '/checkout', '/dashboard'];
  const isProtected = protectedPaths.some(p => path.startsWith(p));

  if (isProtected && !user) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }

  if (user && isProtected) {
    const { data: profile } = await supabase
      .from('users')
      .select('subscription_status, onboarding_complete')
      .eq('id', user.id)
      .maybeSingle();

    const active = profile?.subscription_status === 'active';
    const done   = profile?.onboarding_complete === true;

    if (path.startsWith('/dashboard') && !active) {
      const url = req.nextUrl.clone();
      url.pathname = done ? '/checkout' : '/onboarding';
      return NextResponse.redirect(url);
    }
    if (path.startsWith('/checkout') && !done) {
      const url = req.nextUrl.clone();
      url.pathname = '/onboarding';
      return NextResponse.redirect(url);
    }
    if (path.startsWith('/onboarding') && done && active) {
      const url = req.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: ['/onboarding/:path*', '/checkout/:path*', '/dashboard/:path*']
};
