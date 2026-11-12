/**
 * Phân loại hiển thị cho trang "Sản phẩm trà" theo design chốt 10/2026.
 *
 * NGUỒN DỮ LIỆU (từ 1/11/2026, sau tái cấu trúc Nhóm trà → Sản phẩm):
 * - Nhóm trà là tầng phân loại DUY NHẤT, là bản ghi thật trên API
 *   (GET /api/tea-groups/paging), quản lý ở CMS → Nhóm trà. Hằng TEA_GROUPS
 *   dưới đây chỉ còn là fallback khi API chưa deploy / lỗi. Không suy
 *   nhóm từ tên nữa - sản phẩm không có groupId thì chưa phân nhóm.
 * - Sản phẩm mang groupId (slug nhóm) trực tiếp; Danh mục (CategoryTea)
 *   đã bỏ khỏi giao diện và khỏi cách gom dòng.
 * - Mô tả nhóm lấy từ bản ghi nhóm trà trên API (mega menu).
 * - Set quà tặng là các Product có isGiftSet = true trên API, với
 *   packagingName, collectionName, colorOptions từ API.
 * - Tên bao bì và tên biến thể lấy từ Product.packagingName / variantName.
 * - Mô tả vườn lấy từ Garden.description trên API.
 * - Ảnh đại diện dòng trà: ảnh biến thể đầu tiên, cuối cùng là ảnh dự
 *   phòng cây trà.
 * Không còn dữ liệu mẫu cấu hình tạm, không còn lưu tạm trên trình duyệt.
 */

import type {Product} from '@/types/swagger.types';

/** Slug nhóm trà - giá trị tự do từ API (5 nhóm cũ: luc-tra, hong-tra, bach-tra, pho-nhi-song, set-qua-tang). */
export type TeaGroupId = string;

export interface TeaGroup {
    id: TeaGroupId;
    name: string;
    description: string;
}

export const TEA_GROUPS: TeaGroup[] = [
    {
        id: 'luc-tra',
        name: 'Lục trà',
        description:
            'Là phẩm trà quen thuộc của người dân Việt Nam ta, ưa vị đắng, chát và ngọt hậu. Có thể được làm từ búp chè 1 tôm 1 lá, hoặc 1 tôm 2 lá, định dạng theo nhiều hình dáng khác nhau: xoăn, móc câu, hoặc để thẳng như hình dáng ban đầu. Cách chế biến khá cầu kỳ tạo hương tạo vị đặc trưng cho trà xanh.',
    },
    {
        id: 'hong-tra',
        name: 'Hồng trà',
        description:
            'Dòng hồng trà cao cấp được làm từ những búp trà Shan Tuyết cổ thụ lâu năm. Vị trà đậm, hậu ngọt sâu, màu nước ánh hồng đặc trưng.',
    },
    {
        id: 'bach-tra',
        name: 'Bạch Trà',
        description:
            'Dòng bạch trà nhẹ nhàng, thanh khiết, được làm từ những búp trà non tuyển chọn của cây trà Shan Tuyết cổ thụ.',
    },
    {
        id: 'pho-nhi-song',
        name: 'Phổ Nhĩ Sống',
        description:
            'Dòng trà Phổ Nhĩ sống, càng để lâu càng lên hương. Hiện chưa có sản phẩm nào trên hệ thống, sẽ cập nhật khi có hàng.',
    },
    {
        id: 'set-qua-tang',
        name: 'Set quà tặng',
        description:
            'Các bộ sưu tập quà tặng trà, đóng gói theo set với nhiều lựa chọn quy cách và màu sắc.',
    },
];

