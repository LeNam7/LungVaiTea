'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import type {Pin, GardenBoundary} from './MapComponent';
import TeaTreeCard from '@/components/common/TeaTreeCard';
import {getFirstApiImageUrl} from '@/utils/imageUrl';
import {formatTeaCost, formatGardenCode, formatGardenDisplay, formatTeaDescription, isTeaPurchasable, isTeaContactPrice, isTeaAvailableForClient} from '@/utils/teaFields';
import {getTeasPagingAPI} from '@/api/TeaAPI';
import {getGardensPagingAPI} from '@/api/GardenAPI';
import {unwrapPagingData} from '@/api/response';
import type {Tea, Garden} from '@/types/swagger.types';
import {useLanguage} from '@/context/LanguageContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GardenWithTeas extends Garden {
    teas: Tea[];
    centerLat: number;
    centerLng: number;
    radius: number;
    /** Tổng số cây của vườn trong admin (kể cả cây đang ẩn khỏi bản đồ). */
    totalCount: number;
    /** Số cây còn có thể mua = tổng số cây trừ cây đã bán (kể cả cây đang ẩn). */
    totalAvailableCount: number;
}

const GARDEN_CLUSTER_RADIUS_METERS = 5_000;
const GARDEN_RADIUS_PADDING = 1.18;
const MIN_GARDEN_RADIUS_METERS = 320;
const MAX_GARDEN_RADIUS_METERS = 1_800;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function computeGardenCenter(teas: Tea[]): {centerLat: number; centerLng: number; radius: number} {
    const withCoords = teas.filter((t) => t.lat && t.long);
    if (!withCoords.length) return {centerLat: 0, centerLng: 0, radius: 0};

    const densestCluster = withCoords
        .map((seed) => ({
            seed,
            neighbors: withCoords.filter(
                (candidate) => haversineMeters(seed.lat!, seed.long!, candidate.lat!, candidate.long!) <= GARDEN_CLUSTER_RADIUS_METERS,
            ),
        }))
        .sort((a, b) => b.neighbors.length - a.neighbors.length)[0];
    const coreCoords = densestCluster?.neighbors.length ? densestCluster.neighbors : withCoords;
    const avgLat = coreCoords.reduce((s, t) => s + t.lat!, 0) / coreCoords.length;
    const avgLng = coreCoords.reduce((s, t) => s + t.long!, 0) / coreCoords.length;
    const distances = coreCoords
        .map((t) => haversineMeters(avgLat, avgLng, t.lat!, t.long!))
        .sort((a, b) => a - b);
    const coreEdgeDistance = distances.length ? distances[Math.max(0, Math.ceil(distances.length * 0.85) - 1)] : 0;
    const paddedRadius = Math.max(coreEdgeDistance * GARDEN_RADIUS_PADDING, MIN_GARDEN_RADIUS_METERS);
    return {centerLat: avgLat, centerLng: avgLng, radius: Math.min(paddedRadius, MAX_GARDEN_RADIUS_METERS)};
}

function getFirstImage(images: string | null | undefined): string {
    return getFirstApiImageUrl(images, '/images/bosuutaptraimg.png');
}

const TreeBadgeIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" className="text-[#7F9635]">
        <path
            d="M12 3.2c-1.5 0-2.7 1-3 2.4-1.5.1-2.8 1.4-2.8 3 0 .5.1 1 .3 1.4-1.2.5-2 1.6-2 3 0 1.8 1.4 3.2 3.2 3.2h2.7v3.4H8.5v1.6h7v-1.6h-1.9v-3.4h2.7c1.8 0 3.2-1.4 3.2-3.2 0-1.4-.8-2.5-2-3 .2-.4.3-.9.3-1.4 0-1.6-1.2-2.9-2.8-3-.3-1.4-1.5-2.4-3-2.4Z"
            fill="currentColor"
        />
    </svg>
);

// ─── Dynamic import MapComponent (no SSR) ─────────────────────────────────────

interface MapComponentProps {
    pins: Pin[];
    activePin: number;
    onPinClick: (i: number) => void;
    gardenBoundaries?: GardenBoundary[];
    activeGardenId?: number | string | null;
    flyTarget?: {lat: number; lng: number; zoom: number} | null;
    bounds?: [number, number][] | null;
    boundsKey?: number;
}

