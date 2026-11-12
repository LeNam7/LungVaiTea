import { BASE_DOMAINS } from "./domain";

const getConfiguredCookieDomains = () => {
  const domains = [BASE_DOMAINS.path, process.env.NEXT_PUBLIC_COOKIE_DOMAINS]
    .filter(Boolean)
    .flatMap((value) => String(value).split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  return Array.from(new Set(domains));
};

const getCookieDomain = () => {
  if (typeof window === 'undefined') return '';

  const hostname = window.location.hostname;
  const matchedDomain = getConfiguredCookieDomains().find((domain) => {
    const normalizedDomain = domain.replace(/^\./, '');
    return hostname === normalizedDomain || hostname.endsWith(`.${normalizedDomain}`);
  });

  return matchedDomain || '';
};

const buildCookie = (cname: string, cvalue: string, domain?: string) => {
  const domainPart = domain ? `;domain=${domain}` : '';
  return `${cname}=${cvalue};path=/${domainPart}`;
};

export const setCookie = (cname: string, cvalue: string, expiresAt?: any) => {
  if (typeof window === 'undefined') return;

  const base = buildCookie(cname, cvalue, getCookieDomain());
  if (expiresAt) {
    document.cookie = base + `;expires=${expiresAt.toDate().toUTCString()}`;
  } else {
    document.cookie = base;
  }
};

export const getCookie = (name: string): string | null => {
  if (typeof window === 'undefined') return null;

  const nameEQ = name + "=";
  const listCookie = document.cookie.split(";");
  for (let i = 0; i < listCookie.length; i++) {
    let c = listCookie[i];
    while (c.charAt(0) === " ") {
      c = c.substring(1, c.length);
    }
    if (c.indexOf(nameEQ) === 0) {
      return c.substring(nameEQ.length, c.length);
    }
  }
  return null;
};

export const deleteCookie = (cname: string) => {
  if (typeof window === 'undefined') return;

  const expires = ';expires=Thu, 01 Jan 1970 00:00:00 UTC';

  document.cookie = buildCookie(cname, '') + expires;
  getConfiguredCookieDomains().forEach((domain) => {
    document.cookie = buildCookie(cname, '', domain) + expires;
  });
};
