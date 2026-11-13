'use client';

import React from 'react';
import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import TeaProductCard from '@/components/common/TeaProductCard';
import {getProductsPagingAPI, getSoldCountsAPI} from '@/api/ProductAPI';
import {unwrapApiData, unwrapPagingData} from '@/api/response';
import type {Product, SoldCount} from '@/types/swagger.types';
import {getFirstApiImageUrl} from '@/utils/imageUrl';
import FadeInUp from '@/components/animations/FadeInUp';
import {formatVndDesign, withTimeout} from '@/utils/designFallbacks';
import type {TeaProductTag} from '@/components/common/TeaProductCard';
import AbsoluteBackground from '@/components/common/AbsoluteBackground';
import {
    GIFT_COLLECTIONS,
    PRICE_RANGES,
    giftsFromApiProducts,
    groupProductsIntoLines,
    lineMatchesSearch,
    normalizeSearchText,
    priceInRanges,
    type GiftProduct,
    type ProductLine,
    type TeaGroupId,
} from '@/lib/tea-taxonomy';
import {useTeaGroups} from '@/hooks/useTeaGroups';
import {useLanguage} from '@/context/LanguageContext';

const PAGE_SIZE_MOBILE = 8;
const PAGE_SIZE_DESKTOP = 9;

const getImageUrl = (images?: string | null) => {
    return getFirstApiImageUrl(images, '/images/shan-tuyet-tea-tree.jpg');
};

// Tham số điều hướng của trang list. PageContent giữ mounted suốt phiên và
// lọc theo state này, thay vì remount theo key URL như trước.
type NavParams = {group: string | null; line: string | null; collection: string | null; q: string};

const readNavParams = (get: (key: string) => string | null): NavParams => ({
    group: get('group'),
    line: get('line'),
    collection: get('collection'),
    q: get('q') ?? '',
});

const navParamsToString = (p: NavParams) => [p.group ?? '', p.line ?? '', p.collection ?? '', p.q].join('|');

const navParamsToUrl = (p: NavParams) => {
    const search = new URLSearchParams();
    if (p.group) search.set('group', p.group);
    if (p.line) search.set('line', p.line);
    if (p.collection) search.set('collection', p.collection);
    if (p.q) search.set('q', p.q);
    const suffix = search.toString();
    return suffix ? `/san-pham-tra?${suffix}` : '/san-pham-tra';
};

const SORT_OPTIONS = [
    {id: 'default', label: 'Mặc định'},
    {id: 'best-seller', label: 'Bán chạy nhất'},
    {id: 'newest', label: 'Hàng mới'},
    {id: 'price-asc', label: 'Giá tăng dần'},
    {id: 'price-desc', label: 'Giá giảm dần'},
] as const;

type SortId = (typeof SORT_OPTIONS)[number]['id'];

type ProductPaginationProps = {
    currentPage: number;
    totalPages: number;
    onChange: (page: number) => void;
};

const ProductPagination = ({currentPage, totalPages, onChange}: ProductPaginationProps) => {
    const safeTotalPages = Math.max(1, Math.floor(totalPages));
    const safeCurrentPage = Math.min(Math.max(1, Math.floor(currentPage)), safeTotalPages);

    if (safeTotalPages <= 1) return null;

    const pages: (number | '...')[] = [];
    if (safeTotalPages <= 7) {
        for (let page = 1; page <= safeTotalPages; page += 1) pages.push(page);
    } else {
        pages.push(1);
        if (safeCurrentPage > 3) pages.push('...');
        for (
            let page = Math.max(2, safeCurrentPage - 1);
            page <= Math.min(safeTotalPages - 1, safeCurrentPage + 1);
            page += 1
        ) {
            pages.push(page);
        }
        if (safeCurrentPage < safeTotalPages - 2) pages.push('...');
        pages.push(safeTotalPages);
    }

    const goToPage = (page: number) => {
        onChange(Math.min(Math.max(1, page), safeTotalPages));
    };

    const btnBase = 'h-11 w-11 rounded border text-sm font-medium transition-colors duration-200';
    const active = 'border-[#7F9635] bg-[#7F9635] text-white font-bold';
    const inactive = 'border-[#3B5518]/45 text-[#3B5518] hover:bg-[#7F9635]/20';
    const disabled = 'border-[#3B5518]/15 text-[#3B5518]/30';

    return (
        <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Phân trang sản phẩm">
            <button
                type="button"
                disabled={safeCurrentPage === 1}
                onClick={() => goToPage(safeCurrentPage - 1)}
                className={`${btnBase} ${safeCurrentPage === 1 ? disabled : inactive}`}
                aria-label="Trang trước"
            >
                {'<'}
            </button>

            {pages.map((page, index) =>
                page === '...' ? (
                    <span
                        key={`dots-${index}`}
                        className="flex h-11 w-11 items-center justify-center text-[#3B5518]/50"
                    >
                        ...
                    </span>
                ) : (
                    <button
                        key={page}
                        type="button"
                        onClick={() => goToPage(page)}
                        aria-current={page === safeCurrentPage ? 'page' : undefined}
                        className={`${btnBase} ${page === safeCurrentPage ? active : inactive}`}
                    >
                        {page}
                    </button>
                ),
            )}

            <button
                type="button"
                disabled={safeCurrentPage === safeTotalPages}
                onClick={() => goToPage(safeCurrentPage + 1)}
                className={`${btnBase} ${safeCurrentPage === safeTotalPages ? disabled : inactive}`}
                aria-label="Trang sau"
            >
                {'>'}
            </button>
        </nav>
    );
};