/** Chuyển bản ghi nhóm trà từ API thành TeaGroup hiển thị (fallback về 5 nhóm cũ khi thiếu tên/mô tả). */
export function mapTeaGroupRecords(
    records: Array<{slug?: string | null; name?: string | null; description?: string | null}>,
): TeaGroup[] {
    return records
        .map((g) => {
            const slug = (g.slug ?? '').trim();
            if (!slug) return null;
            const legacy = TEA_GROUPS.find((t) => t.id === slug);
            return {
                id: slug,
                name: (g.name ?? '').trim() || legacy?.name || slug,
                description: (g.description ?? '').trim() || legacy?.description || '',
            } as TeaGroup;
        })
        .filter((g): g is TeaGroup => g !== null);
}

/** Nhóm của sản phẩm: chỉ lấy đúng groupId thật trên API (set quà luôn thuộc nhóm quà). Không còn suy nhóm từ tên - dữ liệu không có nhóm thì coi như chưa phân nhóm, không tự đoán. */
export function groupIdForProduct(
    product: Product,
    groups: TeaGroup[] = TEA_GROUPS,
): TeaGroupId | null {
    if (product.isGiftSet) return 'set-qua-tang';
    const direct = (product.groupId ?? '').trim();
    if (direct && groups.some((g) => g.id === direct)) return direct;
    return null;
}

/** Khóa gom dòng của 1 sản phẩm (cùng nhóm + cùng tên) - dùng chung cho chi tiết + CMS để khỏi lệch logic gom. */
export function lineKeyForProduct(product: Product, groups: TeaGroup[] = TEA_GROUPS): string {
    const name = normalizeLineName(product.name) || `Sản phẩm #${product.id}`;
    return `${groupIdForProduct(product, groups) ?? 'none'}::${name.toLowerCase()}`;
}

/** Chuẩn hóa tên dòng trà để gom các biến thể cùng tên thành 1 dòng. */
export function normalizeLineName(name?: string | null): string {
    return (name ?? '').trim().replace(/\s+/g, ' ');
}

export interface ProductLine {
    key: string;
    name: string;
    groupId: TeaGroupId | null;
    groupName: string;
    variants: Product[];
    minPrice: number;
    maxPrice: number;
    minGram: number | null;
    maxGram: number | null;
    image: string | null;
    description: string | null;
    createdDate: string | null;
}

/** Gom các biến thể API (cùng nhóm + cùng tên) thành 1 dòng trà. Set quà tặng (isGiftSet) không gom vào đây, chúng hiển thị riêng. */
export function groupProductsIntoLines(
    products: Product[],
    groups: TeaGroup[] = TEA_GROUPS,
): ProductLine[] {
    const byKey = new Map<string, ProductLine>();
    for (const product of products) {
        if (product.isActive === false) continue;
        if (product.isGiftSet) continue;
        const name = normalizeLineName(product.name) || `Sản phẩm #${product.id}`;
        const groupId = groupIdForProduct(product, groups);
        const key = `${groupId ?? 'none'}::${name.toLowerCase()}`;
        const existing = byKey.get(key);
        const price = Number(product.price ?? 0);
        const gram = Number(product.quantity ?? 0);
        if (existing) {
            existing.variants.push(product);
            existing.minPrice = Math.min(existing.minPrice, price);
            existing.maxPrice = Math.max(existing.maxPrice, price);
            if (Number.isFinite(gram) && gram > 0) {
                existing.minGram = existing.minGram === null ? gram : Math.min(existing.minGram, gram);
                existing.maxGram = existing.maxGram === null ? gram : Math.max(existing.maxGram, gram);
            }
            if (!existing.image && product.images) existing.image = product.images;
            if (!existing.description && product.description) existing.description = product.description;
        } else {
            byKey.set(key, {
                key,
                name,
                groupId,
                groupName: groups.find((g) => g.id === groupId)?.name ?? 'Sản phẩm trà',
                variants: [product],
                minPrice: price,
                maxPrice: price,
                minGram: Number.isFinite(gram) && gram > 0 ? gram : null,
                maxGram: Number.isFinite(gram) && gram > 0 ? gram : null,
                image: product.images ?? null,
                description: product.description ?? null,
                createdDate: product.createdDate ?? null,
            });
        }
    }
    return Array.from(byKey.values()).map((line) => ({
        ...line,
        variants: [...line.variants].sort((a, b) => (Number(a.price ?? 0) || 0) - (Number(b.price ?? 0) || 0)),
    }));
}

