import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip internal Next.js assets, API endpoints, CMS admin, and static files
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/cms') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
    const isEnPath = pathname === '/en' || pathname.startsWith('/en/');

    // 1. If user explicitly accesses /en path -> definitely English
    if (isEnPath) {
        const internalPath = pathname.replace(/^\/en(\/|$)/, '$1') || '/';
        const url = request.nextUrl.clone();
        url.pathname = internalPath;

        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-next-locale', 'en');

        const response = NextResponse.rewrite(url, {
            request: {
                headers: requestHeaders,
            },
        });
        if (cookieLocale !== 'en') {
            response.cookies.set('NEXT_LOCALE', 'en', {
                path: '/',
                maxAge: 60 * 60 * 24 * 365,
                sameSite: 'lax',
            });
        }
        return response;
    }

    // 2. Non-en path: Check cookie first, then auto-detect via Accept-Language
    let targetLocale = cookieLocale;
    if (!targetLocale) {
        const acceptLang = request.headers.get('accept-language') || '';
        // If Vietnamese is found in browser header -> 'vi', else -> 'en'
        targetLocale = /vi([-_][a-zA-Z]+)?/i.test(acceptLang) ? 'vi' : 'en';
    }

    // 3. If target is 'en' (foreign browser first visit or previously chosen 'en'), redirect to /en
    if (targetLocale === 'en') {
        const url = request.nextUrl.clone();
        url.pathname = `/en${pathname === '/' ? '' : pathname}`;
        const response = NextResponse.redirect(url);
        if (cookieLocale !== 'en') {
            response.cookies.set('NEXT_LOCALE', 'en', {
                path: '/',
                maxAge: 60 * 60 * 24 * 365,
                sameSite: 'lax',
            });
        }
        return response;
    }

    // 4. Default: Vietnamese (targetLocale === 'vi')
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-next-locale', 'vi');
    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
    if (!cookieLocale) {
        response.cookies.set('NEXT_LOCALE', 'vi', {
            path: '/',
            maxAge: 60 * 60 * 24 * 365,
            sameSite: 'lax',
        });
    }
    return response;
}

export const config = {
    matcher: ['/((?!_next|api|cms|[\\w-]+\\.\\w+).*)'],
};
