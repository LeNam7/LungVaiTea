'use client';

import React, {useState} from 'react';
import {useRouter} from 'next/navigation';
import {toast} from '@/utils/toast';
import {HeartOutline, CartIcon, ChevronDown, fmt} from './icons';
import {useCart} from '@/hooks/useCart';
import {GIFT_COLLECTIONS, type GiftColor, type GiftPackaging, type GiftProduct} from '@/lib/tea-taxonomy';
import {resolveApiImageUrl} from '@/utils/imageUrl';
import {toTitleCaseVn} from '@/utils/text';
import DescriptionContent from './DescriptionContent';
import {useLanguage} from '@/context/LanguageContext';

type Props = {
    gift: GiftProduct;
    index: number;
    accordionItems: {title: string; content: string}[];
    /** Quy cách mở đầu (id row API). Không truyền thì dùng quy cách rẻ nhất. */
    initialPackagingId?: number;
    /** Báo cho trang cha khi khách đổi quy cách (để đổi luôn ảnh gallery). */
    onPackagingChange?: (packaging: GiftPackaging) => void;
    /** Báo cho trang cha khi khách chọn màu (để đổi luôn ảnh gallery theo màu). */
    onColorChange?: (color: GiftColor | null) => void;
};

/** Khóa chọn của một màu: ảnh upload (màu mới, không tên) hoặc tên (màu cũ chưa có ảnh). */
const colorKey = (color: GiftColor): string => color.image || color.name;

/**
 * Chi tiết set quà tặng theo design 10/2026: chọn quy cách đóng gói bằng select
 * (luôn là select, kể cả khi set chỉ có 1 quy cách - mỗi quy cách giá riêng,
 * CMS cấu hình tên + giá) và chọn màu bằng ảnh admin upload (màu cũ chưa có ảnh
 * thì vẫn hiện chấm màu + tên như trước), rồi thêm vào giỏ / thanh toán ngay.
 * Set quà lấy từ API (Product.isGiftSet = true), id giỏ hàng là id thật của row
 * quy cách đang chọn, màu được truyền vào giỏ dưới dạng variant để không gộp
 * nhầm các màu khác nhau; ảnh màu đang chọn (nếu có) làm ảnh đại diện dòng giỏ
 * để khách nhận ra đúng màu mình đã chọn.
 */