const MapComponent = dynamic<MapComponentProps>(() => import('./MapComponent'), {ssr: false});
const RECOMMENDED_PAGE_SIZE = 5;

/**
 * Hạng cây lấy từ hậu tố mã cây ("03647 - F" -> F, "01206 - A" -> A).
 * "Bạn có thể thích" xếp hạng A lên trước, còn lại giữ nguyên thứ tự.
 */
const teaGradeRank = (name?: string | null): number => {
    const m = (name ?? '').match(/-\s*([A-F])\s*$/i);
    if (!m) return 99;
    return m[1].toUpperCase().charCodeAt(0) - 65;
};
const RECOMMENDED_VISIBLE_DOTS = 5;

function getCompactRecommendedPages(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
    if (totalPages <= RECOMMENDED_VISIBLE_DOTS + 2) {
        return Array.from({length: totalPages}, (_, index) => index + 1);
    }

    const firstPage = 1;
    const lastPage = totalPages;
    const halfWindow = Math.floor(RECOMMENDED_VISIBLE_DOTS / 2);
    let startPage = Math.max(firstPage, currentPage - halfWindow);
    const endPage = Math.min(lastPage, startPage + RECOMMENDED_VISIBLE_DOTS - 1);

    if (endPage - startPage + 1 < RECOMMENDED_VISIBLE_DOTS) {
        startPage = Math.max(firstPage, endPage - RECOMMENDED_VISIBLE_DOTS + 1);
    }

    const pages: (number | 'ellipsis')[] = [];
    for (let page = startPage; page <= endPage; page += 1) pages.push(page);

    if (endPage < lastPage) {
        if (endPage < lastPage - 1) pages.push('ellipsis');
        pages.push(lastPage);
    }

    return pages;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

// ─── Page ─────────────────────────────────────────────────────────────────────

const Page = () => {
    const {t} = useLanguage();
    const [gardensWithTeas, setGardensWithTeas] = useState<GardenWithTeas[]>([]);
    const [allTeas, setAllTeas] = useState<Tea[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeGardenId, setActiveGardenId] = useState<number | null>(null);
    const [activeTeaIdx, setActiveTeaIdx] = useState<number>(-1);
    const [flyTarget, setFlyTarget] = useState<{lat: number; lng: number; zoom: number} | null>(null);
    const [mapBounds, setMapBounds] = useState<[number, number][] | null>(null);
    const [fitBoundsKey, setFitBoundsKey] = useState(0);
    const [ageFilter, setAgeFilter] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(10);
    const [recommendedPage, setRecommendedPage] = useState(1);
    const [loadError, setLoadError] = useState(false);
    const [reloadToken, setReloadToken] = useState(0);
    const [isDesktop, setIsDesktop] = useState(false);
    const [gardenScrollState, setGardenScrollState] = useState({canPrev: false, canNext: false});
    const gardenScrollRef = useRef<HTMLDivElement>(null);

    // ─── Desktop check ────────────────────────────────────────────────────────

    useEffect(() => {
        const check = () => setIsDesktop(window.innerWidth >= 1024);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    useEffect(() => {
        const scroller = gardenScrollRef.current;
        if (!scroller) return;

        const updateGardenScrollState = () => {
            const maxScrollLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
            setGardenScrollState({
                canPrev: scroller.scrollLeft > 2,
                canNext: scroller.scrollLeft < maxScrollLeft - 2,
            });
        };

        updateGardenScrollState();
        scroller.addEventListener('scroll', updateGardenScrollState, {passive: true});
        window.addEventListener('resize', updateGardenScrollState);
        const resizeObserver = new ResizeObserver(updateGardenScrollState);
        resizeObserver.observe(scroller);

        return () => {
            scroller.removeEventListener('scroll', updateGardenScrollState);
            window.removeEventListener('resize', updateGardenScrollState);
            resizeObserver.disconnect();
        };
    }, [gardensWithTeas.length, loading]);

    // ─── Fetch data ───────────────────────────────────────────────────────────

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setLoadError(false);
            try {
                const [gardenRes, teaRes] = await Promise.all([
                    getGardensPagingAPI({pageIndex: 1, pageSize: 100}) as Promise<any>,
                    getTeasPagingAPI({pageIndex: 1, pageSize: 500}) as Promise<any>,
                ]);
                const gardens = unwrapPagingData<Garden>(gardenRes).data;
                const rawTeas = unwrapPagingData<Tea>(teaRes).data;
                // Chỉ hiển thị các cây đã mở bán (có sản lượng, có giá bán hoặc thuộc diện giá liên hệ)
                const teas = rawTeas.filter(isTeaAvailableForClient);

                setAllTeas(teas);
                setRecommendedPage(1);

                const grouped: GardenWithTeas[] = gardens
                    .filter((g) => g.isActive !== false)
                    .map((g) => {
                        const gardenTeas = teas.filter((t) => t.gardenId === g.id);
                        const {centerLat, centerLng, radius} = computeGardenCenter(gardenTeas);
                        // Số liệu thẻ vườn lấy theo TỔNG cây trong admin, không theo
                        // số cây đang hiện: vườn có 47 cây mà chỉ hiện 5 cây thì thẻ
                        // vẫn ghi 47/47, khách mua 1 cây thì thành 46/47; bản đồ và
                        // sidebar vẫn chỉ hiện những cây đang mở bán.
                        const allGardenTeas = rawTeas.filter((t) => t.gardenId === g.id);
                        return {
                            ...g,
                            teas: gardenTeas,
                            centerLat,
                            centerLng,
                            radius,
                            totalCount: allGardenTeas.length,
                            totalAvailableCount: allGardenTeas.filter((t) => !t.sold).length,
                        };
                    })
                    // Ẩn hoàn toàn vườn khỏi bản đồ và thanh chọn nếu vườn đó chưa có cây nào mở bán
                    .filter((g) => g.teas.length > 0);
                setGardensWithTeas(grouped);

                // Mặc định fitBounds toàn bộ cây khi vừa load xong
                const allCoords = teas.filter((t) => t.lat && t.long).map((t) => [t.lat!, t.long!] as [number, number]);
                if (allCoords.length >= 2) {
                    setMapBounds(allCoords);
                    setFitBoundsKey(1);
                }
            } catch {
                setLoadError(true);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [reloadToken]);

    // ─── Derived state ────────────────────────────────────────────────────────

    const activeGarden = activeGardenId ? (gardensWithTeas.find((g) => g.id === activeGardenId) ?? null) : null;

    const applyAgeFilter = (teas: Tea[]) => {
        if (!ageFilter) return teas;
        return teas.filter((t) => {
            const age = t.yearOld ?? 0;
            if (ageFilter === 'lt250') return age < 250;
            if (ageFilter === '250to350') return age >= 250 && age <= 350;
            if (ageFilter === '350to500') return age > 350 && age <= 500;
            if (ageFilter === 'gt500') return age > 500;
            return true;
        });
    };

    // Cây tắt "Hiện" trong CMS thì ẩn khỏi cả sidebar lẫn bản đồ (chỉ giữ ở "Bạn có thể thích" đã lọc riêng).
    const visibleTeas = (teas: Tea[]) => teas.filter((t) => t.isActive !== false);
    const sidebarTeas = applyAgeFilter(visibleTeas(activeGarden ? activeGarden.teas : allTeas));
    const displayedSidebarTeas = isDesktop ? sidebarTeas : sidebarTeas.slice(0, visibleCount);
    const mapTeas = useMemo(() => {
        const shown = allTeas.filter((t) => t.isActive !== false);
        if (!ageFilter) return shown;
        return shown.filter((tea) => {
            const age = tea.yearOld ?? 0;
            if (ageFilter === 'lt250') return age < 250;
            if (ageFilter === '250to350') return age >= 250 && age <= 350;
            if (ageFilter === '350to500') return age > 350 && age <= 500;
            if (ageFilter === 'gt500') return age > 500;
            return true;
        });
    }, [ageFilter, allTeas]);

    const gardenNameById = useMemo(
        () => new Map(gardensWithTeas.map((garden) => [garden.id, formatGardenCode(garden)])),
        [gardensWithTeas],
    );

    const mapPins: Pin[] = useMemo(
        () =>
            mapTeas
                .filter((t) => t.lat && t.long)
                .map((t) => ({
                    lat: t.lat!,
                    lng: t.long!,
                    label: t.name ?? `Cây #${t.id}`,
                    code: t.name ?? `#${t.id}`,
                    image: getFirstImage(t.images),
                    imagesRaw: t.images,
                    price: formatTeaCost(t),
                    priceValue: t.price ?? 0,
                    volume: t.volume,
                    type: t.type,
                    yieldInfo: t.volume && t.volume > 0 ? `${t.volume.toLocaleString('vi-VN')} kg/năm` : undefined,
                    teaId: t.id,
                    gardenId: t.gardenId,
                    yearOld: t.yearOld,
                    gardenName: gardenNameById.get(t.gardenId),
                    description: t.description ? formatTeaDescription(t.description) : undefined,
                    sold: t.sold ?? false,
                    available: isTeaPurchasable(t) || isTeaContactPrice(t),
                })),
        [gardenNameById, mapTeas],
    );

    // Khoanh cả 3 vườn trên bản đồ: vườn đang chọn nét liền, các vườn còn lại nét đứt.
    const allBoundaries: GardenBoundary[] = useMemo(
        () =>
            gardensWithTeas
                .filter((g) => g.id !== undefined && g.centerLat && g.radius > 0)
                .map((g) => ({gardenId: g.id as number, lat: g.centerLat, lng: g.centerLng, radius: g.radius})),
        [gardensWithTeas],
    );

    // ─── Handlers ─────────────────────────────────────────────────────────────

    const handleGardenClick = (gardenId: number) => {
        setVisibleCount(10);
        if (activeGardenId === gardenId) {
            // Deactivate → fitBounds toàn bộ cây, không fly cứng
            setActiveGardenId(null);
            setActiveTeaIdx(-1);
            setFlyTarget(null);
            const allCoords = allTeas.filter((t) => t.lat && t.long).map((t) => [t.lat!, t.long!] as [number, number]);
            if (allCoords.length >= 2) {
                setMapBounds(allCoords);
                setFitBoundsKey((k) => k + 1);
            }
        } else {
            setActiveGardenId(gardenId);
            setActiveTeaIdx(-1);
            setMapBounds(null);
            setFlyTarget(null);
        }
    };

    const handleAgeFilterChange = (value: string) => {
        setAgeFilter((current) => (current === value ? null : value));
        setVisibleCount(10);
        setActiveTeaIdx(-1);
    };

    const handleSelectTea = (i: number) => {
        const pin = mapPins[i];
        if (!pin) {
            setActiveTeaIdx(-1);
            setFlyTarget(null);
            return;
        }

        const nextGardenId = Number(pin.gardenId ?? 0);
        setMapBounds(null);
        setFlyTarget({lat: pin.lat, lng: pin.lng, zoom: 18});
        setActiveTeaIdx(i);
        if (nextGardenId && nextGardenId !== activeGardenId) setActiveGardenId(nextGardenId);
    };

    // ─── Related teas (bottom section) ───────────────────────────────────────

    const relatedTeas = [...allTeas.filter((t) => !t.sold && t.isActive)].sort(
        (a, b) => teaGradeRank(a.name) - teaGradeRank(b.name),
    );
    const recommendedTotalPages = Math.max(1, Math.ceil(relatedTeas.length / RECOMMENDED_PAGE_SIZE));
    const safeRecommendedPage = Math.min(recommendedPage, recommendedTotalPages);
    const recommendedStart = (safeRecommendedPage - 1) * RECOMMENDED_PAGE_SIZE;
    const displayedRelatedTeas = relatedTeas.slice(recommendedStart, recommendedStart + RECOMMENDED_PAGE_SIZE);
    const recommendedPages = getCompactRecommendedPages(safeRecommendedPage, recommendedTotalPages);

    const goRecommendedPage = (direction: -1 | 1) => {
        setRecommendedPage((page) => {
            const nextPage = page + direction;
            if (nextPage < 1) return recommendedTotalPages;
            if (nextPage > recommendedTotalPages) return 1;
            return nextPage;
        });
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-[#DED1B9] text-[#3B5518]">
            <h1 className="sr-only">{t('treePage.title', 'Bộ sưu tập cây trà')}</h1>
            {loadError ? (
                <div
                    role="alert"
                    className="flex flex-col items-center justify-center gap-3 border-b border-[#c6b995] bg-[#F1E8D2] px-4 py-5 text-center sm:flex-row"
                >
                    <span>{t('treePage.loadError', 'Không thể tải dữ liệu cây trà. Vui lòng kiểm tra kết nối và thử lại.')}</span>
                    <button
                        type="button"
                        onClick={() => setReloadToken((value) => value + 1)}
                        className="rounded-lg bg-[#3B5518] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4a6820]"
                    >
                        {t('treePage.retry', 'Thử lại')}
                    </button>
                </div>
            ) : null}
            {/* Map + Sidebar */}
            <section className="relative z-0 flex flex-col overflow-hidden border-y border-[#d0c4a6] bg-[#DED1B9] lg:h-[min(760px,calc(100vh-88px))] lg:min-h-[560px] lg:flex-row">
                {/* Map area */}
                <div className="relative flex-1 overflow-hidden bg-[#F1EEE0]">
                    <div className="h-full overflow-hidden">
                        <MapComponent
                            pins={mapPins}
                            activePin={activeTeaIdx}
                            onPinClick={handleSelectTea}
                            flyTarget={flyTarget}
                            gardenBoundaries={allBoundaries}
                            activeGardenId={activeGardenId}
                            bounds={mapBounds}
                            boundsKey={fitBoundsKey}
                        />
                    </div>

                    {/* Garden carousel */}
                    <div
                        data-garden-carousel
                        className="pointer-events-none absolute bottom-5 left-0 right-0 z-[520] flex items-center px-14 sm:px-20"
                    >
                        <button
                            type="button"
                            disabled={!gardenScrollState.canPrev}
                            onClick={() => gardenScrollRef.current?.scrollBy({left: -180, behavior: 'smooth'})}
                            className="pointer-events-auto absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 shrink-0 items-center justify-center rounded-full border border-[#7B943E] bg-[#7B943E] text-2xl leading-none text-white shadow-[0_8px_18px_rgba(47,68,19,0.25)] transition hover:bg-[#6f8532] disabled:cursor-not-allowed disabled:border-[#C8CEB0] disabled:bg-[#D8DEC2] disabled:text-[#8B9573] disabled:shadow-none sm:left-8"
                            aria-label="Xem vườn phía trước"
                        >
                            ‹
                        </button>
                        <div
                            ref={gardenScrollRef}
                            className="pointer-events-auto flex flex-1 gap-3 overflow-hidden py-1 scroll-smooth"
                        >
                            {loading
                                ? Array.from({length: 4}).map((_, i) => (
                                      <div
                                          key={i}
                                          className="h-[72px] min-w-[210px] shrink-0 rounded-[5px] bg-white/70 shadow-[0_8px_18px_rgba(47,68,19,0.16)]"
                                      />
                                  ))
                                : gardensWithTeas.map((g) => (
                                      <button
                                          key={g.id}
                                          type="button"
                                          data-garden-card
                                          onClick={() => handleGardenClick(g.id!)}
                                          className={`h-[72px] min-w-[212px] shrink-0 rounded-[5px] border bg-white px-5 py-3 text-left shadow-[0_8px_18px_rgba(47,68,19,0.16)] transition ${
                                              activeGardenId === g.id
                                                  ? 'border-[#7B943E] text-[#3B5518] ring-1 ring-[#7B943E]'
                                                  : 'border-white text-[#3B5518] hover:border-[#7B943E]'
                                          }`}
                                      >
                                          <div className="line-clamp-1 text-sm font-semibold">{formatGardenDisplay(g)}</div>
                                          <div className="mt-1 text-xs opacity-85">
                                              {g.totalAvailableCount}/{g.totalCount} {t('treePage.availableToBuy', 'cây có thể mua')}
                                          </div>
                                      </button>
                                  ))}
                        </div>
                        <button
                            type="button"
                            disabled={!gardenScrollState.canNext}
                            onClick={() => gardenScrollRef.current?.scrollBy({left: 180, behavior: 'smooth'})}
                            className="pointer-events-auto absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 shrink-0 items-center justify-center rounded-full border border-[#7B943E] bg-[#7B943E] text-2xl leading-none text-white shadow-[0_8px_18px_rgba(47,68,19,0.25)] transition hover:bg-[#6f8532] disabled:cursor-not-allowed disabled:border-[#C8CEB0] disabled:bg-[#D8DEC2] disabled:text-[#8B9573] disabled:shadow-none sm:right-8"
                            aria-label="Xem vườn tiếp theo"
                        >
                            ›
                        </button>
                    </div>
                </div>

                {/* Sidebar */}
                <aside data-tea-sidebar className="flex w-full flex-col bg-[#F1EEE0] text-[#3B5518] lg:w-[390px] lg:shrink-0 lg:overflow-hidden">
                    {/* Header - mô tả + chi tiết từng vườn */}
                    <div className="shrink-0 px-5 pb-3 pt-6">
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-white/20 animate-pulse shrink-0" />
                                <div className="h-5 w-36 rounded bg-white/20 animate-pulse" />
                            </div>
                        ) : (
                            <>
                                <div className="mb-2 flex items-center gap-2">
                                    <h2 className="font-source-serif-4 text-2xl leading-tight text-[#3B5518]">
                                        {activeGarden ? formatGardenDisplay(activeGarden) : t('treePage.allGardens', 'Tất cả vườn trà')}
                                    </h2>
                                </div>
                                <p className="text-xs leading-5 text-[#496526]">
                                    {activeGarden
                                        ? (activeGarden.address ?? '')
                                        : `${gardensWithTeas.length} ${t('treePage.gardensCount', 'vườn')} · ${gardensWithTeas.reduce((sum, g) => sum + g.totalAvailableCount, 0)}/${gardensWithTeas.reduce((sum, g) => sum + g.totalCount, 0)} ${t('treePage.availableToBuy', 'cây có thể mua')}`}
                                </p>
                                {activeGarden ? (
                                    <div className="mt-3 rounded-lg bg-white/60 px-3 py-2.5">
                                        {activeGarden.description?.trim() ? (
                                            <p className="text-xs leading-5 text-[#3B5518]/90">
                                                {activeGarden.description.trim()}
                                            </p>
                                        ) : null}
                                        <p className="mt-2 text-xs text-[#6b8132]">
                                            {`${t('treePage.ageLt250', '< 250 tuổi')}: `}
                                            {activeGarden.teas.filter((t) => (t.yearOld ?? 0) < 250).length}
                                            {` · ${t('treePage.age250To350', '250–350 tuổi')}: `}
                                            {activeGarden.teas.filter((t) => (t.yearOld ?? 0) >= 250 && (t.yearOld ?? 0) <= 350).length}
                                            {` · ${t('treePage.age350To500', '350–500 tuổi')}: `}
                                            {activeGarden.teas.filter((t) => (t.yearOld ?? 0) > 350 && (t.yearOld ?? 0) <= 500).length}
                                            {` · ${t('treePage.ageGt500', '> 500 tuổi')}: `}
                                            {activeGarden.teas.filter((t) => (t.yearOld ?? 0) > 500).length}
                                            {` · ${t('treePage.totalYield', 'Tổng sản lượng')}: `}
                                            {activeGarden.teas
                                                .reduce((sum, t) => sum + (Number(t.volume ?? 0) || 0), 0)
                                                .toLocaleString('vi-VN')}
                                            {` ${t('treePage.kgPerYear', 'kg/năm')}`}
                                        </p>
                                    </div>
                                ) : null}
                            </>
                        )}
                    </div>

                    {/* Filter tuổi - nút nhỏ lại theo design (cao 32px) để tiết kiệm chỗ */}
                    <div className="flex shrink-0 flex-wrap gap-2 px-5 pb-4 pt-1">
                        {[
                            {label: t('treePage.ageFilterLt250', 'Cây < 250 tuổi'), value: 'lt250'},
                            {label: t('treePage.ageFilter250To350', 'Cây 250–350 tuổi'), value: '250to350'},
                            {label: t('treePage.ageFilter350To500', 'Cây 350–500 tuổi'), value: '350to500'},
                            {label: t('treePage.ageFilterGt500', 'Cây > 500 tuổi'), value: 'gt500'},
                        ].map((f) => (
                            <button
                                key={f.value}
                                type="button"
                                aria-pressed={ageFilter === f.value}
                                onClick={() => handleAgeFilterChange(f.value)}
                                className={`h-8 rounded-full border px-3 text-xs font-semibold transition-all ${
                                    ageFilter === f.value
                                        ? 'border-[#3B5518] bg-[#3B5518] text-[#F1EEE0]'
                                        : 'border-[#7B943E] bg-[#7B943E] text-[#F1EEE0] hover:bg-[#6b8132]'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Danh sách cây */}
                    <div className="flex-1 overflow-y-auto px-5 pb-6">
                        {loading ? (
                            Array.from({length: 6}).map((_, i) => (
                                <div
                                    key={i}
                                    className="mb-4 flex items-center gap-3 rounded-[8px] p-2"
                                >
                                    <div className="h-11 w-11 shrink-0 rounded-full bg-white/70" />
                                    <div className="flex-1 flex flex-col gap-1.5">
                                        <div className="h-3.5 w-3/4 rounded bg-white/20 animate-pulse" />
                                        <div className="h-3.5 w-1/2 rounded bg-white/20 animate-pulse" />
                                    </div>
                                </div>
                            ))
                        ) : sidebarTeas.length === 0 ? (
                            <div className="text-center opacity-50 py-8 text-sm">{t('treePage.noTreesFound', 'Không có cây trà nào')}</div>
                        ) : (
                            <div className="flex flex-col gap-1.5">
                                {displayedSidebarTeas.map((tea) => {
                                    const pinIdx = mapPins.findIndex((p) => p.teaId === tea.id);
                                    return (
                                        <button
                                            key={tea.id}
                                            type="button"
                                            data-tea-row
                                            data-tea-id={tea.id}
                                            aria-current={activeTeaIdx === pinIdx && pinIdx >= 0 ? 'true' : undefined}
                                            onClick={() => pinIdx >= 0 && handleSelectTea(pinIdx)}
                                            className={`flex w-full items-center gap-2 rounded-[8px] p-1.5 text-left transition ${
                                                tea.sold
                                                    ? 'opacity-50 cursor-default'
                                                    : activeTeaIdx === pinIdx && pinIdx >= 0
                                                      ? 'bg-white text-[#2F4413] shadow-[0_8px_18px_rgba(47,68,19,0.12)]'
                                                      : 'hover:bg-white/70'
                                            }`}
                                        >
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_5px_12px_rgba(47,68,19,0.1)]">
                                                <TreeBadgeIcon />
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="line-clamp-2 text-sm font-semibold leading-snug">
                                                    {tea.name}
                                                </p>
                                                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-[#6b8132]">
                                                    <span>#{tea.id}</span>
                                                    {tea.volume && tea.volume > 0 ? (
                                                        <span>{tea.volume.toLocaleString('vi-VN')} {t('treePage.kgPerYear', 'kg/năm')}</span>
                                                    ) : null}
                                                    {tea.type ? <span>{t('treePage.type', 'Loại')} {tea.type}</span> : null}
                                                    {tea.sold ? <span>{t('treePage.sold', 'Đã bán')}</span> : null}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                                {!isDesktop && sidebarTeas.length > visibleCount && (
                                    <button
                                        onClick={() => setVisibleCount((v) => v + 10)}
                                        className="mt-1 w-full rounded-xl border border-[#7F9635]/40 py-2.5 text-center text-xs font-semibold text-[#7F9635] transition-colors hover:bg-white/70"
                                    >
                                        {t('treePage.viewMoreRemaining', 'Xem thêm · còn {count} cây').replace('{count}', String(sidebarTeas.length - visibleCount))}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </aside>
            </section>

            {/* Recommended products */}
            <div className="bg-[#DED1B9] py-12 lg:px-8 px-3 relative">
                <div className="absolute left-2 bottom-4 opacity-20 pointer-events-none">
                    <Image
                        src="/images/Vector.png"
                        alt=""
                        width={80}
                        height={80}
                        className="w-20"
                    />
                </div>
                <div className="absolute right-2 top-4 opacity-20 pointer-events-none rotate-180">
                    <Image
                        src="/images/Vector7.png"
                        alt=""
                        width={80}
                        height={80}
                        className="w-20"
                    />
                </div>
                <div className="flex items-center justify-between mb-8">
                    <div className="flex-1" />
                    <h2 className="font-source-serif-4 text-3xl text-[#3B5518]">{t('detail.youMayLike', 'Bạn có thể thích')}</h2>
                    <div className="flex-1 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => goRecommendedPage(-1)}
                            disabled={loading || relatedTeas.length <= RECOMMENDED_PAGE_SIZE}
                            className="h-11 w-11 rounded-full border-2 border-[#3B5518] flex items-center justify-center text-[#3B5518] hover:bg-[#3B5518] hover:text-white transition-colors text-lg disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-[#3B5518]"
                            aria-label="Xem nhóm cây trước"
                        >
                            ‹
                        </button>
                        <button
                            type="button"
                            onClick={() => goRecommendedPage(1)}
                            disabled={loading || relatedTeas.length <= RECOMMENDED_PAGE_SIZE}
                            className="h-11 w-11 rounded-full border-2 border-[#3B5518] flex items-center justify-center text-[#3B5518] hover:bg-[#3B5518] hover:text-white transition-colors text-lg disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-[#3B5518]"
                            aria-label="Xem nhóm cây tiếp theo"
                        >
                            ›
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {loading
                        ? Array.from({length: 5}).map((_, i) => (
                              <div
                                  key={i}
                                  className="rounded-2xl overflow-hidden bg-[#4A6720] animate-pulse"
                              >
                                  <div className="aspect-square bg-white/20" />
                                  <div className="p-3 flex flex-col gap-2">
                                      <div className="h-3 w-1/3 rounded bg-white/20" />
                                      <div className="h-4 w-4/5 rounded bg-white/20" />
                                      <div className="h-3.5 w-2/5 rounded bg-white/20" />
                                      <div className="h-3 w-1/2 rounded bg-white/20" />
                                  </div>
                              </div>
                          ))
                        : displayedRelatedTeas.map((tea) => (
                              <TeaTreeCard
                                  key={tea.id}
                                  href={`/chi-tiet-cay-tra/${tea.id}`}
                                  imageSrc={getFirstImage(tea.images)}
                                  code={tea.name ?? `#${tea.id}`}
                                  name={tea.name ?? ''}
                                  price={formatTeaCost(tea)}
                                  yieldInfo={
                                      tea.volume && tea.volume > 0
                                          ? `${tea.volume.toLocaleString('vi-VN')} kg/năm`
                                          : undefined
                                  }
                                  teaType={tea.type}
                                  tag={tea.sold ? 'sold-out' : undefined}
                              />
                          ))}
                </div>
                {!loading && relatedTeas.length > RECOMMENDED_PAGE_SIZE && (
                    <div className="mt-5 flex justify-center gap-2">
                        {recommendedPages.map((page, index) => {
                            return page === 'ellipsis' ? (
                                <span
                                    key={`recommended-ellipsis-${index}`}
                                    className="flex h-2.5 items-center px-1 text-xs font-bold leading-none text-[#3B5518]/45"
                                    aria-hidden="true"
                                >
                                    …
                                </span>
                            ) : (
                                <button
                                    key={page}
                                    type="button"
                                    onClick={() => setRecommendedPage(page)}
                                    aria-label={`Nhóm cây gợi ý ${page}`}
                                    aria-current={page === safeRecommendedPage ? 'page' : undefined}
                                    className={`h-2.5 rounded-full transition-all ${
                                        page === safeRecommendedPage
                                            ? 'w-8 bg-[#3B5518]'
                                            : 'w-2.5 bg-[#3B5518]/35 hover:bg-[#3B5518]/60'
                                    }`}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Page;
