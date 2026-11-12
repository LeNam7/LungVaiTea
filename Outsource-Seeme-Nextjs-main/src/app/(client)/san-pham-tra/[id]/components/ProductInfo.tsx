'use client';

import React, {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {toast} from '@/utils/toast';
import {HeartOutline, CartIcon, ChevronDown, fmt} from './icons';
import {parseApiImageList, resolveApiImageUrl} from '@/utils/imageUrl';
import {useCart} from '@/hooks/useCart';
import {toTitleCaseVn} from '@/utils/text';
import DescriptionContent from './DescriptionContent';
import {
    createTrackingAPI,
    deleteTrackingAPI,
    getTrackingByItemAPI,
    invalidateTrackingCache,
} from '@/api/UserPreferenceAPI';
import {TrackingAction, TrackingType} from '@/types/swagger.types';
import {useAppSelector} from '@/store/hooks';
import {useLanguage} from '@/context/LanguageContext';

export type AccordionItem = {
    title: string;
    content: string;
};

export type ProductVariantOption = {
    id: number;
    price: number;
    gram: number | null;
    /** Tồn kho của biến thể (Product.total); <= 0 là hết hàng, không cho thanh toán. */
    stock?: number | null;
    images?: string | null;
    packagingName?: string | null;
    variantName?: string | null;
};

type Props = {
    id: number;
    name: string;
    price: number;
    unit: string;
    weight?: string | number;
    images?: string | null;
    accordionItems: AccordionItem[];
    /** Các biến thể cùng dòng trà (cùng tên + cùng danh mục), để chọn quy cách. */
    variants?: ProductVariantOption[];
    /** Chế độ điều khiển từ ngoài (trang chi tiết gắn phân loại với ảnh):
     * khi có prop này, việc chọn phân loại do component cha giữ và ảnh
     * chính nhảy theo; không có thì dùng state nội bộ như trước.
     * Giá trị null nghĩa là chưa chọn phân loại nào (dòng nhiều phân loại
     * mở lên không chọn sẵn, giá hiện khoảng min–max). */
    selectedVariantId?: number | null;
    onVariantChange?: (variantId: number) => void;
};

export default function ProductInfo({id, name, price, unit, weight, images, accordionItems, variants, selectedVariantId: controlledVariantId, onVariantChange}: Props) {
    const {t} = useLanguage();
    const [qty, setQty] = useState(1);
    const [openIdx, setOpenIdx] = useState<number | null>(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteTrackingId, setFavoriteTrackingId] = useState<number | null>(null);
    const [favoriteStatusLoading, setFavoriteStatusLoading] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const router = useRouter();
    const {addProduct} = useCart();
    const user = useAppSelector((s) => s.auth.user as any);
    const userId = Number(user?.id);

    // ── Chọn quy cách đóng gói (design 10/2026) ──
    // Mỗi biến thể API là 1 quy cách (khối lượng gram + giá). Tên bao bì và
    // tên biến thể lấy từ API (packagingName / variantName).
    const [internalVariantId, setInternalVariantId] = useState<number | null>(() =>
        variants && variants.length > 1 ? null : id,
    );
    // null có nghĩa là chưa chọn (khác undefined = không điều khiển từ ngoài).
    const selectedVariantId = controlledVariantId !== undefined ? controlledVariantId : internalVariantId;
    const selectVariant = (variantId: number) => {
        if (onVariantChange) onVariantChange(variantId);
        else setInternalVariantId(variantId);
    };

    const selectedVariant = variants?.find((v) => v.id === selectedVariantId);
    // Tồn kho CMS hiển thị null thành 0 nên null cũng tính là hết hàng.
    const selectedOutOfStock = selectedVariant ? (selectedVariant.stock ?? 0) <= 0 : false;
    const effectivePrice = selectedVariant ? selectedVariant.price : price;
    const effectiveGram = selectedVariant ? selectedVariant.gram : typeof weight === 'number' ? weight : null;
    // Dòng nhiều phân loại mà chưa chọn phân loại nào: bắt chọn trước khi
    // thêm vào giỏ, giá hiển thị khoảng từ thấp nhất đến cao nhất.
    const needsVariantChoice = !!variants && variants.length > 1 && !selectedVariant;
    const variantPrices = variants?.map((v) => v.price ?? 0) ?? [];
    const priceRangeText =
        needsVariantChoice && variantPrices.length > 0
            ? (() => {
                  const min = Math.min(...variantPrices);
                  const max = Math.max(...variantPrices);
                  return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
              })()
            : null;
    const packagingName = (variantId: number) => {
        const variant = variants?.find((v) => v.id === variantId);
        const apiPackaging = variant?.packagingName?.trim();
        return apiPackaging || 'Hộp';
    };
    const variantLabel = (variant: ProductVariantOption) => {
        const base = packagingName(variant.id);
        const name = variant.variantName?.trim();
        return name ? `${base} - ${name}` : base;
    };
    const cartName = effectiveGram ? `${name} (${effectiveGram}g)` : name;

    const decQty = () => setQty((q) => Math.max(1, q - 1));
    const incQty = () => setQty((q) => q + 1);

    const requireVariantChoice = () => {
        if (!needsVariantChoice) return false;
        toast.error('Vui lòng chọn phân loại trước khi thêm vào giỏ');
        document.getElementById('variant-selector')?.scrollIntoView({behavior: 'smooth', block: 'center'});
        return true;
    };

    const handleAddToCart = () => {
        if (requireVariantChoice()) return;
        if (selectedOutOfStock) {
            toast.error('Phân loại này đã hết hàng');
            return;
        }
        addProduct({id: selectedVariantId ?? id, name: cartName, price: effectivePrice, quantity: qty, unit, images: selectedVariant?.images ?? images});
        toast.success('Đã thêm vào giỏ hàng');
    };

    const handleBuyNow = () => {
        if (requireVariantChoice()) return;
        if (selectedOutOfStock) {
            toast.error('Phân loại này đã hết hàng');
            return;
        }
        addProduct({id: selectedVariantId ?? id, name: cartName, price: effectivePrice, quantity: qty, unit, images: selectedVariant?.images ?? images});
        router.push('/gio-hang');
    };

    const requestLogin = () => {
        window.dispatchEvent(new CustomEvent('open-auth-modal'));
    };

    const readTrackingId = (response: any) =>
        Number(response?.data?.id ?? response?.id ?? response?.trackingId ?? 0);

    const handleFavorite = async () => {
        if (!userId) {
            requestLogin();
            return;
        }
        setFavoriteLoading(true);
        try {
            if (isFavorite) {
                if (!favoriteTrackingId) {
                    toast.error('Không tìm thấy mã yêu thích để xoá');
                    return;
                }
                await deleteTrackingAPI(favoriteTrackingId);
                invalidateTrackingCache();
                setIsFavorite(false);
                setFavoriteTrackingId(null);
                toast.success('Đã bỏ khỏi yêu thích');
                return;
            }

            const created = await createTrackingAPI({
                type: TrackingType.Product,
                action: TrackingAction.Like,
                itemId: selectedVariantId ?? id,
                itemName: name,
            });
            invalidateTrackingCache();
            setIsFavorite(true);
            setFavoriteTrackingId(readTrackingId(created) || null);
            toast.success('Đã thêm vào yêu thích');
        } catch {
            toast.error('Không thể cập nhật yêu thích');
        } finally {
            setFavoriteLoading(false);
        }
    };

    useEffect(() => {
        let ignore = false;
        if (!userId) {
            return;
        }

        Promise.resolve()
            .then(() => {
                if (!ignore) setFavoriteStatusLoading(true);
                return getTrackingByItemAPI({type: TrackingType.Product, action: TrackingAction.Like, itemId: selectedVariantId ?? id});
            })
            .then((tracking) => {
                if (!ignore) {
                    setIsFavorite(Boolean(tracking));
                    setFavoriteTrackingId(readTrackingId(tracking) || null);
                }
            })
            .catch(() => {
                if (!ignore) {
                    setIsFavorite(false);
                    setFavoriteTrackingId(null);
                }
            })
            .finally(() => {
                if (!ignore) setFavoriteStatusLoading(false);
            });

        return () => {
            ignore = true;
        };
    }, [selectedVariantId, userId, id]);

    const favoriteActive = Boolean(userId && isFavorite);

    useEffect(() => {
        if (!userId) return;
        const timer = window.setTimeout(() => {
            createTrackingAPI({
                type: TrackingType.Product,
                action: TrackingAction.View,
                itemId: selectedVariantId ?? id,
                itemName: name,
            })
                .then(() => invalidateTrackingCache())
                .catch(() => {
                    /* Tracking is non-blocking for product detail. */
                });
        }, 10000);

        return () => {
            window.clearTimeout(timer);
        };
    }, [selectedVariantId, name, userId, id]);

    return (
        <div className="relative flex flex-col gap-0">

            {/* Heart button */}
            <button
                onClick={handleFavorite}
                disabled={favoriteLoading || favoriteStatusLoading}
                aria-label={favoriteActive ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                aria-pressed={favoriteActive}
                className="absolute top-0 right-0 w-10 h-10 rounded-full border border-[#7F9635] bg-transparent flex items-center justify-center text-[#7F9635] hover:bg-[#7F9635]/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
                <HeartOutline filled={favoriteActive} />
            </button>

            {/* Title - tên trà viết thường, in đậm */}
            <h1 className="font-source-serif-4 text-[24px] font-bold leading-[32px] text-[#3B5518] pr-14">{toTitleCaseVn(name)}</h1>

            {/* Price & Weight (theo quy cách đang chọn; chưa chọn thì hiện khoảng giá) */}
            <div className="flex items-center gap-3 mt-4 flex-wrap">
                <p className="text-[#3B5518] text-[18px] leading-[24px] font-semibold">{priceRangeText ?? fmt(effectivePrice)}</p>
                {selectedVariant && effectiveGram ? (
                    <span className="text-xs sm:text-sm font-semibold text-[#7F9635] bg-[#7F9635]/15 px-3 py-1 rounded-full border border-[#7F9635]/30">
                        {t('detail.weight', 'Khối lượng')}: {effectiveGram}g
                    </span>
                ) : !needsVariantChoice && weight ? (
                    <span className="text-xs sm:text-sm font-semibold text-[#7F9635] bg-[#7F9635]/15 px-3 py-1 rounded-full border border-[#7F9635]/30">
                        {t('detail.weight', 'Khối lượng')}: {typeof weight === 'number' ? `${weight}g` : weight}
                    </span>
                ) : null}
            </div>

            {/* Quy cách đóng gói - chọn bằng ảnh của từng phân loại */}
            {variants && variants.length > 1 && (
                <div className="mt-5" id="variant-selector">
                    <p className="text-xs font-semibold text-[#3B5518]">
                        {t('detail.packaging', 'Quy cách đóng gói')}:
                        {selectedVariant ? ` ${variantLabel(selectedVariant)}${effectiveGram ? ` (${effectiveGram}g)` : ''}` : ` ${t('detail.unselectedVariant', '- chưa chọn phân loại nào')}`}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={t('detail.packaging', 'Quy cách đóng gói')}>
                        {variants.map((variant) => {
                            const selected = variant.id === selectedVariantId;
                            const outOfStock = (variant.stock ?? 0) <= 0;
                            const thumb = resolveApiImageUrl(parseApiImageList(variant.images)[0] ?? '', '/images/shan-tuyet-tea-tree.jpg');
                            const label = `${variantLabel(variant)}${variant.gram ? ` (${variant.gram}g)` : ''} - ${fmt(variant.price)}${outOfStock ? ` - ${t('detail.outOfStock', 'Hết hàng')}` : ''}`;
                            return (
                                <button
                                    key={variant.id}
                                    type="button"
                                    role="radio"
                                    aria-checked={selected}
                                    aria-label={label}
                                    title={label}
                                    onClick={() => selectVariant(variant.id)}
                                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                                        selected
                                            ? 'border-[#3B5518]'
                                            : 'border-transparent hover:border-[#7F9635]/50'
                                    } ${outOfStock ? 'opacity-40' : ''}`}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={thumb}
                                        alt={label}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                            const img = e.currentTarget;
                                            img.onerror = null;
                                            img.src = '/images/shan-tuyet-tea-tree.jpg';
                                        }}
                                    />
                                </button>
                            );
                        })}
                    </div>
                    <p className="mt-2 text-xs text-[#3B5518]/60">
                        {selectedVariant ? (
                            <>
                                {t('detail.selected', 'Đang chọn')}: {variantLabel(selectedVariant)}
                                {effectiveGram ? ` (${effectiveGram}g)` : ''} - {fmt(effectivePrice)}
                                {selectedOutOfStock && <span className="font-semibold text-[#C0392B]"> - {t('detail.outOfStock', 'Hết hàng')}</span>}
                            </>
                        ) : (
                            t('detail.selectVariantPrompt', 'Chưa chọn phân loại - vui lòng chọn 1 quy cách đóng gói để xem giá và thêm vào giỏ.')
                        )}
                    </p>
                </div>
            )}

            {/* Divider */}
            <div className="border-t border-[#7F9635]/25 my-5" />

            {/* Quantity */}
            <div className="flex items-center gap-4">
                <span className="text-sm text-[#3B5518]/80 font-medium min-w-[70px]">{t('detail.quantity', 'Số lượng')}</span>
                <div className="flex items-center gap-0">
                    <button
                        onClick={decQty}
                        className="h-11 w-11 rounded-l-lg bg-[#7F9635] border border-[#7F9635] flex items-center justify-center text-white text-base hover:bg-[#6F8532] transition-colors"
                        aria-label="Giảm số lượng"
                    >
                        -
                    </button>
                    <span className="flex h-11 w-11 items-center justify-center border-y border-[#7F9635]/40 bg-[#F4F0E4] text-sm font-semibold text-[#3B5518]">
                        {qty}
                    </span>
                    <button
                        onClick={incQty}
                        className="h-11 w-11 rounded-r-lg bg-[#7F9635] border border-[#7F9635] flex items-center justify-center text-white text-base hover:bg-[#6F8532] transition-colors"
                        aria-label="Tăng số lượng"
                    >
                        +
                    </button>
                </div>
                <span className="text-sm text-[#3B5518]/60">
                    {unit}{!needsVariantChoice && (effectiveGram ? ` (${effectiveGram}g)` : weight ? ` (${typeof weight === 'number' ? `${weight}g` : weight})` : '')}
                </span>
            </div>

            {/* CTA Buttons */}
            {selectedOutOfStock && (
                <p className="mt-6 text-sm font-semibold text-[#C0392B]">{t('detail.outOfStockAlert', 'Phân loại này đã hết hàng, vui lòng chọn phân loại khác.')}</p>
            )}
            <div className="flex gap-3 mt-6">
                <button
                    onClick={handleAddToCart}
                    disabled={selectedOutOfStock}
                    className="flex items-center justify-center gap-2 bg-[#7B943E] text-white font-semibold px-5 py-3.5 rounded-[5px] hover:bg-[#8BA33B] transition-colors text-sm flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <CartIcon />
                    <span>{selectedOutOfStock ? t('detail.outOfStock', 'Hết hàng') : t('detail.addToCart', 'Thêm vào giỏ hàng')}</span>
                </button>
                <button
                    onClick={handleBuyNow}
                    disabled={selectedOutOfStock}
                    className="flex-1 text-center border border-[#7B943E] text-[#7B943E] font-semibold px-5 py-3.5 rounded-[5px] hover:bg-[#7B943E]/10 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {selectedOutOfStock ? t('detail.outOfStock', 'Hết hàng') : t('detail.buyNow', 'Thanh toán ngay')}
                </button>
            </div>

            {/* Divider */}
            <div className="border-t border-[#7F9635]/25 mt-7" />

            {/* Accordion sections */}
            <div className="mt-0 space-y-0">
                {accordionItems.map((item, idx) => {
                    const isOpen = openIdx === idx;
                    return (
                        <div
                            key={idx}
                            className="border-b border-[#7F9635]/25"
                        >
                            <button
                                onClick={() => setOpenIdx(isOpen ? null : idx)}
                                className="w-full flex items-center justify-between py-4 text-left"
                            >
                                <span className="font-source-serif-4 text-[18px] font-bold leading-[32px] text-[#3B5518]">{item.title}</span>
                                <div
                                    className={`shrink-0 transition-transform duration-200 text-[#3B5518]/60 ${
                                        isOpen ? 'rotate-180' : ''
                                    }`}
                                >
                                    <ChevronDown />
                                </div>
                            </button>
                            {isOpen && (
                                <div className="pb-5 text-sm leading-relaxed text-[#3B5518]/80">
                                    <DescriptionContent content={item.content} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
