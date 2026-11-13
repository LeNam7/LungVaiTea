'use client';

import React from 'react';
import Link from 'next/link';
import {getProductsPagingAPI} from '@/api/ProductAPI';
import {getTeaGroupsPagingAPI} from '@/api/TeaGroupAPI';
import {unwrapPagingData} from '@/api/response';
import type {Product, TeaGroupRecord} from '@/types/swagger.types';
import {
    GIFT_COLLECTIONS,
    TEA_GROUPS,
    giftsFromApiProducts,
    groupProductsIntoLines,
    mapTeaGroupRecords,
    type ProductLine,
    type TeaGroup,
    type TeaGroupId,
} from '@/lib/tea-taxonomy';
import {formatVndDesign} from '@/utils/designFallbacks';
import {parseApiImageList, resolveApiImageUrl} from '@/utils/imageUrl';
import {useLanguage} from '@/context/LanguageContext';

type Props = {
    open: boolean;
    onNavigate: () => void;
};

function priceRangeLabel(line: ProductLine): string {
    if (line.minPrice === line.maxPrice) return formatVndDesign(line.minPrice);
    return `${formatVndDesign(line.minPrice)} - ${formatVndDesign(line.maxPrice)}`;
}

/**
 * Mega menu khi hover vào "Sản phẩm trà" ở header, theo design 10/2026:
 * cột trái là Nhóm trà, cột phải NGẮN GỌN - chỉ tên nhóm + số lượng +
 * mô tả nhóm tối đa 2 dòng + danh sách dòng trà để chọn (tên + khoảng giá +
 * số quy cách), KHÔNG mô tả dài từng dòng trà. Hover sang nhóm khác thì
 * cột phải đổi ngay sang nhóm đó.
 */