export default function GiftProductInfo({gift, accordionItems, initialPackagingId, onPackagingChange, onColorChange}: Props) {
    const {t, locale} = useLanguage();
    const [qty, setQty] = useState(1);
    const [openIdx, setOpenIdx] = useState<number | null>(0);
    const packagings = gift.packagings.length > 0 ? gift.packagings : [];
    const initialPackaging = packagings.find((p) => p.apiId === initialPackagingId) ?? packagings[0];
    const [selectedPackagingId, setSelectedPackagingId] = useState<number | undefined>(initialPackaging?.apiId);
    const [packagingOpen, setPackagingOpen] = useState(false);
    const packaging = packagings.find((p) => p.apiId === selectedPackagingId) ?? initialPackaging;
    // Tồn kho CMS hiển thị null thành 0 nên null cũng tính là hết hàng.
    const packagingOutOfStock = packaging ? (packaging.total ?? 0) <= 0 : false;
    // Mặc định CHƯA chọn màu: khách bấm thumbnail nào mới chọn màu đó, giỏ chỉ
    // ghi màu khi khách đã chọn thật (trước đây tự chọn sẵn màu đầu tiên nên giỏ
    // hiện màu khách không chọn, vd set không có màu vẫn hiện màu hồng).
    // Reset trong lúc render (derived state, không dùng effect): đổi set khác
    // hoặc đổi quy cách thì màu cũ không được rò sang set/quy cách mới.
    const [selectedColor, setSelectedColor] = useState('');
    const [prevColorScope, setPrevColorScope] = useState(`${gift.slug}:${packaging?.apiId ?? ''}`);
    if (prevColorScope !== `${gift.slug}:${packaging?.apiId ?? ''}`) {
        setPrevColorScope(`${gift.slug}:${packaging?.apiId ?? ''}`);
        setSelectedColor('');
    }
    const router = useRouter();
    const {addProduct} = useCart();

    const collection = GIFT_COLLECTIONS.find((c) => c.id === gift.collectionId);
    // Id giỏ hàng = id row quy cách đang chọn (mỗi quy cách giá riêng, không gộp chung).
    const cartId = packaging?.apiId ?? gift.apiId ?? 0;
    const price = packaging?.price ?? gift.priceMin;
    const gram = packaging?.gram ?? gift.gram;
    const colors = (packaging?.colors ?? gift.colors).filter((c) => c.image);
    const selectedColorObj = colors.find((c) => colorKey(c) === selectedColor);
    const cartImage = selectedColorObj?.image ?? packaging?.image ?? gift.image;
    const cartName = selectedColorObj?.name ? `${gift.name} (Màu ${selectedColorObj.name})` : gift.name;

    const selectPackaging = (apiId: number) => {
        const next = packagings.find((p) => p.apiId === apiId);
        if (!next) return;
        setSelectedPackagingId(apiId);
        onPackagingChange?.(next);
    };

    const handleAddToCart = () => {
        if (packagingOutOfStock) {
            toast.error(t('detail.outOfStockAlert', 'Quy cách này đã hết hàng'));
            return;
        }
        addProduct({id: cartId, name: cartName, price, quantity: qty, unit: 'set', images: cartImage, variant: selectedColor || null, packagingName: packaging?.packaging ?? null, colorName: selectedColorObj?.name || null});
        toast.success(t('detail.addedToCart', 'Đã thêm vào giỏ hàng'));
    };

    const handleBuyNow = () => {
        if (packagingOutOfStock) {
            toast.error(t('detail.outOfStockAlert', 'Quy cách này đã hết hàng'));
            return;
        }
        addProduct({id: cartId, name: cartName, price, quantity: qty, unit: 'set', images: cartImage, variant: selectedColor || null, packagingName: packaging?.packaging ?? null, colorName: selectedColorObj?.name || null});
        router.push(locale === 'en' ? '/en/gio-hang' : '/gio-hang');
    };

    return (
        <div className="relative flex flex-col gap-0">
            <button
                type="button"
                aria-label="Thêm vào yêu thích"
                className="absolute top-0 right-0 w-10 h-10 rounded-full border border-[#7F9635] bg-transparent flex items-center justify-center text-[#7F9635] hover:bg-[#7F9635]/10 transition-colors"
                onClick={() => toast.success('Tính năng yêu thích cho set quà sẽ cập nhật khi có API sản phẩm quà tặng.')}
            >
                <HeartOutline />
            </button>

            <h1 className="font-source-serif-4 text-3xl lg:text-[38px] font-bold text-[#3B5518] pr-14 leading-tight">{toTitleCaseVn(gift.name)}</h1>
            {collection ? <p className="mt-1 text-sm text-[#7F9635]">{collection.name}</p> : null}

            <div className="flex items-center gap-3 mt-4 flex-wrap">
                <p className="text-[#3B5518] text-2xl lg:text-3xl font-bold">{fmt(price)}</p>
                <span className="text-xs sm:text-sm font-semibold text-[#7F9635] bg-[#7F9635]/15 px-3 py-1 rounded-full border border-[#7F9635]/30">
                    Khối lượng: {gram}g
                </span>
            </div>

            {/* Quy cách đóng gói: luôn chọn bằng select (mỗi quy cách giá riêng,
                CMS cấu hình tên + giá cho từng quy cách). */}
            <div className="mt-5">
                <p className="text-sm text-[#3B5518]/80 font-medium">Quy cách đóng gói:</p>
                <div className="relative mt-2">
                    <button
                        type="button"
                        aria-label="Chọn quy cách đóng gói"
                        onClick={() => setPackagingOpen((v) => !v)}
                        className="flex w-full items-center justify-between gap-2 rounded-xl border border-[#7F9635]/50 bg-white/70 py-3 pl-4 pr-3 text-left text-sm font-medium text-[#3B5518] shadow-sm outline-none transition hover:border-[#7F9635] focus:border-[#3B5518] focus:ring-2 focus:ring-[#3B5518]/30"
                    >
                        <span className="min-w-0 truncate">
                            {packaging ? packaging.packaging : t('detail.selectPackaging', 'Chọn quy cách đóng gói')}
                        </span>
                        <span className="shrink-0 text-[#7F9635]">
                            <ChevronDown />
                        </span>
                    </button>
                    {packagingOpen && (
                        <>
                            <button
                                type="button"
                                aria-label="Đóng danh sách quy cách"
                                className="fixed inset-0 z-40 cursor-default"
                                onClick={() => setPackagingOpen(false)}
                            />
                            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-[#7F9635]/40 bg-[#FFFDF5] shadow-lg">
                                {packagings.map((p) => {
                                    const active = p.apiId === packaging?.apiId;
                                    const outOfStock = (p.total ?? 0) <= 0;
                                    return (
                                        <button
                                            key={p.apiId}
                                            type="button"
                                            onClick={() => {
                                                selectPackaging(p.apiId);
                                                setPackagingOpen(false);
                                            }}
                                            className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition ${
                                                active
                                                    ? 'bg-[#7F9635]/15 font-semibold text-[#3B5518]'
                                                    : 'text-[#3B5518]/90 hover:bg-[#7F9635]/10'
                                            } ${outOfStock ? 'opacity-50' : ''}`}
                                        >
                                            <span className="min-w-0">
                                                {p.packaging}
                                                {outOfStock && <span className="font-semibold text-[#C0392B]"> - {t('detail.outOfStock', 'Hết hàng')}</span>}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Chọn màu bằng ảnh admin upload. Quy cách nào không có ảnh màu thì
                không có mục chọn màu (không hiện chấm màu, không hiện tên màu). */}
            {colors.length > 0 && (
                <div className="mt-5">
                    <p className="text-sm text-[#3B5518]/80 font-medium">
                        {t('detail.selectColor', 'Chọn màu')}{selectedColorObj?.name ? `: ${selectedColorObj.name}` : ''}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={t('detail.selectColor', 'Chọn màu')}>
                        {colors.map((color, i) => {
                            const key = colorKey(color);
                            const selected = key === selectedColor;
                            const thumb = resolveApiImageUrl(color.image ?? '', '');
                            return (
                                <button
                                    key={`${key}-${i}`}
                                    type="button"
                                    role="radio"
                                    aria-checked={selected}
                                    aria-label={`Màu ${i + 1}`}
                                    onClick={() => {
                                        setSelectedColor(key);
                                        onColorChange?.(color);
                                    }}
                                    className={`h-16 w-16 overflow-hidden rounded-xl border-2 transition ${selected ? 'border-[#3B5518] ring-2 ring-[#3B5518]/40' : 'border-[#7F9635]/40 hover:border-[#7F9635]'}`}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={thumb}
                                        alt=""
                                        className="h-full w-full object-cover"
                                        onError={(e) => { const el = e.currentTarget; el.onerror = null; el.style.display = 'none'; }}
                                    />
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="border-t border-[#7F9635]/25 my-5" />

            <div className="flex items-center gap-4">
                <span className="text-sm text-[#3B5518]/80 font-medium min-w-[70px]">{t('detail.quantity', 'Số lượng')}</span>
                <div className="flex items-center gap-0">
                    <button
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        className="h-11 w-11 rounded-l-lg bg-[#7F9635] border border-[#7F9635] flex items-center justify-center text-white text-base hover:bg-[#6F8532] transition-colors"
                        aria-label="Giảm số lượng"
                    >
                        -
                    </button>
                    <span className="flex h-11 w-11 items-center justify-center border-y border-[#7F9635]/40 bg-[#F4F0E4] text-sm font-semibold text-[#3B5518]">
                        {qty}
                    </span>
                    <button
                        onClick={() => setQty((q) => q + 1)}
                        className="h-11 w-11 rounded-r-lg bg-[#7F9635] border border-[#7F9635] flex items-center justify-center text-white text-base hover:bg-[#6F8532] transition-colors"
                        aria-label="Tăng số lượng"
                    >
                        +
                    </button>
                </div>
                <span className="text-sm text-[#3B5518]/60">set ({gram}g)</span>
            </div>

            {packagingOutOfStock && (
                <p className="mt-6 text-sm font-semibold text-[#C0392B]">{t('detail.outOfStockAlert', 'Quy cách này đã hết hàng, vui lòng chọn quy cách khác.')}</p>
            )}
            <div className="flex gap-3 mt-6">
                <button
                    onClick={handleAddToCart}
                    disabled={packagingOutOfStock}
                    className="flex items-center justify-center gap-2 bg-[#7F9635] text-white font-bold px-5 py-3.5 rounded-xl hover:bg-[#8BA33B] transition-colors text-sm flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <CartIcon />
                    <span>{packagingOutOfStock ? t('detail.outOfStock', 'Hết hàng') : t('detail.addToCart', 'Thêm vào giỏ hàng')}</span>
                </button>
                <button
                    onClick={handleBuyNow}
                    disabled={packagingOutOfStock}
                    className="flex-1 text-center border-2 border-[#7F9635] text-[#7F9635] font-bold px-5 py-3.5 rounded-xl hover:bg-[#7F9635]/10 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {packagingOutOfStock ? t('detail.outOfStock', 'Hết hàng') : t('detail.buyNow', 'Thanh toán ngay')}
                </button>
            </div>

            <div className="border-t border-[#7F9635]/25 mt-7" />

            <div className="mt-0 space-y-0">
                {accordionItems.map((item, idx) => {
                    const isOpen = openIdx === idx;
                    return (
                        <div key={idx} className="border-b border-[#7F9635]/25">
                            <button
                                onClick={() => setOpenIdx(isOpen ? null : idx)}
                                className="w-full flex items-center justify-between py-4 text-left"
                            >
                                <span className="text-sm sm:text-base font-bold text-[#7F9635]">{item.title}</span>
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
