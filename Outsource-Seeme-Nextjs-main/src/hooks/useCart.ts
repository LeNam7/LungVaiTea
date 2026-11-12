import {TEA_SPRING_PRODUCT} from '@/utils/teaFields';
import {useCallback, useSyncExternalStore} from 'react';

const KEY = 'seeme_cart';

export type CartProduct = {
    id: number;
    name: string;
    price: number;
    quantity: number;
    unit: string;
    images?: string | null;
    /** Phân biệt biến thể cùng id (ví dụ màu set quà): gộp giỏ chỉ khi cùng id + cùng variant. */
    variant?: string | null;
    /** Tên quy cách đóng gói của set quà (để đơn hàng ghi rõ khách mua phân loại nào). */
    packagingName?: string | null;
    /** Ghi chú tên màu của set quà do admin nhập (vd Vàng): đơn hàng hiện tên màu kèm ảnh để dễ đóng hàng. */
    colorName?: string | null;
};

export type CartTeaSeason = {
    label: string;
    variant: string;
    quantity: number;
};

export type CartTea = {
    id: number;
    name: string;
    code: string;
    price: number;
    images?: string | null;
    volume?: number;
    type?: string | null;
    seasons: CartTeaSeason[];
    plantingYears: number;
};

export type Cart = {products: CartProduct[]; teas: CartTea[]};

const empty: Cart = {products: [], teas: []};
let cachedCartRaw: string | null = null;
let cachedCart: Cart = empty;

function normalizeTea(tea: CartTea): CartTea {
    return {...tea, seasons: [{label: 'Vụ Xuân', variant: TEA_SPRING_PRODUCT, quantity: tea.volume ?? 0}]};
}

function parseCart(raw: string | null): Cart {
    if (!raw) return empty;
    try {
        const parsed = {...empty, ...JSON.parse(raw)} as Cart;
        // Di chuyển giỏ cũ sang id API thật (một lần, khi đọc giỏ lên):
        // - Trước khi ghép API, set quà dùng id giỏ tạm 900001+ theo thứ tự
        //   bộ Huyền cũ (Nhất, Tàng, Uyên, Cảnh, vi, Mặc, Tịch, Mộc);
        //   sau khi ghép API, cùng thứ tự đó là id 1057-1064.
        //   Không đổi id thì dòng cũ 900001 không bao giờ gộp được với dòng
        //   mới 1057 dù cùng tên cùng màu, cứ thêm là tạo dòng trùng.
        // - Giỏ cũ cũng không có trường variant, nhưng tên dòng đã ghi màu
        //   dạng "(Màu Xanh lá)" - suy variant từ tên để lần thêm cùng màu
        //   sau này cộng dồn đúng dòng thay vì tạo dòng trùng.
        const LEGACY_GIFT_IDS: Record<number, number> = {
            900001: 1057,
            900002: 1058,
            900003: 1059,
            900004: 1060,
            900005: 1061,
            900006: 1062,
            900007: 1063,
            900008: 1064,
        };
        const products = (parsed.products ?? []).map((p) => {
            const migratedId = LEGACY_GIFT_IDS[p.id] ?? p.id;
            if (p.variant) return migratedId === p.id ? p : {...p, id: migratedId};
            const match = /\(Màu (.+)\)\s*$/.exec(p.name ?? '');
            return match ? {...p, id: migratedId, variant: match[1]} : {...p, id: migratedId};
        });
        return {...parsed, products, teas: parsed.teas.map(normalizeTea)};
    } catch {
        return empty;
    }
}

function getCartSnapshot(): Cart {
    if (typeof window === 'undefined') return empty;
    const raw = window.localStorage.getItem(KEY);
    if (cachedCartRaw !== raw) {
        cachedCartRaw = raw;
        cachedCart = parseCart(raw);
    }
    return cachedCart;
}

function save(c: Cart) {
    localStorage.setItem(KEY, JSON.stringify(c));
    cachedCartRaw = null;
    /*
     * Defer the local event so every subscriber reads the same persisted snapshot
     * after the calling handler finishes.
     */
    setTimeout(() => window.dispatchEvent(new Event('cart-updated')), 0);
}

function subscribeToCart(listener: () => void) {
    window.addEventListener('storage', listener);
    window.addEventListener('cart-updated', listener);

    return () => {
        window.removeEventListener('storage', listener);
        window.removeEventListener('cart-updated', listener);
    };
}

export function useCart() {
    const cart = useSyncExternalStore(subscribeToCart, getCartSnapshot, () => empty);

    const update = useCallback((fn: (c: Cart) => Cart) => {
        save(fn(getCartSnapshot()));
    }, []);

    const addProduct = useCallback(
        (p: Omit<CartProduct, 'quantity'> & {quantity?: number}) => {
            update((prev) => {
                const ex = prev.products.find((x) => x.id === p.id && (x.variant ?? null) === (p.variant ?? null));
                if (ex)
                    return {
                        ...prev,
                        products: prev.products.map((x) =>
                            x.id === p.id && (x.variant ?? null) === (p.variant ?? null)
                                ? {...x, quantity: x.quantity + (p.quantity ?? 1)}
                                : x,
                        ),
                    };
                return {...prev, products: [...prev.products, {...p, quantity: p.quantity ?? 1}]};
            });
        },
        [update],
    );

    const addTea = useCallback(
        (t: CartTea) => {
            update((prev) => {
                if (prev.teas.find((x) => x.id === t.id)) return {...prev, teas: prev.teas.map(x => x.id === t.id ? normalizeTea(t) : x)};
                return {...prev, teas: [...prev.teas, normalizeTea(t)]};
            });
        },
        [update],
    );

    const removeProduct = useCallback(
        (id: number, variant?: string | null) =>
            update((p) => ({
                ...p,
                products: p.products.filter(
                    (x) => !(x.id === id && (variant === undefined || (x.variant ?? null) === (variant ?? null))),
                ),
            })),
        [update],
    );

    const removeTea = useCallback(
        (id: number) => update((p) => ({...p, teas: p.teas.filter((x) => x.id !== id)})),
        [update],
    );

    const updateProductQty = useCallback(
        (id: number, qty: number, variant?: string | null) => {
            update((p) => ({
                ...p,
                products: p.products.map((x) =>
                    x.id === id && (variant === undefined || (x.variant ?? null) === (variant ?? null))
                        ? {...x, quantity: Math.max(1, qty)}
                        : x,
                ),
            }));
        },
        [update],
    );

    const clearCart = useCallback(() => {
        update(() => empty);
    }, [update]);

    const totalCount = cart.products.reduce((s, p) => s + p.quantity, 0) + cart.teas.length;

    return {cart, totalCount, addProduct, addTea, removeProduct, removeTea, updateProductQty, clearCart};
}
