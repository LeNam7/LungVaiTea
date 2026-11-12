import {getFirstApiImageUrl} from '@/utils/imageUrl';
import {TrackingType} from '@/types/swagger.types';

export type TrackingCatalogItem = {
    id: number;
    type: TrackingType;
    trackingId: number;
    trackingCreatedDate?: string | null;
    name?: string | null;
    images?: string | null;
    price?: number | null;
    sold?: boolean | null;
};

export const TRACKING_TYPE_OPTIONS = [
    {label: 'Cây trà', value: TrackingType.Tea},
    {label: 'Sản phẩm trà', value: TrackingType.Product},
] as const;

export const getArrayData = (res: any) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    return [];
};

export const getTrackingTypeLabel = (type: TrackingType) =>
    type === TrackingType.Tea ? 'cây trà' : 'sản phẩm trà';

export const getTrackingHref = (type: TrackingType, id: number) =>
    type === TrackingType.Tea ? `/chi-tiet-cay-tra/${id}` : `/san-pham-tra/${id}`;

export const getTrackingFallbackImage = (type: TrackingType) =>
    type === TrackingType.Tea ? '/images/bosuutaptraimg.png' : '/images/shan-tuyet-tea-tree.jpg';

export const getImageUrl = (images?: string | null, type: TrackingType = TrackingType.Product) => {
    return getFirstApiImageUrl(images, getTrackingFallbackImage(type));
};

export const fmtVnd = (n?: number | null) =>
    typeof n === 'number' ? `${n.toLocaleString('vi-VN')} VND` : '';

const getTrackingId = (tracking: any) =>
    Number(tracking?.trackingId ?? tracking?.id ?? tracking?.tracking?.id ?? 0);

const normalizeTrackingRecord = (tracking: any, type: TrackingType): TrackingCatalogItem | null => {
    const nested = type === TrackingType.Tea
        ? tracking?.tea ?? tracking?.item
        : tracking?.product ?? tracking?.item;
    const id = Number(tracking?.itemId ?? nested?.id ?? tracking?.id);
    if (!id) return null;

    return {
        ...(nested ?? {}),
        id,
        type,
        trackingId: getTrackingId(tracking),
        trackingCreatedDate: tracking?.createdDate ?? nested?.trackingCreatedDate ?? null,
        name: nested?.name ?? tracking?.itemName ?? null,
        images: nested?.images ?? tracking?.image ?? null,
        price: typeof nested?.price === 'number' ? nested.price : null,
        sold: typeof nested?.sold === 'boolean' ? nested.sold : null,
    };
};

export const enrichTrackingItems = (trackings: any[], type: TrackingType) => {
    const normalized = trackings
        .map((tracking) => normalizeTrackingRecord(tracking, type))
        .filter(Boolean) as TrackingCatalogItem[];

    const byItem = new Map<string, TrackingCatalogItem>();
    normalized.forEach((item) => {
        const key = `${item.type}:${item.id}`;
        const current = byItem.get(key);
        const itemTime = Date.parse(item.trackingCreatedDate ?? '') || 0;
        const currentTime = Date.parse(current?.trackingCreatedDate ?? '') || 0;
        if (!current || itemTime >= currentTime) {
            byItem.set(key, item);
        }
    });

    return Array.from(byItem.values()).sort((a, b) => {
        const aTime = Date.parse(a.trackingCreatedDate ?? '') || 0;
        const bTime = Date.parse(b.trackingCreatedDate ?? '') || 0;
        return bTime - aTime;
    });
};