type DisplayItem =
    | {kind: 'line'; line: ProductLine}
    | {kind: 'gift'; gift: GiftProduct};

function priceLabel(min: number, max: number): string {
    return min === max ? formatVndDesign(min) : `${formatVndDesign(min)} - ${formatVndDesign(max)}`;
}

// Cache phiên SPA: dữ liệu tải 1 lần rồi lọc ở client, chuyển tab hiện ngay
// không gọi API thừa, không còn cảnh sidebar lẫn lưới cùng hiện "Đang tải..."
// mỗi lần chuyển nhóm.
let cachedProducts: Product[] | null = null;

const PageContent = () => {
    const {t, locale} = useLanguage();
    const localizePath = (path: string) => (locale === 'en' ? `/en${path === '/' ? '' : path}` : path);
    const searchParams = useSearchParams();
    const {groups} = useTeaGroups();
    // State điều hướng: khởi tạo từ URL, là nguồn sự thật duy nhất của lưới.
    // Bấm tab trong trang -> applyNavParams đổi state ngay (lưới CSR thuần) +
    // pushState đổi URL (chia sẻ link / back-forward vẫn đúng), không qua
    // router nên không còn chuyện link mềm tới địa chỉ trơn đứng yên.
    const [navParams, setNavParams] = React.useState<NavParams>(() => readNavParams((key) => searchParams.get(key)));
    // Đồng bộ khi URL đổi từ bên ngoài (mega menu / header search qua router):
    // điều chỉnh state trong lúc render theo pattern derived state của React
    // (không setState trong effect để khỏi vi phạm lint set-state-in-effect).
    const spString = searchParams.toString();
    const [prevSpString, setPrevSpString] = React.useState(spString);
    if (spString !== prevSpString) {
        setPrevSpString(spString);
        const fromUrl = readNavParams((key) => searchParams.get(key));
        if (navParamsToString(fromUrl) !== navParamsToString(navParams)) {
            setNavParams(fromUrl);
        }
    }
    React.useEffect(() => {
        const onPopState = () => {
            const fromUrl = readNavParams((key) => new URLSearchParams(window.location.search).get(key));
            setNavParams((prev) => (navParamsToString(prev) === navParamsToString(fromUrl) ? prev : fromUrl));
        };
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);
    const applyNavParams = (next: NavParams) => {
        setNavParams((prev) => (navParamsToString(prev) === navParamsToString(next) ? prev : next));
        const url = navParamsToUrl(next);
        const targetUrl = locale === 'en' ? (url.startsWith('/en') ? url : `/en${url}`) : url;
        if (window.location.pathname + window.location.search !== targetUrl) {
            window.history.pushState(null, '', targetUrl);
        }
    };
    const [products, setProducts] = React.useState<Product[]>(() => cachedProducts ?? []);
    const [loading, setLoading] = React.useState(() => cachedProducts === null);
    // Số đã bán theo id sản phẩm (BE 30/10/2026). Tải nền, lỗi thì map rỗng
    // (Bán chạy nhất giữ thứ tự cũ, không chặn lưới).
    const [soldCounts, setSoldCounts] = React.useState<Record<number, number>>({});
    React.useEffect(() => {
        let cancelled = false;
        getSoldCountsAPI()
            .then((res) => {
                if (cancelled) return;
                const list = unwrapApiData<SoldCount[]>(res);
                const map: Record<number, number> = {};
                (Array.isArray(list) ? list : []).forEach((row) => {
                    if (typeof row.productId === 'number') map[row.productId] = Number(row.soldCount ?? 0);
                });
                setSoldCounts(map);
            })
            .catch(() => {
                /* BE chưa deploy endpoint doanh số: giữ map rỗng. */
            });
        return () => {
            cancelled = true;
        };
    }, []);

    // Bộ lọc lấy từ state navParams (khởi tạo từ URL, đồng bộ 2 chiều với URL).
    const query = navParams.q;
    const groupParam = navParams.group as TeaGroupId | null;
    const group: TeaGroupId | null = groups.some((g) => g.id === groupParam) ? groupParam : null;
    const activeLineKey = navParams.line;
    const activeCollection = navParams.collection;
    const [selectedPrices, setSelectedPrices] = React.useState<string[]>([]);
    const [sort, setSort] = React.useState<SortId>('default');
    const [currentPage, setCurrentPage] = React.useState(1);
    const [filtersOpen, setFiltersOpen] = React.useState(false);
    // PC (rộng từ 1024px) phân trang 9 sản phẩm/trang cho vừa lưới 3 cột x 3 hàng;
    // màn hình hẹp giữ 8 như trước.
    const [isDesktop, setIsDesktop] = React.useState(false);
    React.useEffect(() => {
        const check = () => setIsDesktop(window.innerWidth >= 1024);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);
    const pageSize = isDesktop ? PAGE_SIZE_DESKTOP : PAGE_SIZE_MOBILE;
    // Ô tìm kiếm trong sidebar theo đúng design: gõ rồi Enter mới tìm.
    const [sidebarQuery, setSidebarQuery] = React.useState(query);

    // Đổi tab/tìm kiếm thì reset state lọc (ngữ nghĩa cũ của remount theo key),
    // nhưng component vẫn mounted nên không tải lại trang, không mất cache.
    // Reset trong lúc render (derived state), không dùng effect.
    const paramsKey = navParamsToString(navParams);
    const [prevParamsKey, setPrevParamsKey] = React.useState(paramsKey);
    if (paramsKey !== prevParamsKey) {
        setPrevParamsKey(paramsKey);
        setSelectedPrices([]);
        setSort('default');
        setCurrentPage(1);
        setSidebarQuery(navParams.q);
    }
    const buildListUrl = (params: {group?: string | null; line?: string | null; collection?: string | null; q?: string | null}) => {
        const search = new URLSearchParams();
        if (params.group) search.set('group', params.group);
        if (params.line) search.set('line', params.line);
        if (params.collection) search.set('collection', params.collection);
        if (params.q) search.set('q', params.q);
        const suffix = search.toString();
        const base = locale === 'en' ? '/en/san-pham-tra' : '/san-pham-tra';
        return suffix ? `${base}?${suffix}` : base;
    };

    React.useEffect(() => {
        let cancelled = false;
        const silent = cachedProducts !== null;
        (async () => {
            if (!silent) setLoading(true);
            try {
                // Lấy hết biến thể (hiện ~40 sản phẩm) để gom dòng + lọc giá/gram ở client.
                const all: Product[] = [];
                let pageIndex = 1;
                let totalPages = 1;
                while (pageIndex <= totalPages && pageIndex <= 5) {
                    const res = await withTimeout(
                        getProductsPagingAPI({pageIndex, pageSize: 100, isActive: true} as any),
                        10000,
                    );
                    const paging = unwrapPagingData<Product>(res);
                    all.push(...paging.data.filter((product) => product.isActive !== false));
                    totalPages = Math.max(1, paging.totalPages || 1);
                    pageIndex += 1;
                }
                if (cancelled) return;
                cachedProducts = all;
                setProducts(all);
            } catch {
                // Đã có cache thì giữ dữ liệu cũ, chỉ tải nền thất bại thì thôi.
                if (!cancelled && !silent) {
                    setProducts([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const lines = React.useMemo(
        () => groupProductsIntoLines(products, groups),
        [products, groups],
    );

    // Set quà tặng lấy từ API (Product.isGiftSet), không còn dùng dữ liệu mẫu cấu hình tạm.
    const apiGifts = React.useMemo(() => giftsFromApiProducts(products), [products]);


    const filteredLines: ProductLine[] = React.useMemo(() => {
        let result = group ? lines.filter((line) => line.groupId === group) : lines;
        if (activeLineKey && group) result = result.filter((line) => line.key === activeLineKey);
        if (query) result = result.filter((line) => lineMatchesSearch(line, query));
        const ranges = PRICE_RANGES.filter((range) => selectedPrices.includes(range.id));
        if (ranges.length > 0) {
            result = result.filter((line) =>
                line.variants.some((variant) => priceInRanges(Number(variant.price ?? 0), ranges)),
            );
        }
        return result;
    }, [lines, group, activeLineKey, query, selectedPrices]);

    const filteredGifts: GiftProduct[] = React.useMemo(() => {
        if (group && group !== 'set-qua-tang') return [];
        let result = apiGifts;
        if (group === 'set-qua-tang' && activeCollection) {
            result = result.filter((gift) => gift.collectionId === activeCollection);
        }
        if (query) {
            const q = normalizeSearchText(query);
            result = result.filter((gift) =>
                normalizeSearchText(
                    `${gift.name} ${gift.packaging} ${gift.description} ${GIFT_COLLECTIONS.find((c) => c.id === gift.collectionId)?.name ?? ''}`,
                ).includes(q),
            );
        }
        const ranges = PRICE_RANGES.filter((range) => selectedPrices.includes(range.id));
        if (ranges.length > 0) {
            result = result.filter(
                (gift) => priceInRanges(gift.priceMin, ranges) || priceInRanges(gift.priceMax, ranges),
            );
        }
        return result;
    }, [apiGifts, group, activeCollection, query, selectedPrices]);

    const allItems: DisplayItem[] = React.useMemo(() => {
        const lineItems: DisplayItem[] = filteredLines.map((line) => ({kind: 'line' as const, line}));
        const giftItems: DisplayItem[] = filteredGifts.map((gift) => ({kind: 'gift' as const, gift}));
        const combined = group === 'set-qua-tang' ? giftItems : [...lineItems, ...giftItems];
        const sorted = [...combined];
        switch (sort) {
            case 'price-asc':
                sorted.sort((a, b) => {
                    const pa = a.kind === 'line' ? a.line.minPrice : a.gift.priceMin;
                    const pb = b.kind === 'line' ? b.line.minPrice : b.gift.priceMin;
                    return pa - pb;
                });
                break;
            case 'price-desc':
                sorted.sort((a, b) => {
                    const pa = a.kind === 'line' ? a.line.maxPrice : a.gift.priceMax;
                    const pb = b.kind === 'line' ? b.line.maxPrice : b.gift.priceMax;
                    return pb - pa;
                });
                break;
            case 'newest':
                sorted.sort((a, b) => {
                    const da = a.kind === 'line' ? a.line.createdDate ?? '' : '';
                    const db = b.kind === 'line' ? b.line.createdDate ?? '' : '';
                    return db.localeCompare(da);
                });
                break;
            case 'best-seller': {
                // Bán chạy nhất thật theo số đã bán (BE 30/10/2026): dòng trà
                // cộng dồn các biến thể, set quà lấy số của chính nó. Chưa có
                // dữ liệu doanh số thì mọi số đều 0 nên giữ thứ tự mặc định.
                const soldOf = (item: DisplayItem) =>
                    item.kind === 'line'
                        ? item.line.variants.reduce((sum, v) => sum + (soldCounts[v.id ?? -1] ?? 0), 0)
                        : (soldCounts[item.gift.apiId ?? -1] ?? 0);
                sorted.sort((a, b) => soldOf(b) - soldOf(a));
                break;
            }
            default:
                // Khi có từ khóa tìm kiếm, đưa kết quả khớp đúng cụm từ trong tên
                // lên trước (ví dụ tìm "Huyền Nhất" thì set Huyền Nhất lên đầu,
                // các sản phẩm chỉ khớp rời rạc từng từ trong mô tả xếp sau).
                if (query) {
                    const phrase = normalizeSearchText(query);
                    const score = (item: DisplayItem) => {
                        const name = item.kind === 'line' ? item.line.name : item.gift.name;
                        return normalizeSearchText(name).includes(phrase) ? 0 : 1;
                    };
                    sorted.sort((a, b) => score(a) - score(b));
                }
                break;
        }
        return sorted;
    }, [filteredLines, filteredGifts, group, sort, query, soldCounts]);

    const totalPages = Math.max(1, Math.ceil(allItems.length / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const pageItems = allItems.slice((safePage - 1) * pageSize, safePage * pageSize);



    const [priceMenuOpen, setPriceMenuOpen] = React.useState(false);
    const cyclePriceSort = () => {
        setSort(sort === 'price-asc' ? 'price-desc' : 'price-asc');
        setCurrentPage(1);
    };
    const selectPriceRange = (id: string | null) => {
        setSelectedPrices(id ? [id] : []);
        setCurrentPage(1);
        setPriceMenuOpen(false);
    };

    const getPriceRangeLabel = (id: string | null) => {
        if (!id) return t('products.allPrices', 'Tất cả các mức giá');
        if (id === '0-999') return t('products.price0To999', '0 - 999.000đ');
        if (id === '1000-2500') return t('products.price1000To2500', '1.000.000đ - 2.500.000đ');
        if (id === '2500-4000') return t('products.price2500To4000', '2.500.000đ - 4.000.000đ');
        if (id === '4000-plus') return t('products.price4000Plus', '> 4.000.000đ');
        return PRICE_RANGES.find((r) => r.id === id)?.label ?? t('products.allPrices', 'Tất cả các mức giá');
    };

    const selectedPriceLabel = selectedPrices.length > 0
        ? getPriceRangeLabel(selectedPrices[0])
        : t('products.allPrices', 'Tất cả các mức giá');

    const activeGroupData = group ? groups.find((g) => g.id === group) : null;

    const sidebar = (
        <div className="space-y-3 text-[#3B5518]">
            {/* Ô tìm kiếm trong sidebar - đúng design Figma trang list */}
            <form
                role="search"
                onSubmit={(e) => {
                    e.preventDefault();
                    applyNavParams({group, line: activeLineKey, collection: activeCollection, q: sidebarQuery.trim()});
                }}
                className="flex items-center gap-2 rounded-[5px] border border-[#7B943E]/40 bg-[#F1EEE0] px-3 py-2"
            >
                <input
                    name="q"
                    value={sidebarQuery}
                    onChange={(e) => setSidebarQuery(e.target.value)}
                    placeholder={t('nav.searchPlaceholder', 'Tìm kiếm sản phẩm trà')}
                    aria-label={t('nav.searchPlaceholder', 'Tìm kiếm sản phẩm trà')}
                    className="min-w-0 flex-1 bg-transparent text-sm text-[#3B5518] outline-none placeholder:text-[#3B5518]/70"
                />
                <button type="submit" aria-label="Tìm kiếm" className="shrink-0 cursor-pointer text-[#3B5518]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="11" cy="11" r="7" />
                        <line x1="21" y1="21" x2="16.5" y2="16.5" />
                    </svg>
                </button>
            </form>

            <div>
                <h2 className="px-1 text-sm font-semibold text-[#7B943E]">{t('products.teaCategories', 'Danh mục trà')}</h2>
                <ul className="mt-2 space-y-2">
                    <li>
                        <Link
                            href={localizePath('/san-pham-tra')}
                            onClick={(e) => {
                                // Ngăn router xử lý click: router từng tự ghi đè URL về
                                // ?group cũ sau khi pushState (đã kiểm chứng live), nên
                                // chuyển tab trong trang chỉ đi qua state + pushState.
                                e.preventDefault();
                                applyNavParams({group: null, line: null, collection: null, q: ''});
                            }}
                            className={`flex w-full items-center justify-between gap-2 rounded-lg px-4 py-2 text-left transition ${
                                !group ? 'bg-[#7B943E] text-white' : 'bg-[#E3DECA] hover:bg-[#7B943E]/15'
                            }`}
                        >
                            <span>
                                <span className="block font-source-serif-4 text-[20px] leading-[32px]">{t('products.allProducts', 'Tất cả sản phẩm')}</span>
                                <span className={`block text-xs font-normal ${!group ? 'text-white/80' : 'opacity-70'}`}>
                                    {loading ? t('common.loading', 'Đang tải...') : `${lines.length} ${t('teaMega.linesCount', 'dòng trà')} · ${apiGifts.length} ${t('teaMega.giftsCount', 'set quà tặng')}`}
                                </span>
                            </span>
                            <span aria-hidden className="shrink-0 text-[18px] leading-none">›</span>
                        </Link>
                    </li>
                    {groups.map((teaGroup) => {
                        const count =
                            teaGroup.id === 'set-qua-tang'
                                ? apiGifts.length
                                : lines.filter((line) => line.groupId === teaGroup.id).length;
                        const isActive = group === teaGroup.id;
                        return (
                            <li key={teaGroup.id}>
                                <Link
                                    href={localizePath(`/san-pham-tra?group=${teaGroup.id}`)}
                                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-4 py-2 text-left transition ${
                                        isActive ? 'bg-[#7B943E] text-white' : 'bg-[#E3DECA] hover:bg-[#7B943E]/15'
                                    }`}
                                >
                                    <span>
                                        <span className="block font-source-serif-4 text-[20px] leading-[32px]">
                                            {locale === 'en' && teaGroup.nameEn?.trim() ? teaGroup.nameEn : t(`teaGroups.${teaGroup.id}`, teaGroup.name)}
                                        </span>
                                        <span className={`block text-xs font-normal ${isActive ? 'text-white/80' : 'opacity-70'}`}>
                                            {loading
                                                ? t('common.loading', 'Đang tải...')
                                                : teaGroup.id === 'set-qua-tang'
                                                  ? `${count} ${t('teaMega.giftsCount', 'loại set quà tặng')}`
                                                  : count > 0
                                                    ? `${count} ${t('teaMega.linesCount', 'dòng trà')}`
                                                    : t('teaMega.updating', 'Đang cập nhật')}
                                        </span>
                                    </span>
                                    <span aria-hidden className="shrink-0 text-[18px] leading-none">›</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>

    
        </div>
    );

    return (
        <div className="relative w-full overflow-hidden bg-[#DCCFB4]">
            <AbsoluteBackground src="/images/bg-sptrapage.png" className="object-top" />
            <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 pb-12 pt-8 sm:px-6 sm:pt-10 sm:pb-14 lg:px-[50px] lg:pt-[25px] lg:pb-[80px]">
                <FadeInUp>
                    <h1 className="font-source-serif-4 text-[32px] leading-[48px] text-[#7F9635] text-center">
                        {t('products.premiumTea', 'Sản phẩm trà thượng hạng')}
                    </h1>
                </FadeInUp>

                <div className="mt-6 lg:hidden">
                    <button
                        type="button"
                        onClick={() => setFiltersOpen((v) => !v)}
                        aria-expanded={filtersOpen}
                        className="w-full rounded-full bg-[#3B5518] py-2.5 text-sm font-semibold text-white"
                    >
                        {filtersOpen ? t('products.hideFilter', 'Ẩn bộ lọc') : t('products.showFilter', 'Bộ lọc · Danh mục trà / Giá')}
                    </button>
                    {filtersOpen && <div className="mt-3">{sidebar}</div>}
                </div>

                <div className="mt-6 flex flex-col gap-6 lg:mt-8 lg:flex-row lg:items-start">
                    <aside className="hidden w-[280px] shrink-0 lg:sticky lg:top-[76px] lg:block">{sidebar}</aside>

                    <div className="min-w-0 flex-1">
                        {/* Tiêu đề nhóm / kết quả tìm kiếm trong cột chính - đúng design */}
                        {activeGroupData && (
                            <div className="mb-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h2 className="font-source-serif-4 text-[32px] leading-[48px] text-[#3B5518]">
                                        {locale === 'en' && activeGroupData.nameEn?.trim() ? activeGroupData.nameEn : t(`teaGroups.${activeGroupData.id}`, activeGroupData.name)}
                                    </h2>
                                    <span className="rounded-full bg-[#7B943E]/20 px-3 py-1 text-xs font-semibold text-[#3B5518]">
                                        {loading
                                            ? t('common.loading', 'Đang tải...')
                                            : activeGroupData.id === 'set-qua-tang'
                                              ? `${apiGifts.length} ${t('teaMega.giftsCount', 'loại set quà tặng')}`
                                              : `${lines.filter((line) => line.groupId === activeGroupData.id).length} ${t('teaMega.linesCount', 'dòng trà')}`}
                                    </span>
                                </div>
                                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#3B5518]/80">
                                    {locale === 'en' && activeGroupData.descriptionEn?.trim() ? activeGroupData.descriptionEn : t(`teaGroups.${activeGroupData.id}Desc`, activeGroupData.description)}
                                </p>
                                {activeGroupData.id === 'set-qua-tang' && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <Link
                                            href={buildListUrl({group, q: query || null})}
                                            className={`rounded-full px-4 py-1.5 text-sm transition ${
                                                !activeCollection ? 'bg-[#7B943E] font-semibold text-white' : 'bg-[#E3DECA] text-[#3B5518] hover:bg-[#7B943E]/15'
                                            }`}
                                        >
                                            {t('teaGroups.all', 'Tất cả')}
                                        </Link>
                                        {GIFT_COLLECTIONS.map((collection) => {
                                            const isActive = activeCollection === collection.id;
                                            return (
                                                <Link
                                                    key={collection.id}
                                                    href={buildListUrl({group, collection: collection.id, q: query || null})}
                                                    className={`rounded-full px-4 py-1.5 text-sm transition ${
                                                        isActive ? 'bg-[#7B943E] font-semibold text-white' : 'bg-[#E3DECA] text-[#3B5518] hover:bg-[#7B943E]/15'
                                                    }`}
                                                >
                                                    {collection.name}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                        {query && (
                            <div className="mb-4 flex flex-wrap items-center gap-3">
                                <p className="text-sm text-[#3B5518]">
                                    {loading ? t('common.loading', 'Đang tìm kiếm...') : `${t('common.viewMore', 'Tìm thấy')} ${allItems.length} ${t('products.productsCount', 'sản phẩm')} “${query}”`}
                                </p>
                                <Link
                                    href={buildListUrl({group, line: activeLineKey, collection: activeCollection})}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        applyNavParams({group, line: activeLineKey, collection: activeCollection, q: ''});
                                    }}
                                    className="rounded-full border border-[#7F9635]/50 px-4 py-1.5 text-xs font-semibold text-[#3B5518] hover:bg-white/60"
                                >
                                    {t('products.clearSearch', 'Xóa tìm kiếm')}
                                </Link>
                            </div>
                        )}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm text-[#3B5518]">
                                {loading ? t('common.loading', 'Đang tải sản phẩm...') : `${allItems.length} ${t('products.productsCount', 'sản phẩm')}`}
                            </p>
                            {/* Sắp xếp dạng chip + dropdown mức giá - đúng design */}
                            <div className="flex flex-wrap items-center gap-2 text-sm text-[#3B5518]">
                                <span className="text-sm">↑↓ {t('products.sort', 'Sắp xếp')}:</span>
                                {SORT_OPTIONS.filter((o) => o.id !== 'price-asc' && o.id !== 'price-desc').map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => {
                                            setSort(option.id);
                                            setCurrentPage(1);
                                        }}
                                        className={`rounded-lg px-4 py-2 text-sm transition ${
                                            sort === option.id
                                                ? 'bg-[#7B943E] font-semibold text-[#F1EEE0]'
                                                : 'text-[#3B5518] hover:bg-[#7B943E]/15'
                                        }`}
                                    >
                                        {option.id === 'default'
                                            ? t('products.sortDefault', 'Mặc định')
                                            : option.id === 'best-seller'
                                              ? t('products.sortBestSeller', 'Bán chạy nhất')
                                              : t('products.sortNewest', 'Hàng mới')}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={cyclePriceSort}
                                    aria-label="Sắp xếp theo giá, bấm để đổi chiều tăng/giảm"
                                    className={`rounded-lg px-4 py-2 text-sm transition ${
                                        sort === 'price-asc' || sort === 'price-desc'
                                            ? 'bg-[#7B943E] font-semibold text-[#F1EEE0]'
                                            : 'text-[#3B5518] hover:bg-[#7B943E]/15'
                                    }`}
                                >
                                    {sort === 'price-asc' ? `↑ ${t('products.sortPrice', 'Giá')}` : sort === 'price-desc' ? `↓ ${t('products.sortPrice', 'Giá')}` : `↕ ${t('products.sortPrice', 'Giá')}`}
                                </button>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setPriceMenuOpen((v) => !v)}
                                        aria-expanded={priceMenuOpen}
                                        className="flex items-center gap-2 rounded-lg border border-[#7F9635]/40 bg-[#F1EEE0] px-4 py-2 text-sm font-semibold text-[#3B5518] transition hover:bg-[#7B943E]/15"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                            <path d="M20.59 13.41 11 3H4v7l9.59 9.59a2 2 0 0 0 2.82 0l4.18-4.18a2 2 0 0 0 0-2.82z" />
                                            <circle cx="7.5" cy="7.5" r="1.5" />
                                        </svg>
                                        {selectedPriceLabel}
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                            <path d="M6 9l6 6 6-6" />
                                        </svg>
                                    </button>
                                    {priceMenuOpen && (
                                        <>
                                            <button
                                                type="button"
                                                aria-hidden
                                                tabIndex={-1}
                                                onClick={() => setPriceMenuOpen(false)}
                                                className="fixed inset-0 z-30 cursor-default"
                                            />
                                            <div className="seeme-menu-pop absolute right-0 z-40 mt-2 w-56 rounded-lg bg-white p-1 shadow-[0_16px_40px_rgba(47,68,19,0.25)]">
                                                <button
                                                    type="button"
                                                    onClick={() => selectPriceRange(null)}
                                                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-[#F1EEE0] ${selectedPrices.length === 0 ? 'font-semibold text-[#3B5518]' : 'text-[#3B5518]/80'}`}
                                                >
                                                    {t('products.allPrices', 'Tất cả các mức giá')}
                                                </button>
                                                {PRICE_RANGES.map((range) => (
                                                    <button
                                                        key={range.id}
                                                        type="button"
                                                        onClick={() => selectPriceRange(range.id)}
                                                        className={`w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-[#F1EEE0] ${selectedPrices.includes(range.id) ? 'font-semibold text-[#3B5518]' : 'text-[#3B5518]/80'}`}
                                                    >
                                                        {getPriceRangeLabel(range.id)}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="mt-5 grid w-full grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-6 lg:grid-cols-3 lg:gap-x-[28px] lg:gap-y-[26px]">
                                {Array.from({length: pageSize}).map((_, index) => (
                                    <div key={index} className="aspect-[0.82] animate-pulse rounded-[8px] bg-white/65" />
                                ))}
                            </div>
                        ) : pageItems.length ? (
                            <>
                                <div className="mt-5 grid w-full grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-6 lg:grid-cols-3 lg:gap-x-[28px] lg:gap-y-[26px]">
                                    {pageItems.map((item, index) => {
                                        if (item.kind === 'gift') {
                                            const gift = item.gift;
                                            return (
                                                <TeaProductCard
                                                    key={gift.slug}
                                                    href={gift.apiId ? `/san-pham-tra/${gift.apiId}` : `/san-pham-tra/${gift.slug}`}
                                                    imageSrc={getImageUrl(gift.image)}
                                                    name={locale === 'en' && gift.nameEn?.trim() ? gift.nameEn : gift.name}
                                                    price={priceLabel(gift.priceMin, gift.priceMax)}
                                                    layout="inline"
                                                    weight={
                                                        gift.minGram
                                                            ? gift.minGram === gift.maxGram
                                                                ? `${gift.minGram}g`
                                                                : `${gift.minGram}g - ${gift.maxGram}g`
                                                            : undefined
                                                    }
                                                />
                                            );
                                        }
                                        const line = item.line;
                                        const firstVariant = line.variants[0];
                                        const tag: TeaProductTag | undefined =
                                            [0, 3, 4, 7].includes(index) && safePage === 1 ? 'best-seller' : undefined;
                                        return (
                                            <TeaProductCard
                                                key={line.key}
                                                href={`/san-pham-tra/${firstVariant?.id ?? ''}`}
                                                imageSrc={getImageUrl(line.image)}
                                                name={locale === 'en' && (line.nameEn?.trim() || firstVariant?.nameEn?.trim()) ? (line.nameEn?.trim() || firstVariant?.nameEn?.trim())! : line.name}
                                                price={priceLabel(line.minPrice, line.maxPrice)}
                                                layout="inline"
                                                weight={
                                                    line.minGram
                                                        ? line.minGram === line.maxGram
                                                            ? `${line.minGram}g`
                                                            : `${line.minGram}g - ${line.maxGram}g`
                                                        : undefined
                                                }
                                                tag={tag}
                                            />
                                        );
                                    })}
                                </div>
                                <ProductPagination
                                    currentPage={safePage}
                                    totalPages={totalPages}
                                    onChange={(page) => {
                                        setCurrentPage(page);
                                        requestAnimationFrame(() => {
                                            window.scrollTo({top: 0, behavior: 'smooth'});
                                        });
                                    }}
                                />
                            </>
                        ) : (
                            <div className="mx-auto mt-8 max-w-md rounded-xl bg-[#F1EEE0] px-6 py-6 text-center text-[#3B5518]">
                                <p className="font-semibold">
                                    {group === 'pho-nhi-song' || (group === 'set-qua-tang' && filteredGifts.length === 0 && !query)
                                        ? t('teaMega.empty', 'Nhóm này đang cập nhật sản phẩm.')
                                        : t('products.notFound', 'Chưa có sản phẩm phù hợp.')}
                                </p>
                                <p className="mt-1 text-sm opacity-80">{t('products.empty', 'Thử bỏ bớt bộ lọc hoặc xem các nhóm trà khác.')}</p>
                                <Link
                                    href={localizePath('/san-pham-tra')}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        applyNavParams({group: null, line: null, collection: null, q: ''});
                                    }}
                                    className="mt-4 inline-block rounded-full bg-[#3B5518] px-5 py-2 text-sm font-semibold text-white"
                                >
                                    {t('products.viewAll', 'Xem tất cả sản phẩm')}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const PageInner = () => {
    return <PageContent />;
};

export default function Page() {
    return (
        <React.Suspense fallback={<div className="min-h-[60vh] bg-[#DCCFB4]" />}>
            <PageInner />
        </React.Suspense>
    );
}
