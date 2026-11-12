import {DOMAINS} from '@/utils/domain';

const FALLBACK_STORAGE_ORIGIN = 'https://api.lungvaitea.vn';

export const getStorageOrigin = () =>
    (DOMAINS.STORAGE || DOMAINS.API || FALLBACK_STORAGE_ORIGIN).replace(/\/$/, '');

export const isLocalAssetUrl = (url: string) => url.startsWith('/images/') || url.startsWith('/icons/') || url.startsWith('/favicon');

export const resolveApiImageUrl = (url: string | null | undefined, fallback = '/images/bosuutaptraimg.png') => {
    const value = String(url ?? '').trim();
    if (!value) return fallback;
    if (/^(data:|blob:)/i.test(value)) return value;
    if (/^https?:\/\//i.test(value)) return value;
    if (isLocalAssetUrl(value)) return value;

    const path = value.replace(/^\/+/, '');
    return `${getStorageOrigin()}/${path}`;
};

export const parseApiImageList = (images: string | string[] | null | undefined): string[] => {
    if (!images) return [];
    if (Array.isArray(images)) return images.map(String).map((item) => item.trim()).filter(Boolean);

    const value = images.trim();
    if (!value) return [];

    try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.map(String).map((item) => item.trim()).filter(Boolean);
    } catch {
        /* comma-separated fallback */
    }

    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
};

export const getFirstApiImageUrl = (images: string | string[] | null | undefined, fallback = '/images/bosuutaptraimg.png') => {
    const first = parseApiImageList(images)[0];
    return resolveApiImageUrl(first, fallback);
};