export default function TeaMegaMenu({open, onNavigate}: Props) {
    const {t, locale} = useLanguage();
    const isEn = locale === 'en';
    const localizePath = (path: string) => locale === 'en' ? `/en${path === '/' ? '' : path}` : path;
    const [products, setProducts] = React.useState<Product[]>([]);
    const [groups, setGroups] = React.useState<TeaGroup[]>(TEA_GROUPS);
    const [loaded, setLoaded] = React.useState(false);
    const [activeGroup, setActiveGroup] = React.useState<TeaGroupId>('luc-tra');

    React.useEffect(() => {
        if (!open || loaded) return;
        let cancelled = false;
        (async () => {
            try {
                const [prodRes, groupRes] = await Promise.all([
                    getProductsPagingAPI({pageIndex: 1, pageSize: 100, isActive: true} as any),
                    getTeaGroupsPagingAPI({pageIndex: 1, pageSize: 100} as any).catch(() => null),
                ]);
                if (cancelled) return;
                setProducts(unwrapPagingData<Product>(prodRes).data.filter((p) => p.isActive !== false));
                if (groupRes) {
                    const mapped = mapTeaGroupRecords(
                        unwrapPagingData<TeaGroupRecord>(groupRes).data.filter((g) => g.isActive !== false),
                    );
                    if (mapped.length > 0) setGroups(mapped);
                }
            } catch {
                // Menu vẫn hiển thị nhóm trà, chỉ thiếu số lượng / dòng con.
            } finally {
                if (!cancelled) setLoaded(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [open, loaded]);

    const lines = React.useMemo(() => groupProductsIntoLines(products, groups), [products, groups]);
    const apiGifts = React.useMemo(() => giftsFromApiProducts(products), [products]);

    // Nhóm đang chọn phải nằm trong danh sách nhóm động, nếu không rơi về nhóm đầu.
    const safeActiveGroup = groups.some((g) => g.id === activeGroup) ? activeGroup : (groups[0]?.id ?? 'luc-tra');
    const activeGroupData = groups.find((g) => g.id === safeActiveGroup) ?? groups[0] ?? TEA_GROUPS[0];
    // Mô tả nhóm lấy từ bản ghi nhóm trà trên API (fallback mô tả design).
    const activeGroupDescription = isEn && activeGroupData.descriptionEn?.trim()
        ? activeGroupData.descriptionEn
        : t(`teaGroups.${safeActiveGroup}Desc`, activeGroupData.description);
    const activeLines = lines.filter((line) => line.groupId === safeActiveGroup);
    const giftCount = apiGifts.length;

    const countForGroup = (groupId: TeaGroupId): string => {
        if (!loaded) return t('common.loading', 'Đang tải...');
        if (groupId === 'set-qua-tang') return `${giftCount} ${t('teaMega.giftsCount', 'loại set quà tặng')}`;
        const groupLines = lines.filter((line) => line.groupId === groupId);
        if (groupLines.length === 0) return t('teaMega.updating', 'Đang cập nhật');
        return `${groupLines.length} ${t('teaMega.linesCount', 'dòng trà')}`;
    };

    if (!open) return null;

    return (
        <div className="seeme-mega-pop absolute left-1/2 top-full z-40 w-[min(1100px,calc(100vw-32px))] -translate-x-1/2 pt-2">
            {/* Mũi tên trỏ lên đúng chữ "Sản phẩm trà" / "Tea Products" (nằm cách tâm panel ~90px về bên trái, tức ~42% chiều rộng panel) */}
            <div
                aria-hidden
                className="pointer-events-none absolute left-[42%] top-[3px] h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-[#7F9635]/30 bg-[#F1EEE0]"
            />
            <div className="relative flex gap-6 overflow-hidden rounded-xl border border-[#7F9635]/30 bg-[#F1EEE0] p-4 shadow-[0_16px_40px_rgba(47,68,19,0.25)]">
                {/* Cột trái: Nhóm trà */}
                <div className="flex w-[280px] shrink-0 flex-col gap-2 overflow-y-auto">
                    <p className="px-4 pt-2 text-sm font-semibold text-[#7B943E]">{t('teaMega.teaGroups', 'Nhóm trà')}</p>
                    {groups.map((group) => {
                        const active = group.id === safeActiveGroup;
                        return (
                            <button
                                key={group.id}
                                type="button"
                                onMouseEnter={() => setActiveGroup(group.id)}
                                onFocus={() => setActiveGroup(group.id)}
                                onClick={() => {
                                    onNavigate();
                                }}
                                className={`rounded-lg px-4 py-2 text-left transition ${
                                    active ? 'bg-[#7B943E]/30' : 'hover:bg-[#7B943E]/15'
                                }`}
                            >
                                <Link
                                    href={localizePath(`/san-pham-tra?group=${group.id}`)}
                                    onClick={onNavigate}
                                    className="block"
                                >
                                    <span className={`block text-sm font-semibold ${active ? 'text-[#3B5518]' : 'text-[#3B5518]/85'}`}>
                                        {isEn && group.nameEn?.trim() ? group.nameEn : t(`teaGroups.${group.id}`, group.name)}
                                    </span>
                                    <span className="block text-xs text-[#3B5518]/70">{countForGroup(group.id)}</span>
                                </Link>
                            </button>
                        );
                    })}
                    <Link
                        href={localizePath('/san-pham-tra')}
                        onClick={onNavigate}
                        className="mx-4 mt-2 rounded-full bg-[#3B5518] px-4 py-2 text-center text-sm font-semibold text-white hover:bg-[#4A6720]"
                    >
                        {t('teaMega.viewAll', 'Xem tất cả sản phẩm')}
                    </Link>
                </div>

                {/* Cột phải: chi tiết nhóm - ngắn gọn, chỉ để chọn dòng trà */}
                <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-baseline justify-between gap-4">
                        <h3 className="font-source-serif-4 text-2xl text-[#3B5518]">
                            {isEn && activeGroupData.nameEn?.trim() ? activeGroupData.nameEn : t(`teaGroups.${safeActiveGroup}`, activeGroupData.name)}
                        </h3>
                        <span className="shrink-0 text-xs text-[#3B5518]/70">{countForGroup(safeActiveGroup)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[#3B5518]/80">
                        {activeGroupDescription}
                    </p>

                    {safeActiveGroup === 'set-qua-tang' ? (
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            {GIFT_COLLECTIONS.map((collection) => {
                                const items = apiGifts.filter((g) => g.collectionId === collection.id);
                                return (
                                    <Link
                                        key={collection.id}
                                        href={localizePath(`/san-pham-tra?group=set-qua-tang&collection=${collection.id}`)}
                                        onClick={onNavigate}
                                        className="rounded-lg border border-[#7F9635]/30 bg-white/70 p-4 transition hover:bg-white"
                                    >
                                        <p className="font-semibold text-[#3B5518]">
                                            {isEn && collection.nameEn?.trim() ? collection.nameEn : collection.name}
                                        </p>
                                        <p className="mt-1 text-xs text-[#3B5518]/70">
                                            {!loaded ? t('common.loading', 'Đang tải...') : items.length > 0 ? `${items.length} ${t('teaMega.giftsCount', 'set quà tặng')}` : t('teaMega.updating', 'Đang cập nhật')}
                                        </p>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <>
                            <p className="mt-4 text-sm font-medium text-[#7B943E]">{t('teaMega.selectToView', 'Chọn loại trà để xem sản phẩm')}</p>
                            {activeLines.length === 0 ? (
                                <p className="mt-2 rounded-lg bg-white/60 px-4 py-3 text-sm text-[#3B5518]/70">
                                    {t('teaMega.empty', 'Nhóm này chưa có sản phẩm trên hệ thống.')}
                                </p>
                            ) : (
                                <ul className="mt-2 divide-y divide-[#7F9635]/15">
                                    {activeLines.map((line) => (
                                        <li key={line.key}>
                                            <Link
                                                href={localizePath(
                                                    line.variants[0]?.id
                                                        ? `/san-pham-tra/${line.variants[0].id}`
                                                        : `/san-pham-tra?group=${safeActiveGroup}&line=${encodeURIComponent(line.key)}`
                                                )}
                                                onClick={onNavigate}
                                                className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition hover:bg-white/70"
                                            >
                                                <span className="flex min-w-0 items-center gap-3">
                                                    <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-white/70">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={resolveApiImageUrl(parseApiImageList(line.image)[0] ?? '', '/images/shan-tuyet-tea-tree.jpg')}
                                                            alt=""
                                                            className="h-full w-full object-cover"
                                                            onError={(e) => {
                                                                const img = e.currentTarget;
                                                                img.onerror = null;
                                                                img.src = '/images/shan-tuyet-tea-tree.jpg';
                                                            }}
                                                        />
                                                    </span>
                                                    <span className="line-clamp-2 font-semibold leading-snug text-[#3B5518]">
                                                        {isEn && line.nameEn?.trim() ? line.nameEn : line.name}
                                                    </span>
                                                </span>
                                                <span className="shrink-0 text-right text-sm text-[#3B5518]/70">
                                                    <span className="font-semibold text-[#7F9635]">{priceRangeLabel(line)}</span>
                                                    <span className="block text-xs">
                                                        {line.variants.length} {t('products.specifications', 'quy cách')}
                                                        {line.minGram ? ` · ${line.minGram}g - ${line.maxGram}g` : ''}
                                                    </span>
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
