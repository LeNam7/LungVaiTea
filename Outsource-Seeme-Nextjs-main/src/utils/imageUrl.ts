import {DOMAINS} from '@/utils/domain';

/**
 * Kho lưu trữ hình ảnh chính thức đang hoạt động ổn định 200 OK (CDN).
 */
export const OFFICIAL_STORAGE_ORIGIN = 'https://api.seemevitraco.vn';

/**
 * Lấy Storage Origin.
 * Nếu NEXT_PUBLIC_STORAGE_URL được cấu hình và không phải domain api.lungvaitea.vn đang bị 404, dùng giá trị đó.
 * Ngược lại tự động trỏ về OFFICIAL_STORAGE_ORIGIN để đảm bảo 100% ảnh hiển thị đầy đủ, không bao giờ vỡ.
 */
export const getStorageOrigin = () => {
    const custom = DOMAINS.STORAGE?.trim();
    if (custom && !custom.includes('api.lungvaitea.vn')) {
        return custom.replace(/\/$/, '');
    }
    return OFFICIAL_STORAGE_ORIGIN;
};

export const isLocalAssetUrl = (url: string) =>
    url.startsWith('/images/') || url.startsWith('/icons/') || url.startsWith('/favicon');

export const resolveApiImageUrl = (url: string | null | undefined, fallback = '/images/bosuutaptraimg.png') => {
    const value = String(url ?? '').trim();
    if (!value) return fallback;
    if (/^(data:|blob:)/i.test(value)) return value;
    if (isLocalAssetUrl(value)) return value;

    // Nếu đường dẫn vô tình chứa domain api.lungvaitea.vn/uploads (nơi đang 404), tự động chuyển về kho ảnh chính thức:
    if (/^https?:\/\/api\.lungvaitea\.vn\/uploads\//i.test(value)) {
        return value.replace(/^https?:\/\/api\.lungvaitea\.vn/, OFFICIAL_STORAGE_ORIGIN);
    }

    if (/^https?:\/\//i.test(value)) return value;

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