/** Các mức giá lọc (Hải chốt 29/10/2026, chọn 1 mức trong dropdown). Khoảng [min, max): mức dưới bao gồm, mức trên không bao gồm. */
export interface PriceRange {
    id: string;
    label: string;
    min: number | null;
    max: number | null;
}

export const PRICE_RANGES: PriceRange[] = [
    {id: '0-999', label: '0 - 999.000đ', min: 0, max: 1000000},
    {id: '1000-2500', label: '1.000.000đ - 2.500.000đ', min: 1000000, max: 2500000},
    {id: '2500-4000', label: '2.500.000đ - 4.000.000đ', min: 2500000, max: 4000000},
    {id: '4000-plus', label: '>4.000.000đ', min: 4000000, max: null},
];

export function priceInRanges(price: number, ranges: PriceRange[]): boolean {
    if (ranges.length === 0) return true;
    return ranges.some((range) => {
        if (range.min !== null && price < range.min) return false;
        if (range.max !== null && price >= range.max) return false;
        return true;
    });
}

/** Chuẩn hóa tiếng Việt không dấu để search khớp cả khi gõ không dấu. */
export function normalizeSearchText(value?: string | null): string {
    return (value ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function lineMatchesSearch(line: ProductLine, query: string): boolean {
    const q = normalizeSearchText(query);
    if (!q) return true;
    const haystack = normalizeSearchText(`${line.name} ${line.groupName} ${line.description ?? ''}`);
    return q.split(' ').every((word) => haystack.includes(word));
}

// ─── Set quà tặng (dữ liệu thật từ API, xem giftsFromApiProducts) ───────────

export interface GiftColor {
    name: string;
    hex: string;
    /** Ảnh chụp set màu này (admin upload). Có ảnh thì chi tiết hiện thumbnail thay chấm màu. */
    image?: string | null;
}

/** 1 quy cách đóng gói của set quà = 1 Product row trên API (cùng bộ sưu tập + tên set). */
export interface GiftPackaging {
    /** Id thật của row quy cách trên API - cũng là id giỏ hàng của quy cách này. */
    apiId: number;
    /** Tên quy cách, ví dụ set mix các dòng trà. */
    packaging: string;
    price: number;
    gram: number;
    /** Tồn kho của row quy cách (Product.total); <= 0 là hết hàng, không cho thanh toán. */
    total: number | null;
    image: string | null;
    colors: GiftColor[];
    description: string;
}

export interface GiftProduct {
    slug: string;
    name: string;
    collectionId: string;
    priceMin: number;
    priceMax: number;
    gram: number;
    /** Khoảng khối lượng (gram) của các quy cách, tính như dòng trà: chỉ tính gram > 0. */
    minGram: number | null;
    maxGram: number | null;
    /** Quy cách đóng gói theo design, ví dụ set mix các dòng trà. */
    packaging: string;
    colors: GiftColor[];
    description: string;
    image: string | null;
    /** Id thật trên API (khi set quà lấy từ API). */
    apiId?: number;
    userManual?: string | null;
    storageInstructions?: string | null;
    /** Các quy cách đóng gói của set (mỗi quy cách là 1 row API). Mặc định chọn quy cách rẻ nhất. */
    packagings: GiftPackaging[];
}

export interface GiftCollection {
    id: string;
    name: string;
    shortName: string;
    description: string;
}

export const GIFT_COLLECTIONS: GiftCollection[] = [
    {
        id: 'huyen',
        name: 'Bộ sưu tập Huyền',
        shortName: 'Huyền',
        description: 'Bộ sưu tập quà tặng Huyền - các set trà tuyển chọn, đóng gói sang trọng làm quà biếu.',
    },
    {
        id: 'an',
        name: 'Bộ sưu tập An',
        shortName: 'An',
        description: 'Bộ sưu tập quà tặng An - đang cập nhật sản phẩm.',
    },
    {
        id: 'loc',
        name: 'Bộ sưu tập Lộc',
        shortName: 'Lộc',
        description: 'Bộ sưu tập quà tặng Lộc - đang cập nhật sản phẩm.',
    },
    {
        id: 'tinh',
        name: 'Bộ sưu tập Tĩnh',
        shortName: 'Tĩnh',
        description: 'Bộ sưu tập quà tặng Tĩnh - các set trà tuyển chọn theo file khách gửi 29/10/2026.',
    },
];

/** ID giỏ hàng dành riêng cho set quà mẫu (không trùng id API, sẽ thay bằng id thật khi có API). */
export const GIFT_CART_ID_BASE = 900001;

export function giftCartId(gift: GiftProduct, index: number): number {
    if (gift.apiId) return gift.apiId;
    return GIFT_CART_ID_BASE + index;
}

/** Chuyển tên bộ sưu tập từ API ("Huyền", "An", "Lộc", "Tĩnh") thành id bộ sưu tập của FE. */
export function collectionIdForName(collectionName?: string | null): string {
    const raw = (collectionName ?? '').trim().toLowerCase();
    if (raw === 'huyền' || raw === 'huyen') return 'huyen';
    if (raw === 'an') return 'an';
    if (raw === 'lộc' || raw === 'loc') return 'loc';
    return normalizeSearchText(raw).replace(/\s+/g, '-') || 'huyen';
}

/** Phân tích chuỗi màu API thành danh sách màu.
 *  Định dạng: "Tên:#HEX|ảnh;Tên:#HEX" - phần ảnh (sau dấu |) là tùy chọn,
 *  là đường dẫn ảnh admin upload cho màu đó. Dạng cũ "Tên:#HEX" vẫn đọc được.
 *  Định dạng mới (từ 1/11/2026, CMS chỉ cho upload ảnh, không nhập tên/mã màu):
 *  mỗi phần chỉ là 1 đường dẫn ảnh ("ảnh1;ảnh2") - màu đó không có tên, khách
 *  chọn bằng ảnh, giỏ phân biệt bằng chính đường dẫn ảnh. */
export function parseColorOptions(raw?: string | null): GiftColor[] {
    if (!raw) return [];
    return raw
        .split(';')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
            if (!part.includes('|') && (part.startsWith('/') || part.startsWith('http') || /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(part))) {
                return {name: '', hex: '', image: part};
            }
            const [left, image] = part.split('|').map((s) => s.trim());
            const [name, hex] = left.split(':').map((s) => s.trim());
            return {name: name || part, hex: hex || '#DED1B9', image: image || null};
        });
}

