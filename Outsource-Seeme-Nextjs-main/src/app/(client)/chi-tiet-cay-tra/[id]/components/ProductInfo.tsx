'use client';

import React, {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {toast} from '@/utils/toast';
import {HeartOutline, CartIcon, fmt} from './icons';
import {getTeaCost, isTeaPurchasable, isTeaContactPrice, TEA_SPRING_PRODUCT} from '@/utils/teaFields';
import {BRAND} from '@/constants/brand';
import {useCart} from '@/hooks/useCart';
import {
    createTrackingAPI,
    deleteTrackingAPI,
    getTrackingByItemAPI,
    invalidateTrackingCache,
} from '@/api/UserPreferenceAPI';
import {TrackingAction, TrackingType} from '@/types/swagger.types';
import {useAppSelector} from '@/store/hooks';
import {useLanguage} from '@/context/LanguageContext';

type Props = {
    name: string;
    gardenName: string;
    price: number;
    volume?: number;
    teaType?: string | null;
    teaId?: number;
    sold?: boolean;
    images?: string | null;
};

export default function ProductInfo({
    name,
    gardenName,
        price,
    volume,
    teaType,
    teaId,
    sold,
    images,
}: Props) {
    const {t} = useLanguage();
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteTrackingId, setFavoriteTrackingId] = useState<number | null>(null);
    const [favoriteStatusLoading, setFavoriteStatusLoading] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const router = useRouter();
    const {addTea} = useCart();
    const user = useAppSelector((s) => s.auth.user as any);
    const userId = Number(user?.id);

    const cost = getTeaCost({price, volume});
    const purchasable = isTeaPurchasable({price, volume, sold, name});
    const isContactPrice = isTeaContactPrice({price, volume, sold, name});

    const buildCartTea = () => ({
        id: teaId!,
        name,
        code: `#${teaId}`,
        price,
        images,
        volume,
        type: teaType,
        seasons: [{label: 'Vụ Xuân', variant: TEA_SPRING_PRODUCT, quantity: volume ?? 0}],
        plantingYears: 1,
    });

    const handleAddToCart = () => {
        if (!purchasable || !teaId) return;
        addTea(buildCartTea());
        toast.success('Đã thêm cây trà vào giỏ hàng');
    };

    const handleBuyNow = () => {
        if (!purchasable || !teaId) return;
        addTea(buildCartTea());
        router.push('/gio-hang');
    };

    const requestLogin = () => {
        window.dispatchEvent(new CustomEvent('open-auth-modal'));
    };

    const readTrackingId = (response: any) =>
        Number(response?.data?.id ?? response?.id ?? response?.trackingId ?? 0);

    const handleFavorite = async () => {
        if (!userId || !teaId) {
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
                type: TrackingType.Tea,
                action: TrackingAction.Like,
                itemId: teaId,
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
        if (!userId || !teaId) {
            return;
        }

        Promise.resolve()
            .then(() => {
                if (!ignore) setFavoriteStatusLoading(true);
                return getTrackingByItemAPI({type: TrackingType.Tea, action: TrackingAction.Like, itemId: teaId});
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
    }, [teaId, userId]);

    const favoriteActive = Boolean(userId && isFavorite);

    useEffect(() => {
        if (!userId || !teaId) return;
        const timer = window.setTimeout(() => {
            createTrackingAPI({
                type: TrackingType.Tea,
                action: TrackingAction.View,
                itemId: teaId,
                itemName: name,
            })
                .then(() => invalidateTrackingCache())
                .catch(() => {
                    /* Tracking is non-blocking for tea detail. */
                });
        }, 10000);

        return () => {
            window.clearTimeout(timer);
        };
    }, [name, teaId, userId]);

    return (
        <div className="relative">

            {/* Heart button */}
            <button
                onClick={handleFavorite}
                disabled={favoriteLoading || favoriteStatusLoading}
                aria-label={favoriteActive ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                aria-pressed={favoriteActive}
                className="absolute top-0 right-0 w-10 h-10 rounded-full border border-[#3B5518] bg-transparent flex items-center justify-center text-[#7F9635] hover:bg-[#3B5518]/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
                <HeartOutline filled={favoriteActive} />
            </button>

            {/* Title */}
            <h1 className="font-source-serif-4 text-3xl lg:text-[40px] text-[#3B5518] pr-14 leading-tight">{name}</h1>

            {/* Garden */}
            <div className="flex items-center gap-3 mt-2">
                <span className="">{gardenName}</span>
                {teaType ? (
                    <span className="rounded-full bg-[#EEF2E4] px-2.5 py-1 text-xs font-semibold">{t('treeDetail.treeType', 'Loại')} {teaType}</span>
                ) : null}
            </div>

            {/* Price */}
            {isContactPrice ? (
                <a
                    href={BRAND.zalo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-[#3B5518] hover:text-[#7F9635] text-2xl lg:text-3xl font-bold mt-3 transition-colors hover:underline"
                >
                    {t('treeDetail.contact', 'Liên hệ')}
                </a>
            ) : (
                <p className="text-[#3B5518] text-2xl lg:text-3xl font-bold mt-3">{cost === null ? '-' : fmt(cost)}</p>
            )}

            <p className="mt-2 text-sm">
                {isContactPrice
                    ? t('treeDetail.contactPriceNotice', 'Giá: Liên hệ tư vấn qua Zalo để nhận báo giá chi tiết')
                    : cost === null
                      ? `${t('treeDetail.unitPrice', 'Đơn giá')}: -`
                      : `${t('treeDetail.unitPrice', 'Đơn giá')}: ${fmt(price)}/kg × ${volume?.toLocaleString('vi-VN')} kg`}
            </p>
            {/* Ownership table */}
            <div className="mt-5 border border-[#3B5518] rounded-lg overflow-hidden">
                <div className="grid grid-cols-3">
                    <div className="px-3 py-2.5 border-r border-[#3B5518] font-source-serif-4 font-bold text-[#3B5518]">
                        {t('treeDetail.ownershipMethod', 'Hình thức')}
                    </div>
                    <div className="px-3 py-2.5 border-r border-[#3B5518] font-source-serif-4 font-bold text-[#3B5518]">
                        {t('treeDetail.ownershipCost', 'Chi phí')}
                    </div>
                    <div className="px-3 py-2.5 font-source-serif-4 font-bold leading-snug text-[#3B5518]">
                        {t('treeDetail.guaranteedYield', 'Sản lượng đầu ra cam kết')}
                    </div>
                </div>
                <div className="grid grid-cols-3 border-t border-[#3B5518]">
                    <div className="px-3 py-2.5 border-r border-[#3B5518]">{t('treeDetail.fullOwnership', 'Sở hữu nguyên cây')}</div>
                    <div className="px-3 py-2.5 border-r border-[#3B5518]">
                        {isContactPrice ? (
                            <a
                                href={BRAND.zalo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-[#3B5518] hover:underline"
                            >
                                {t('treeDetail.contact', 'Liên hệ')}
                            </a>
                        ) : cost === null ? (
                            '-'
                        ) : (
                            fmt(cost)
                        )}
                    </div>
                    <div className="px-3 py-2.5">
                        {volume && volume > 0 ? (
                            <>
                                <span className="font-semibold">{volume.toLocaleString('vi-VN')} kg/cây/năm</span>
                                <br />
                                <span className="text-xs opacity-75">Sản lượng theo hồ sơ cây trà</span>
                            </>
                        ) : (
                            <span className="font-semibold">-</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-5 space-y-3">
                <p>{t('treeDetail.harvestCount', 'Số lần thu hoạch trong năm:')} <strong>{t('treeDetail.harvestValue', '1 lần - Vụ Xuân')}</strong></p>
                <p>{t('treeDetail.finishedProduct', 'Loại thành phẩm:')} <strong>{TEA_SPRING_PRODUCT}</strong></p>
                <p>{t('treeDetail.quantityPerYear', 'Số lượng:')} <strong>{volume && volume > 0 ? `${volume.toLocaleString('vi-VN')} ${t('treeDetail.dryTeaPerYear', 'kg trà khô/năm')}` : '-'}</strong></p>
            </div>

            {/* CTA Buttons */}
            {sold ? (
                <div className="mt-7 text-center py-4 border-2 border-gray-500/40 rounded-lg text-gray-400 font-semibold">
                    {t('treeDetail.treeSold', 'Cây trà này đã được bán')}
                </div>
            ) : isContactPrice ? (
                <div className="flex gap-3 mt-6">
                    <a
                        href={BRAND.zalo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 bg-[#3B5518] text-white font-bold px-5 py-3.5 rounded-xl hover:bg-[#8BA33B] transition-colors text-sm text-center shadow-md cursor-pointer"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <span>{t('treeDetail.contactZalo', 'Liên hệ tư vấn (Zalo)')}</span>
                    </a>
                </div>
            ) : !purchasable ? (
                <div className="mt-7 text-center py-4 border-2 border-gray-300 rounded-lg text-gray-400 font-semibold bg-gray-50">
                    {t('treeDetail.notForSale', 'Chưa mở bán')}
                </div>
            ) : (
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={handleAddToCart}
                        disabled={!purchasable || !teaId}
                        className="flex items-center justify-center gap-2 bg-[#3B5518] text-white font-bold px-5 py-3.5 rounded-xl hover:bg-[#8BA33B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex-1"
                    >
                        <CartIcon />
                        <span>{t('treeDetail.addToCart', 'Thêm vào giỏ hàng')}</span>
                    </button>
                    <button
                        onClick={handleBuyNow}
                        disabled={!purchasable || !teaId}
                        className="flex-1 text-center border-2 border-[#3B5518] text-[#3B5518] font-bold px-5 py-3.5 rounded-xl hover:bg-[#3B5518]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        {t('treeDetail.buyNow', 'Thanh toán ngay')}
                    </button>
                </div>
            )}
        </div>
    );
}
