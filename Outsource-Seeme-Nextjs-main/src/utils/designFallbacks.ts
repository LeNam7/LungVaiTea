export const PRODUCT_FILTER_LABELS = ['Tất cả', 'Trà phổ nhĩ', 'Trà san tuyết cổ thụ', 'Lục trà', 'Hồng Trà'];

export const formatVndDesign = (value?: number | null) => `${(value ?? 0).toLocaleString('vi-VN')} VND`;

export function withTimeout<T>(promise: Promise<T>, ms = 3500): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => {
            setTimeout(() => reject(new Error('Request timed out')), ms);
        }),
    ]);
}