/** Ghép danh sách màu thành chuỗi lưu API (định dạng parseColorOptions đọc được). */
export function stringifyColorOptions(colors: GiftColor[]): string {
    return colors
        .map((c) => {
            const base = c.hex ? `${c.name}:${c.hex}` : c.name;
            return c.image ? `${base}|${c.image}` : base;
        })
        .join(';');
}

/** Tạo slug hiển thị cho set quà API, dùng để đối chiếu link cũ dạng gift-... */
export function giftSlugForName(name?: string | null): string {
    const slug = normalizeSearchText(name ?? '').replace(/\s+/g, '-');
    return slug ? `gift-${slug}` : 'gift';
}

/** Chuyển 1 Product có isGiftSet = true trên API thành 1 quy cách của set quà. */
export function giftPackagingFromApiProduct(product: Product): GiftPackaging {
    return {
        apiId: product.id ?? 0,
        packaging: product.packagingName?.trim() || 'Set mix Lục Trà Shan 1 Tôm 1 Lá, Lục Trà Shan 1 Tôm 2 Lá, Hồng Trà Shan',
        price: Number(product.price ?? 0),
        gram: Number(product.quantity ?? 0),
        total: product.total ?? null,
        image: product.images ?? null,
        colors: parseColorOptions(product.colorOptions),
        description: product.description ?? '',
    };
}

