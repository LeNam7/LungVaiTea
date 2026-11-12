'use client';

import React from 'react';
import Link from 'next/link';
import {toast} from '@/utils/toast';
import {
    deleteTrackingAPI,
    getCachedTrackingByActionAPI,
    invalidateTrackingCache,
} from '@/api/UserPreferenceAPI';
import {TrackingAction, TrackingType} from '@/types/swagger.types';
import {useAppSelector} from '@/store/hooks';
import AccountTabHeader from '@/components/account/AccountTabHeader';
import {useLanguage} from '@/context/LanguageContext';
import {
    TRACKING_TYPE_OPTIONS,
    enrichTrackingItems,
    fmtVnd,
    getArrayData,
    getImageUrl,
    getTrackingHref,
    getTrackingTypeLabel,
    type TrackingCatalogItem,
} from './trackingCatalog';

const FavoriteHeart = () => (
    <svg
        width="16"
        height="15"
        viewBox="0 0 22 19"
        fill="none"
        aria-hidden="true"
    >
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 1.926C8.438-.144 5.849-.434 3.75.525 1.536 1.54 0 3.892 0 6.604c0 2.665 1.11 4.699 2.567 6.339 1.166 1.313 2.593 2.412 3.854 3.382.287.22.562.434.826.642.513.404 1.063.834 1.62 1.16.557.326 1.193.59 1.883.59s1.326-.264 1.883-.59c.558-.326 1.107-.756 1.62-1.16.264-.208.539-.422.826-.642 1.26-.97 2.688-2.07 3.854-3.382C20.39 11.303 21.5 9.269 21.5 6.604c0-2.712-1.535-5.064-3.75-6.077-2.099-.96-4.688-.67-7 1.399z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.8"
        />
    </svg>
);

export default function SanPhamYeuThichTab() {
    const { t } = useLanguage();
    const user = useAppSelector((s) => s.auth.user as any);
    const userId = Number(user?.id);

    const [activeType, setActiveType] = React.useState<TrackingType>(TrackingType.Tea);
    const [allFavorites, setAllFavorites] = React.useState<TrackingCatalogItem[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [removingId, setRemovingId] = React.useState<number | null>(null);

    const favorites = React.useMemo(
        () => allFavorites.filter((item) => item.type === activeType),
        [activeType, allFavorites],
    );

    const getTypeCountLabel = (type: TrackingType, count: number) => {
        const unit = type === TrackingType.Tea
            ? t('account.tracking.teaTrees', 'cây trà')
            : t('account.tracking.teaProducts', 'sản phẩm trà');
        return `${count} ${unit}`;
    };

    const getTrackingTypeTabLabel = (type: TrackingType) =>
        type === TrackingType.Tea
            ? t('account.tracking.teaTreeTab', 'Cây trà')
            : t('account.tracking.teaProductTab', 'Sản phẩm trà');

    const fetchFavorites = React.useCallback(async () => {
        await Promise.resolve();
        if (!userId) {
            setAllFavorites([]);
            return;
        }

        setLoading(true);
        try {
            const list = await getCachedTrackingByActionAPI(TrackingAction.Like, userId).then(getArrayData);
            const favoriteItems = TRACKING_TYPE_OPTIONS.flatMap((option) =>
                enrichTrackingItems(
                    list.filter((item: any) => Number(item?.type) === option.value),
                    option.value,
                ),
            );
            setAllFavorites(favoriteItems);
        } catch {
            setAllFavorites([]);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    React.useEffect(() => {
        void Promise.resolve().then(fetchFavorites);
    }, [fetchFavorites]);

    const removeFavorite = async (item: TrackingCatalogItem) => {
        if (!item?.id || !userId || removingId) return;
        setRemovingId(item.trackingId || item.id);
        try {
            const trackingId = Number(item?.trackingId);
            if (!trackingId) {
                toast.error('Không tìm thấy mã yêu thích để xoá');
                return;
            }

            await deleteTrackingAPI(trackingId);
            invalidateTrackingCache();
            setAllFavorites((prev) => prev.filter((entry) => entry.trackingId !== trackingId));
            toast.success(`Đã bỏ ${getTrackingTypeLabel(activeType)} khỏi yêu thích`);
        } catch {
            toast.error('Không thể cập nhật yêu thích');
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <div>
            <AccountTabHeader
                title={t('account.favorites.title', 'Sản phẩm yêu thích')}
                meta={loading ? <div className="h-4 w-16 bg-white/20 rounded animate-pulse" /> : getTypeCountLabel(activeType, favorites.length)}
            />

            <div className="mb-4 flex flex-wrap gap-2">
                {TRACKING_TYPE_OPTIONS.map((option) => {
                    const active = activeType === option.value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => setActiveType(option.value)}
                            className={`min-h-9 rounded-[8px] border px-4 py-2 text-sm font-semibold transition ${
                                active
                                    ? 'border-seeme-accent bg-seeme-accent text-white'
                                    : 'border-white/25 bg-white/10 text-seeme-cream hover:bg-white/20'
                            }`}
                        >
                            {getTrackingTypeTabLabel(option.value)}
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 min-[480px]:grid-cols-2 sm:grid-cols-3 gap-3">
                    {Array.from({length: 3}).map((_, i) => (
                        <div key={i} className="border border-white/15 rounded-xl overflow-hidden bg-white/10 animate-pulse">
                            <div className="w-full h-24 sm:h-28 bg-white/20" />
                            <div className="p-3">
                                <div className="h-4 w-4/5 bg-white/20 rounded" />
                                <div className="h-4 w-3/5 bg-white/20 rounded mt-1" />
                                <div className="mt-3 h-7 w-full bg-white/20 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : favorites.length ? (
                <div className="grid grid-cols-1 min-[480px]:grid-cols-2 sm:grid-cols-3 gap-3">
                    {favorites.map((item) => (
                        <div
                            key={`${item.type}-${item.id}`}
                            className="seeme-card-light rounded-xl overflow-hidden"
                        >
                            <Link href={getTrackingHref(item.type, item.id)} className="block hover:opacity-90 transition-opacity">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={getImageUrl(item.images, item.type)}
                                    alt={item.name ?? getTrackingTypeLabel(item.type)}
                                    className="w-full h-36 object-cover"
                                />
                            </Link>
                            <div className="p-3">
                                <Link href={getTrackingHref(item.type, item.id)} className="block">
                                    <p className="text-[#3B5518] font-medium line-clamp-2 hover:text-[#7F9635] transition-colors">{item.name}</p>
                                    {typeof item.price === 'number' && (
                                        <p className="text-[#7F9635] text-sm font-bold mt-1">{fmtVnd(item.price)}</p>
                                    )}
                                </Link>
                                <button
                                    onClick={() => removeFavorite(item)}
                                    disabled={removingId !== null}
                                    className="mt-3 w-full py-1.5 border border-seeme-accent rounded text-sm text-seeme-primary hover:bg-seeme-accent hover:text-white transition disabled:cursor-wait disabled:opacity-60 flex items-center justify-center gap-1.5"
                                >
                                    <FavoriteHeart />
                                    {removingId === (item.trackingId || item.id) ? t('account.favorites.removing', 'Đang bỏ...') : t('account.favorites.removeFavorite', 'Bỏ yêu thích')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex min-h-[120px] items-center">
                    <p className="seeme-muted-on-dark">{t('account.favorites.empty', 'Chưa có sản phẩm yêu thích nào.')}</p>
                </div>
            )}
        </div>
    );
}
