'use client';

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import viDict from '@/locales/vi.json';
import enDict from '@/locales/en.json';

export type Locale = 'vi' | 'en';

interface LanguageContextType {
    locale: Locale;
    setLocale: (newLocale: Locale) => void;
    t: (keyPath: string, fallback?: string) => string;
    localizeHref: (path: string) => string;
}

const dictionaries = {
    vi: viDict,
    en: enDict,
};

const LanguageContext = createContext<LanguageContextType>({
    locale: 'vi',
    setLocale: () => {},
    t: (key: string, fallback?: string) => fallback || key,
    localizeHref: (path: string) => path,
});

function getNestedValue(obj: Record<string, any>, path: string): string | undefined {
    const keys = path.split('.');
    let current: any = obj;
    for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
            current = current[key];
        } else {
            return undefined;
        }
    }
    return typeof current === 'string' ? current : undefined;
}

export const LanguageProvider: React.FC<{
    children: React.ReactNode;
    initialLocale?: Locale;
}> = ({ children, initialLocale }) => {
    const pathname = usePathname();
    const router = useRouter();
    const [, startTransition] = useTransition();

    const [locale, setLocaleState] = useState<Locale>(() => {
        if (typeof window !== 'undefined') {
            const browserPath = window.location.pathname;
            if (browserPath === '/en' || browserPath.startsWith('/en/')) {
                return 'en';
            }
            const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([a-zA-Z]+)/);
            if (match && (match[1] === 'en' || match[1] === 'vi')) {
                return match[1] as Locale;
            }
        }
        if (initialLocale) return initialLocale;
        return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'vi';
    });

    useEffect(() => {
        const detectLocale = () => {
            const browserPath = typeof window !== 'undefined' ? window.location.pathname : pathname;
            const isEnUrl = browserPath === '/en' || browserPath.startsWith('/en/');
            if (isEnUrl) {
                setLocaleState('en');
                return;
            }
            const match = typeof document !== 'undefined' ? document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([a-zA-Z]+)/) : null;
            if (match && (match[1] === 'en' || match[1] === 'vi')) {
                setLocaleState(match[1] as Locale);
                return;
            }
            setLocaleState('vi');
        };

        detectLocale();

        if (typeof window !== 'undefined') {
            window.addEventListener('popstate', detectLocale);
            return () => window.removeEventListener('popstate', detectLocale);
        }
    }, [pathname]);

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.lang = locale;
            document.title = locale === 'en'
                ? 'Lung Vai Tea - Heritage in every sip'
                : 'Lùng Vài Trà - Di sản trong từng vị trà';
        }
    }, [locale]);

    const setLocale = (newLocale: Locale) => {
        if (typeof document !== 'undefined') {
            document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
        }
        setLocaleState(newLocale);

        const currentPath = typeof window !== 'undefined' ? window.location.pathname : pathname;
        let cleanPath = currentPath;
        if (cleanPath === '/en') {
            cleanPath = '/';
        } else if (cleanPath.startsWith('/en/')) {
            cleanPath = cleanPath.slice(3) || '/';
        }

        const targetUrl = newLocale === 'en'
            ? `/en${cleanPath === '/' ? '' : cleanPath}`
            : (cleanPath || '/');

        startTransition(() => {
            router.push(targetUrl);
            router.refresh();
        });
    };

    const localizeHref = (path: string): string => {
        if (!path || path.startsWith('http') || path.startsWith('mailto:') || path.startsWith('tel:') || path.startsWith('#')) {
            return path;
        }
        if (locale === 'en') {
            if (path === '/') return '/en';
            if (path === '/en' || path.startsWith('/en/')) return path;
            return `/en${path.startsWith('/') ? path : `/${path}`}`;
        }
        // vi
        if (path === '/en') return '/';
        if (path.startsWith('/en/')) return path.slice(3) || '/';
        return path;
    };

    const t = (keyPath: string, fallback?: string): string => {
        const dict = dictionaries[locale] || viDict;
        const val = getNestedValue(dict, keyPath);
        if (val !== undefined) return val;

        // Fallback to Vietnamese dictionary
        const viVal = getNestedValue(viDict, keyPath);
        if (viVal !== undefined) return viVal;

        return fallback || keyPath;
    };

    return (
        <LanguageContext.Provider value={{ locale, setLocale, t, localizeHref }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