/** Chuyển 1 Product có isGiftSet = true trên API thành GiftProduct để hiển thị. */
export function giftFromApiProduct(product: Product): GiftProduct {
    const packaging = giftPackagingFromApiProduct(product);
    return {
        slug: giftSlugForName(product.name),
        name: product.name ?? `Set quà #${product.id}`,
        collectionId: collectionIdForName(product.collectionName),
        priceMin: packaging.price,
        priceMax: packaging.price,
        gram: packaging.gram,
        minGram: Number.isFinite(packaging.gram) && packaging.gram > 0 ? packaging.gram : null,
        maxGram: Number.isFinite(packaging.gram) && packaging.gram > 0 ? packaging.gram : null,
        packaging: packaging.packaging,
        colors: packaging.colors,
        description: packaging.description,
        image: packaging.image,
        apiId: product.id,
        userManual: product.userManual ?? null,
        storageInstructions: product.storageInstructions ?? null,
        packagings: [packaging],
    };
}

/** Gom các row set quà (cùng bộ sưu tập + cùng tên) thành 1 set với nhiều quy cách.
 *  Mỗi row là 1 quy cách đóng gói (tên quy cách + giá riêng). Set chỉ có 1 row
 *  thì packagings có đúng 1 phần tử, hiển thị không khác gì trước. */
export function groupGiftProducts(products: Product[]): GiftProduct[] {
    const byKey = new Map<string, GiftProduct>();
    for (const product of products) {
        if (!product.isGiftSet) continue;
        if (product.isActive === false) continue;
        const name = normalizeLineName(product.name) || `Set quà #${product.id}`;
        const collectionId = collectionIdForName(product.collectionName);
        const key = `${collectionId}::${name.toLowerCase()}`;
        const packaging = giftPackagingFromApiProduct(product);
        const existing = byKey.get(key);
        if (existing) {
            existing.packagings.push(packaging);
            existing.packagings.sort((a, b) => a.price - b.price);
            existing.priceMin = Math.min(existing.priceMin, packaging.price);
            existing.priceMax = Math.max(existing.priceMax, packaging.price);
            if (Number.isFinite(packaging.gram) && packaging.gram > 0) {
                existing.minGram = existing.minGram === null ? packaging.gram : Math.min(existing.minGram, packaging.gram);
                existing.maxGram = existing.maxGram === null ? packaging.gram : Math.max(existing.maxGram, packaging.gram);
            }
            const cheapest = existing.packagings[0];
            existing.gram = cheapest.gram;
            existing.packaging = cheapest.packaging;
            existing.colors = cheapest.colors;
            existing.image = cheapest.image ?? existing.image;
            existing.apiId = cheapest.apiId;
            if (!existing.description && packaging.description) existing.description = packaging.description;
        } else {
            byKey.set(key, {
                slug: giftSlugForName(product.name),
                name,
                collectionId,
                priceMin: packaging.price,
                priceMax: packaging.price,
                gram: packaging.gram,
                minGram: Number.isFinite(packaging.gram) && packaging.gram > 0 ? packaging.gram : null,
                maxGram: Number.isFinite(packaging.gram) && packaging.gram > 0 ? packaging.gram : null,
                packaging: packaging.packaging,
                colors: packaging.colors,
                description: packaging.description,
                image: packaging.image,
                apiId: product.id,
                userManual: product.userManual ?? null,
                storageInstructions: product.storageInstructions ?? null,
                packagings: [packaging],
            });
        }
    }
    return Array.from(byKey.values());
}

/** Lấy toàn bộ set quà tặng từ danh sách sản phẩm API (đã gom theo set). */
export function giftsFromApiProducts(products: Product[]): GiftProduct[] {
    return groupGiftProducts(products);
}

export function giftBySlug(slug: string, gifts: GiftProduct[]): GiftProduct | null {
    return gifts.find((g) => g.slug === slug) ?? null;
}
