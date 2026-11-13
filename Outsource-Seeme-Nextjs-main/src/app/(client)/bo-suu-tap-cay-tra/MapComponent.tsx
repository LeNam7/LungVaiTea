'use client';

import {
    type ReactNode,
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {useRouter} from 'next/navigation';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {useCart} from '@/hooks/useCart';
import {TEA_SPRING_PRODUCT, isTeaContactPrice} from '@/utils/teaFields';
import {toast} from '@/utils/toast';
import {BRAND} from '@/constants/brand';
import {useLanguage} from '@/context/LanguageContext';

export interface Pin {
    lat: number;
    lng: number;
    label: string;
    code?: string;
    image?: string;
    imagesRaw?: string | null;
    price?: string;
    priceValue?: number;
    yieldInfo?: string;
    volume?: number;
    type?: string | null;
    teaId?: number | string;
    gardenId?: number | string;
    yearOld?: number;
    gardenName?: string;
    description?: string;
    sold?: boolean;
    available?: boolean;
}

export interface GardenBoundary {
    gardenId: number | string;
    lat: number;
    lng: number;
    radius: number;
    name?: string;
}

interface Props {
    pins: Pin[];
    activePin: number;
    onPinClick: (i: number) => void;
    gardenBoundaries?: GardenBoundary[];
    activeGardenId?: number | string | null;
    flyTarget?: {lat: number; lng: number; zoom: number} | null;
    bounds?: [number, number][] | null;
    boundsKey?: number;
}

const defaultCenter: [number, number] = [22.827, 104.980]; // Lùng Vài, Phương Độ, Hà Giang
const MAP_POPUP_MAX_WIDTH = 470;
const MAP_POPUP_EDGE_GAP = 14;
const MAP_POPUP_ARROW_SIZE = 16;
const MAP_POPUP_MARKER_LIFT = 50;
const MAP_POPUP_BOTTOM_RESERVED = 118;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

type ActivePoint = {x: number; y: number; pinIndex: number};

const getTeaTreeMarkerVisual = (active: boolean, sold?: boolean) => ({
    background: sold ? '#f8fafc' : active ? '#EEF2E4' : '#ffffff',
    border: sold ? '#d1d5db' : active ? '#3B5518' : '#ffffff',
    tree: sold ? '#9ca3af' : active ? '#2F4413' : '#7F9635',
    trunk: sold ? '#9ca3af' : active ? '#6B4A1F' : '#8A6A3E',
    shadow: active ? 'rgba(47,68,19,0.34)' : 'rgba(38,54,24,0.24)',
});

const markerVisualStyle = (active: boolean, sold?: boolean) => {
    const visual = getTeaTreeMarkerVisual(active, sold);
    return [
        `--marker-bg:${visual.background}`,
        `--marker-border:${visual.border}`,
        `--marker-tree:${visual.tree}`,
        `--marker-trunk:${visual.trunk}`,
        `--marker-shadow:${visual.shadow}`,
    ].join(';');
};

const createTeaTreeIconView = (active: boolean, sold?: boolean, index?: number) => {
    const size = 44;
    const dataIndex = typeof index === 'number' ? `data-map-pin-index="${index}"` : '';

    return `
        <div class="seeme-map-tree-marker ${active ? 'is-active' : ''} ${sold ? 'is-sold' : ''}" ${dataIndex} style="width:${size}px;height:${size}px;cursor:pointer;opacity:${sold ? 0.74 : 1};${markerVisualStyle(active, sold)}">
            <svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="24" cy="22" r="18" fill="var(--marker-bg)" stroke="var(--marker-border)" stroke-width="3" style="filter: drop-shadow(0 6px 8px var(--marker-shadow)); transition: fill 120ms ease, stroke 120ms ease;"/>
                <path d="M24 8c-4.6 0-8.2 3.3-8.2 7.4 0 .4 0 .8.1 1.2-3.9 1-6.7 4.2-6.7 8.1 0 4.9 4.2 8.4 9.4 8.4h10.8c5.2 0 9.4-3.5 9.4-8.4 0-3.9-2.8-7.1-6.7-8.1.1-.4.1-.8.1-1.2C32.2 11.3 28.6 8 24 8Z" fill="var(--marker-tree)" style="transition: fill 120ms ease;"/>
                <path d="M21.8 29.2h4.4v8.4h-4.4z" fill="var(--marker-trunk)" rx="1" style="transition: fill 120ms ease;"/>
                <path d="M18.5 38h11" stroke="var(--marker-trunk)" stroke-width="3" stroke-linecap="round" style="transition: stroke 120ms ease;"/>
            </svg>
        </div>
    `;
};

const InfoCard = ({pin, onClose}: {pin: Pin; onClose: () => void}) => {
    const {t, localizeHref} = useLanguage();
    const {addTea} = useCart();
    const router = useRouter();
    const teaId = Number(pin.teaId ?? 0);
    const detailHref = teaId ? localizeHref(`/chi-tiet-cay-tra/${teaId}`) : undefined;

    const addCurrentTeaToCart = () => {
        if (!teaId) {
            toast.error('Không tìm thấy mã cây trà');
            return false;
        }

        if (pin.sold) {
            toast.error('Cây trà này đã được bán');
            return false;
        }

        if (pin.available === false) {
            toast.error('Cây trà này chưa thể mua');
            return false;
        }

        addTea({
            id: teaId,
            name: pin.label,
            code: pin.code ?? `#${teaId}`,
            price: pin.priceValue ?? 0,
            images: pin.imagesRaw ?? pin.image ?? null,
            volume: pin.volume,
            type: pin.type,
            seasons: [{label: 'Vụ Xuân', variant: TEA_SPRING_PRODUCT, quantity: pin.volume ?? 0}],
            plantingYears: 1,
        });
        return true;
    };

    const handleAddToCart = () => {
        if (!addCurrentTeaToCart()) return;
        toast.success('Đã thêm cây trà vào giỏ hàng');
    };

    const handleCheckout = () => {
        if (!addCurrentTeaToCart()) return;
        router.push('/gio-hang');
    };

    const isContactPrice =
        !pin.sold &&
        (isTeaContactPrice(pin) ||
            pin.price === 'Liên hệ' ||
            Boolean(pin.price?.toLowerCase().includes('liên hệ')));

    return (
        <aside
            data-tea-map-card
            className="pointer-events-auto w-[min(470px,calc(100vw-28px))] rounded-[8px] border border-[#d7dec0] bg-white text-[#315018] shadow-[0_16px_38px_rgba(38,54,24,0.28)] overflow-hidden"
        >
            <div className="flex gap-3 p-3">
                <div className="relative h-[138px] w-[138px] shrink-0 overflow-hidden rounded-[6px] bg-[#eef2e4] max-[520px]:h-[112px] max-[520px]:w-[112px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={pin.image ?? '/images/bosuutaptraimg.png'}
                        alt={pin.label}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                            const image = event.currentTarget;
                            image.onerror = null;
                            image.src = '/images/videovechungtoiimg.png';
                        }}
                    />
                    {pin.code ? (
                        <span className="absolute right-2 top-2 rounded-[3px] bg-[#3B5518] px-2 py-1 text-[10px] font-bold text-white shadow">
                            {pin.code}
                        </span>
                    ) : null}
                    {pin.sold ? (
                        <span className="absolute bottom-2 left-2 rounded bg-gray-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {t('treePage.sold', 'Đã bán')}
                        </span>
                    ) : null}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                        {detailHref ? (
                            <a
                                data-tea-map-detail-link
                                href={detailHref}
                                className="line-clamp-2 text-[14px] font-semibold leading-snug text-[#315018] hover:text-[#7F9635] hover:underline"
                            >
                                {pin.label}
                            </a>
                        ) : (
                            <p className="line-clamp-2 text-[14px] font-semibold leading-snug text-[#315018]">
                                {pin.label}
                            </p>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Đóng thông tin cây trà"
                            className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#D8DEC2] text-[#3B5518] text-base transition hover:bg-[#EEF2E4]"
                        >
                            ×
                        </button>
                    </div>

                    <div className="mt-1 text-[22px] font-semibold leading-tight text-[#7F9635] max-[520px]:text-[18px]">
                        {isContactPrice ? (
                            <a
                                href={BRAND.zalo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 hover:underline"
                                title="Bấm để liên hệ tư vấn qua Zalo"
                            >
                                <span>{pin.price ?? 'Liên hệ'}</span>
                                <span className="text-xs font-normal text-[#1a73e8] underline">
                                    (Tư vấn Zalo)
                                </span>
                            </a>
                        ) : (
                            pin.price ?? '-'
                        )}
                    </div>

                    {pin.yieldInfo ? (
                        <div className="mt-1">
                            <span className="text-[11px] text-gray-500">{pin.yieldInfo}</span>
                        </div>
                    ) : null}

                    <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] text-gray-600 max-[520px]:hidden">
                        {pin.type ? (
                            <span className="rounded-full bg-[#DDEBAA] px-2 py-0.5 font-medium text-[#3B5518]">
                                {t('treePage.treeType', 'Loại')} {pin.type}
                            </span>
                        ) : null}
                        {pin.yearOld ? (
                            <span className="rounded-full bg-[#EEF2E4] px-2 py-0.5 text-[#3B5518]">
                                {pin.yearOld} {t('treePage.yearsOld', 'tuổi')}
                            </span>
                        ) : null}
                        {pin.gardenName ? (
                            <span className="max-w-[150px] truncate rounded-full bg-[#F1EEE0] px-2 py-0.5">
                                {pin.gardenName}
                            </span>
                        ) : null}
                    </div>

                    {pin.description ? (
                        <p className="mt-1.5 line-clamp-2 text-[11px] leading-4 text-gray-600">{pin.description}</p>
                    ) : null}

                    {detailHref ? (
                        <a
                            href={detailHref}
                            className="mt-1.5 inline-flex text-[12px] font-medium text-[#1a73e8] hover:underline"
                        >
                            {t('treePage.viewDetails', 'Xem chi tiết')} →
                        </a>
                    ) : null}
                </div>
            </div>

            <div className="flex items-center gap-2 px-3 pb-3 pt-1 border-t border-[#f0ede4] bg-[#faf9f5]">
                {isContactPrice ? (
                    <a
                        href={BRAND.zalo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-9 flex-1 flex items-center justify-center gap-1.5 rounded-[4px] bg-[#7F9635] px-3 text-sm font-semibold text-white transition hover:bg-[#6f8532]"
                    >
                        <span>{t('treeDetail.contactZalo', 'Liên hệ tư vấn (Zalo)')}</span>
                    </a>
                ) : (
                    <>
                        <button
                            type="button"
                            data-tea-map-add-cart
                            onClick={handleAddToCart}
                            disabled={pin.sold || pin.available === false}
                            className="min-h-9 flex-1 rounded-[4px] bg-[#7F9635] px-3 text-sm font-semibold text-white transition hover:bg-[#6f8532] disabled:cursor-not-allowed disabled:bg-gray-400"
                        >
                            {pin.sold ? t('treePage.sold', 'Đã bán') : pin.available === false ? t('treePage.notForSale', 'Chưa mở bán') : t('treeDetail.addToCart', 'Thêm vào giỏ hàng')}
                        </button>
                        <button
                            type="button"
                            onClick={handleCheckout}
                            disabled={pin.sold || pin.available === false}
                            className="min-h-9 rounded-[4px] border border-[#7F9635] px-3 text-sm font-semibold text-[#7F9635] transition hover:bg-[#EEF2E4] disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400"
                        >
                            {t('treeDetail.buyNow', 'Thanh toán ngay')}
                        </button>
                    </>
                )}
            </div>
        </aside>
    );
};

const EmptyMapState = ({children}: {children: ReactNode}) => (
    <div className="flex h-[520px] w-full items-center justify-center bg-[#DED1B9] px-4 text-center text-sm text-[#3B5518] md:h-[620px] lg:h-full">
        {children}
    </div>
);

const isValidBoundary = (boundary: GardenBoundary) =>
    Number.isFinite(boundary.lat) &&
    Number.isFinite(boundary.lng) &&
    Number.isFinite(boundary.radius) &&
    boundary.radius > 0;

const MapComponent = ({
    pins,
    activePin,
    onPinClick,
    gardenBoundaries,
    activeGardenId,
    flyTarget,
    bounds,
    boundsKey,
}: Props) => {
    const {t} = useLanguage();
    const mapContainerReactId = useId();
    const mapNodeRef = useRef<HTMLDivElement | null>(null);
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markersLayerRef = useRef<L.LayerGroup | null>(null);
    const boundariesLayerRef = useRef<L.LayerGroup | null>(null);
    const tileLayerRef = useRef<L.TileLayer | null>(null);
    const [mapType, setMapType] = useState<'satellite' | 'streets'>('satellite');

    const onPinClickRef = useRef(onPinClick);
    const popupCardRef = useRef<HTMLDivElement | null>(null);
    const activePointFrameRef = useRef<number | null>(null);
    const updateActivePointRef = useRef<() => void>(() => undefined);
    const prevBoundsKey = useRef<number | undefined>(undefined);
    const prevFlyTargetKey = useRef<string | null>(null);
    const prevGardenKey = useRef<string | null>(null);

    const [mapReadyToken, setMapReadyToken] = useState(0);
    const [mapError, setMapError] = useState(false);
    const [activePoint, setActivePoint] = useState<ActivePoint | null>(null);
    const [mapSize, setMapSize] = useState({width: 0, height: 0});
    const [popupSize, setPopupSize] = useState({width: MAP_POPUP_MAX_WIDTH, height: 210});

    const activePinData = activePin >= 0 ? pins[activePin] : undefined;
    const mapContainerId = useMemo(
        () => `seeme-map-${mapContainerReactId.replace(/:/g, '')}`,
        [mapContainerReactId],
    );

    useEffect(() => {
        onPinClickRef.current = onPinClick;
    }, [onPinClick]);

    const validBoundaries = useMemo(() => (gardenBoundaries ?? []).filter(isValidBoundary), [gardenBoundaries]);
    const hasMapData = pins.length > 0 || validBoundaries.length > 0;
    const solidGardenId = activeGardenId ?? (activePinData?.gardenId ?? null);

    const activeBoundary = useMemo(
        () => validBoundaries.find((b) => String(b.gardenId) === String(activeGardenId)) ?? null,
        [validBoundaries, activeGardenId],
    );
    const gardenBoundaryKey = activeBoundary
        ? `${activeBoundary.lat}:${activeBoundary.lng}:${activeBoundary.radius}`
        : null;

    // Tính toán tọa độ hiển thị cho popup neo theo vị trí của pin được chọn
    const updateActivePoint = useCallback(() => {
        const map = mapRef.current;
        if (!map || !activePinData || !Number.isFinite(activePinData.lat) || !Number.isFinite(activePinData.lng)) {
            setActivePoint(null);
            return;
        }

        try {
            const point = map.latLngToContainerPoint([activePinData.lat, activePinData.lng]);
            if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
                setActivePoint(null);
                return;
            }

            const nextPoint = {x: Math.round(point.x), y: Math.round(point.y), pinIndex: activePin};
            setActivePoint((current) =>
                current && current.x === nextPoint.x && current.y === nextPoint.y && current.pinIndex === nextPoint.pinIndex
                    ? current
                    : nextPoint,
            );
        } catch {
            setActivePoint(null);
        }
    }, [activePin, activePinData]);

    useLayoutEffect(() => {
        updateActivePointRef.current = updateActivePoint;
    }, [updateActivePoint]);

    const scheduleActivePointUpdate = useCallback((timing: 'frame' | 'microtask' = 'frame') => {
        if (activePointFrameRef.current !== null) window.cancelAnimationFrame(activePointFrameRef.current);
        const updatePoint = () => {
            activePointFrameRef.current = null;
            updateActivePointRef.current();
        };

        if (timing === 'microtask') {
            window.queueMicrotask(updatePoint);
            return;
        }

        activePointFrameRef.current = window.requestAnimationFrame(updatePoint);
    }, []);

    const updateMapSize = useCallback(() => {
        if (!mapNodeRef.current) return;
        const rect = mapNodeRef.current.getBoundingClientRect();
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);
        setMapSize((current) => (current.width === width && current.height === height ? current : {width, height}));
        mapRef.current?.invalidateSize();
    }, []);

    // ─── Khởi tạo Leaflet Map ────────────────────────────────────────────────
    useEffect(() => {
        if (!hasMapData || mapRef.current || !mapContainerRef.current) return;

        const container = mapContainerRef.current;

        try {
            // Xác định center ban đầu dựa trên pins hoặc boundaries
            let initLat = defaultCenter[0];
            let initLng = defaultCenter[1];
            if (pins.length > 0 && Number.isFinite(pins[0].lat) && Number.isFinite(pins[0].lng)) {
                initLat = pins[0].lat;
                initLng = pins[0].lng;
            } else if (validBoundaries.length > 0) {
                initLat = validBoundaries[0].lat;
                initLng = validBoundaries[0].lng;
            }

            const map = L.map(container, {
                center: [initLat, initLng],
                zoom: 15,
                minZoom: 4,
                maxZoom: 19,
                zoomControl: false,
                attributionControl: false,
            });

            // Zoom control góc trên bên phải
            L.control.zoom({position: 'topright'}).addTo(map);

            // Layer vệ tinh Esri World Imagery (ảnh vệ tinh đồi núi tự nhiên Hà Giang)
            const satelliteUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
            const streetUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

            const tileLayer = L.tileLayer(mapType === 'satellite' ? satelliteUrl : streetUrl, {
                maxZoom: 19,
                subdomains: 'abcd',
            }).addTo(map);
            tileLayerRef.current = tileLayer;

            const boundariesLayer = L.layerGroup().addTo(map);
            boundariesLayerRef.current = boundariesLayer;

            const markersLayer = L.layerGroup().addTo(map);
            markersLayerRef.current = markersLayer;

            mapRef.current = map;

            const handleMove = () => {
                scheduleActivePointUpdate();
            };

            map.on('move', handleMove);
            map.on('zoom', handleMove);
            map.on('viewreset', handleMove);

            updateMapSize();
            setMapReadyToken((t) => t + 1);

            window.setTimeout(() => {
                map.invalidateSize();
                scheduleActivePointUpdate();
            }, 150);
        } catch {
            setMapError(true);
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [hasMapData, scheduleActivePointUpdate, updateMapSize]);

    // Chuyển đổi lớp bản đồ (Vệ tinh / Bản đồ)
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        if (tileLayerRef.current) {
            map.removeLayer(tileLayerRef.current);
        }

        const satelliteUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        const streetUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

        const nextTile = L.tileLayer(mapType === 'satellite' ? satelliteUrl : streetUrl, {
            maxZoom: 19,
            subdomains: 'abcd',
        }).addTo(map);
        tileLayerRef.current = nextTile;
        nextTile.bringToBack();
    }, [mapType]);

    // ─── Render Tree Markers ────────────────────────────────────────────────
    useEffect(() => {
        const layer = markersLayerRef.current;
        if (!layer) return;

        layer.clearLayers();

        pins.forEach((pin, index) => {
            if (!Number.isFinite(pin.lat) || !Number.isFinite(pin.lng)) return;
            const isActive = index === activePin;

            const iconHtml = createTeaTreeIconView(isActive, pin.sold, index);
            const icon = L.divIcon({
                className: 'seeme-leaflet-marker-clean',
                html: iconHtml,
                iconSize: [44, 44],
                iconAnchor: [22, 40],
            });

            const marker = L.marker([pin.lat, pin.lng], {
                icon,
                zIndexOffset: isActive ? 1000 : pin.sold ? 10 : 100,
            });

            marker.on('click', (e) => {
                L.DomEvent.stopPropagation(e);
                onPinClickRef.current(index);
            });

            marker.addTo(layer);
        });

        scheduleActivePointUpdate();
    }, [pins, activePin, mapReadyToken, scheduleActivePointUpdate]);

    // ─── Render Garden Boundaries ───────────────────────────────────────────
    useEffect(() => {
        const layer = boundariesLayerRef.current;
        if (!layer) return;

        layer.clearLayers();

        validBoundaries.forEach((boundary) => {
            const isSolid = solidGardenId !== null && String(boundary.gardenId) === String(solidGardenId);

            const circle = L.circle([boundary.lat, boundary.lng], {
                radius: boundary.radius,
                color: isSolid ? '#7B943E' : '#ef4444',
                weight: isSolid ? 3 : 2,
                dashArray: isSolid ? undefined : '6, 8',
                fillColor: isSolid ? '#7B943E' : '#ef4444',
                fillOpacity: isSolid ? 0.12 : 0.04,
            });

            circle.addTo(layer);
        });
    }, [validBoundaries, solidGardenId, mapReadyToken]);

    // ─── Fit Bounds ─────────────────────────────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !bounds || bounds.length < 2) return;
        if (boundsKey === prevBoundsKey.current) return;
        prevBoundsKey.current = boundsKey;

        try {
            const latLngs = bounds.map(([lat, lng]) => [lat, lng] as [number, number]);
            map.fitBounds(latLngs, {
                paddingTopLeft: [70, 70],
                paddingBottomRight: [70, 110],
                maxZoom: 15,
                animate: true,
            });
            window.setTimeout(scheduleActivePointUpdate, 400);
        } catch {
            /* ignore */
        }
    }, [bounds, boundsKey, mapReadyToken, scheduleActivePointUpdate]);

    // ─── Focus Garden ───────────────────────────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!activeBoundary) {
            prevGardenKey.current = null;
            return;
        }
        if (!map || gardenBoundaryKey === prevGardenKey.current) return;
        prevGardenKey.current = gardenBoundaryKey;

        if (flyTarget) return;

        try {
            map.flyTo([activeBoundary.lat, activeBoundary.lng], 16, {duration: 1.2});
            window.setTimeout(scheduleActivePointUpdate, 1300);
        } catch {
            /* ignore */
        }
    }, [flyTarget, activeBoundary, gardenBoundaryKey, mapReadyToken, scheduleActivePointUpdate]);

    // ─── Fly Target (Tree selection) ────────────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!flyTarget) {
            prevFlyTargetKey.current = null;
            return;
        }
        if (!map) return;

        const flyTargetKey = `${mapReadyToken}:${flyTarget.lat}:${flyTarget.lng}:${flyTarget.zoom}`;
        if (flyTargetKey === prevFlyTargetKey.current) {
            scheduleActivePointUpdate();
            return;
        }
        prevFlyTargetKey.current = flyTargetKey;

        try {
            map.flyTo([flyTarget.lat, flyTarget.lng], Math.min(flyTarget.zoom, 17), {
                duration: 0.9,
            });
            window.setTimeout(scheduleActivePointUpdate, 950);
        } catch {
            scheduleActivePointUpdate();
        }
    }, [flyTarget, mapReadyToken, scheduleActivePointUpdate]);

    useLayoutEffect(() => {
        if (!mapRef.current || !activePinData) return;
        scheduleActivePointUpdate('microtask');
    }, [activePinData, mapReadyToken, scheduleActivePointUpdate]);

    useEffect(() => {
        if (!activePinData || !popupCardRef.current) return;

        const updatePopupSize = () => {
            if (!popupCardRef.current) return;
            const rect = popupCardRef.current.getBoundingClientRect();
            const width = Math.round(rect.width);
            const height = Math.round(rect.height);
            setPopupSize((current) =>
                current.width === width && current.height === height ? current : {width, height},
            );
        };

        updatePopupSize();
        const observer = new ResizeObserver(updatePopupSize);
        observer.observe(popupCardRef.current);
        return () => observer.disconnect();
    }, [activePinData]);

    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            updateMapSize();
            scheduleActivePointUpdate();
        });
        if (mapNodeRef.current) resizeObserver.observe(mapNodeRef.current);
        return () => resizeObserver.disconnect();
    }, [hasMapData, scheduleActivePointUpdate, updateMapSize]);

    // Layout cho popup thẻ cây trà
    const popupLayout = useMemo(() => {
        if (!activePinData || !activePoint || activePoint.pinIndex !== activePin || !mapSize.width || !mapSize.height) {
            return null;
        }

        const width = Math.min(MAP_POPUP_MAX_WIDTH, Math.max(280, mapSize.width - MAP_POPUP_EDGE_GAP * 2));
        const height = popupSize.height || 210;
        const maxLeft = Math.max(MAP_POPUP_EDGE_GAP, mapSize.width - width - MAP_POPUP_EDGE_GAP);
        const left = clamp(activePoint.x - width / 2, MAP_POPUP_EDGE_GAP, maxLeft);
        const arrowLeft = clamp(activePoint.x - left, 24, width - 24);
        const aboveTop = activePoint.y - MAP_POPUP_MARKER_LIFT - MAP_POPUP_ARROW_SIZE - height;
        const canPlaceAbove = aboveTop >= MAP_POPUP_EDGE_GAP;
        const maxTop = Math.max(MAP_POPUP_EDGE_GAP, mapSize.height - height - MAP_POPUP_BOTTOM_RESERVED);
        const top = canPlaceAbove
            ? clamp(aboveTop, MAP_POPUP_EDGE_GAP, maxTop)
            : clamp(activePoint.y + MAP_POPUP_ARROW_SIZE, MAP_POPUP_EDGE_GAP, maxTop);

        return {
            arrowLeft,
            left,
            placement: canPlaceAbove ? 'above' : 'below',
            top,
            width,
        };
    }, [activePin, activePinData, activePoint, mapSize.height, mapSize.width, popupSize.height]);

    if (!hasMapData) {
        return <EmptyMapState>{t('treePage.noCoordinates', 'Chưa có tọa độ cây trà để hiển thị bản đồ.')}</EmptyMapState>;
    }

    if (mapError) {
        return (
            <EmptyMapState>
                {t('treePage.mapLoadError', 'Không thể tải bản đồ. Bạn vẫn có thể chọn cây trà trong danh sách bên cạnh.')}
            </EmptyMapState>
        );
    }

    return (
        <div
            ref={mapNodeRef}
            data-tea-map
            className="relative h-[520px] w-full md:h-[620px] lg:h-full min-h-[500px]"
        >
            <div
                id={mapContainerId}
                ref={mapContainerRef}
                className="h-full w-full bg-[#1b2513]"
            />

            {/* Nút chuyển đổi chế độ xem Vệ tinh / Bản đồ */}
            <div className="absolute top-4 right-14 z-[400] flex overflow-hidden rounded-md bg-white/95 p-0.5 shadow-md backdrop-blur-sm border border-[#7B943E]/40 text-xs font-semibold">
                <button
                    type="button"
                    onClick={() => setMapType('satellite')}
                    className={`px-3 py-1.5 rounded transition ${
                        mapType === 'satellite'
                            ? 'bg-[#3B5518] text-white shadow-sm'
                            : 'text-[#3B5518] hover:bg-[#EEF2E4]'
                    }`}
                >
                    {t('treePage.satellite', 'Vệ tinh')}
                </button>
                <button
                    type="button"
                    onClick={() => setMapType('streets')}
                    className={`px-3 py-1.5 rounded transition ${
                        mapType === 'streets'
                            ? 'bg-[#3B5518] text-white shadow-sm'
                            : 'text-[#3B5518] hover:bg-[#EEF2E4]'
                    }`}
                >
                    {t('treePage.map', 'Bản đồ')}
                </button>
            </div>

            {/* Popup thẻ cây trà khi pin được chọn */}
            {activePinData && popupLayout ? (
                <div
                    ref={popupCardRef}
                    className="pointer-events-none absolute z-[540]"
                    style={{
                        left: popupLayout.left,
                        top: popupLayout.top,
                        width: popupLayout.width,
                    }}
                >
                    <div className="relative">
                        {popupLayout.placement === 'above' ? (
                            <span
                                aria-hidden="true"
                                className="pointer-events-none absolute top-full z-[-1] h-4 w-4 -translate-x-1/2 -translate-y-2 rotate-45 border-b border-r border-[#d7dec0] bg-white shadow-[7px_7px_13px_rgba(38,54,24,0.12)]"
                                style={{left: popupLayout.arrowLeft}}
                            />
                        ) : (
                            <span
                                aria-hidden="true"
                                className="pointer-events-none absolute bottom-full z-[-1] h-4 w-4 -translate-x-1/2 translate-y-2 rotate-45 border-l border-t border-[#d7dec0] bg-white shadow-[-7px_-7px_13px_rgba(38,54,24,0.08)]"
                                style={{left: popupLayout.arrowLeft}}
                            />
                        )}
                        <InfoCard pin={activePinData} onClose={() => onPinClick(-1)} />
                    </div>
                </div>
            ) : null}

            <style jsx global>{`
                .seeme-leaflet-marker-clean {
                    background: transparent !important;
                    border: none !important;
                }
            `}</style>
        </div>
    );
};

export default MapComponent;
