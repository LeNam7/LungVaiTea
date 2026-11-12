'use client';

import {type ReactNode, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {useRouter} from 'next/navigation';
import {useCart} from '@/hooks/useCart';
import {TEA_SPRING_PRODUCT, isTeaContactPrice} from '@/utils/teaFields';
import {toast} from '@/utils/toast';
import {BRAND} from '@/constants/brand';
import {useLanguage} from '@/context/LanguageContext';

declare global {
    interface Window {
        map4d?: any;
    }
}

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

const defaultCenter: [number, number] = [16.0471, 108.2068];
const MAP4D_ACCESS_KEY = process.env.NEXT_PUBLIC_MAP4D_ACCESS_KEY?.trim() || '';
const MAP4D_VERSION = '2.3';
const MAP_POPUP_MAX_WIDTH = 470;
const MAP_POPUP_EDGE_GAP = 14;
const MAP_POPUP_ARROW_SIZE = 16;
const MAP_POPUP_MARKER_LIFT = 50;
const MAP_POPUP_BOTTOM_RESERVED = 118;
const DEFAULT_MIN_ZOOM = 2;
const DEFAULT_MAX_ZOOM = 22;
const BOUNDARY_STROKE_COLOR = '#dc2626';
const BOUNDARY_FILL_COLOR = '#ef4444';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

type Map4dMapInstance = any;
type Map4dProjection = any;
type Map4dListener = {remove?: () => void} | null | undefined;
type Map4dOverlay =
    | {
          setIconView?: (iconView: string) => void;
          setMap?: (map: Map4dMapInstance | null) => void;
          setZIndex?: (zIndex: number) => void;
      }
    | null
    | undefined;
type MapPoint = {lat: number; lng: number};
type ActivePoint = {x: number; y: number; pinIndex: number};

let map4dSdkPromise: Promise<any> | null = null;

const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);

const toMapPoint = (lat: number, lng: number): MapPoint => ({lat, lng});

const loadMap4dSdk = () => {
    if (typeof window === 'undefined') return Promise.reject(new Error('Map4D chỉ chạy trên trình duyệt'));
    if (window.map4d) return Promise.resolve(window.map4d);
    if (map4dSdkPromise) return map4dSdkPromise;

    map4dSdkPromise = new Promise((resolve, reject) => {
        const callbackName = `seemeMap4dReady_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const script = document.createElement('script');
        const windowWithCallback = window as unknown as Record<string, () => void>;

        windowWithCallback[callbackName] = () => {
            delete windowWithCallback[callbackName];
            if (window.map4d) {
                resolve(window.map4d);
                return;
            }
            reject(new Error('Map4D SDK đã tải nhưng không khởi tạo được'));
        };

        script.src = `https://api.map4d.vn/sdk/map/js?version=${MAP4D_VERSION}&key=${MAP4D_ACCESS_KEY}&callback=${callbackName}`;
        script.async = true;
        script.defer = true;
        script.onerror = () => {
            delete windowWithCallback[callbackName];
            map4dSdkPromise = null;
            reject(new Error('Không tải được Map4D SDK'));
        };
        document.body.appendChild(script);
    });

    return map4dSdkPromise;
};

const createMap4dLatLng = (lat: number, lng: number) => {
    const LatLng = window.map4d?.LatLng;
    return LatLng ? new LatLng(lat, lng) : toMapPoint(lat, lng);
};

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
    const size = 42;
    const dataIndex = typeof index === 'number' ? `data-map-pin-index="${index}"` : '';

    return `
        <div class="seeme-map4d-marker seeme-map-tree-marker ${active ? 'is-active' : ''} ${sold ? 'is-sold' : ''}" ${dataIndex} style="width:${size}px;height:${size}px;opacity:${sold ? 0.74 : 1};${markerVisualStyle(active, sold)}">
            <svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="24" cy="22" r="18" fill="var(--marker-bg)" stroke="var(--marker-border)" stroke-width="3" style="filter: drop-shadow(0 6px 8px var(--marker-shadow)); transition: fill 120ms ease, stroke 120ms ease;"/>
                <path d="M24 8c-4.6 0-8.2 3.3-8.2 7.4 0 .4 0 .8.1 1.2-3.9 1-6.7 4.2-6.7 8.1 0 4.9 4.2 8.4 9.4 8.4h10.8c5.2 0 9.4-3.5 9.4-8.4 0-3.9-2.8-7.1-6.7-8.1.1-.4.1-.8.1-1.2C32.2 11.3 28.6 8 24 8Z" fill="var(--marker-tree)" style="transition: fill 120ms ease;"/>
                <path d="M21.8 29.2h4.4v8.4h-4.4z" fill="var(--marker-trunk)" rx="1" style="transition: fill 120ms ease;"/>
                <path d="M18.5 38h11" stroke="var(--marker-trunk)" stroke-width="3" stroke-linecap="round" style="transition: stroke 120ms ease;"/>
            </svg>
        </div>
    `;
};

// Mét tương ứng 1 pixel màn hình tại vĩ độ + mức zoom (công thức Web Mercator).
const metersPerPixelAt = (lat: number, zoom: number): number =>
    (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);

// Điểm đích cách điểm gốc một khoảng (mét) theo hướng bearing (radian) - dùng để vẽ cung tròn nét đứt.
const destinationPoint = (lat: number, lng: number, distanceMeters: number, bearing: number) => {
    const R = 6371000;
    const d = distanceMeters / R;
    const lat1 = (lat * Math.PI) / 180;
    const lng1 = (lng * Math.PI) / 180;
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(bearing));
    const lng2 = lng1 + Math.atan2(Math.sin(bearing) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
    return {lat: (lat2 * 180) / Math.PI, lng: (lng2 * 180) / Math.PI};
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
            className="pointer-events-auto w-[min(470px,calc(100vw-28px))] rounded-[6px] border border-[#d7dec0] bg-white text-[#315018] shadow-[0_16px_38px_rgba(38,54,24,0.24)]"
        >
            <div className="flex gap-3 p-2.5">
                <div className="relative h-[138px] w-[138px] shrink-0 overflow-hidden rounded-[5px] bg-[#eef2e4] max-[520px]:h-[112px] max-[520px]:w-[112px]">
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
                        <span className="absolute right-2 top-2 rounded-[3px] bg-[#3B5518] px-2 py-1 text-[10px] font-bold text-white">
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
                            className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded border border-[#D8DEC2] text-[#3B5518] transition hover:bg-[#EEF2E4]"
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
                        <div className="mt-1.5">
                            <span className="text-[10px] text-gray-500">{pin.yieldInfo}</span>
                        </div>
                    ) : null}

                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-gray-600 max-[520px]:hidden">
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
                        <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-gray-600">{pin.description}</p>
                    ) : null}

                    {detailHref ? (
                        <a
                            href={detailHref}
                            className="mt-2 inline-flex text-[13px] font-medium text-[#1a73e8] hover:underline"
                        >
                            {t('treePage.viewDetails', 'Xem chi tiết')}
                        </a>
                    ) : null}
                </div>
            </div>

            <div className="flex items-center gap-2 px-2.5 pb-2.5 pl-[150px] max-[520px]:pl-2.5">
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

const getBoundaryBounds = (boundary: GardenBoundary): [number, number][] => {
    const latDelta = boundary.radius / 111_320;
    const lngDelta = boundary.radius / (111_320 * Math.max(Math.cos((boundary.lat * Math.PI) / 180), 0.01));
    return [
        [boundary.lat - latDelta, boundary.lng - lngDelta],
        [boundary.lat + latDelta, boundary.lng + lngDelta],
    ];
};

const createBoundsFromCoordinates = (coordinates: [number, number][]): [MapPoint, MapPoint] | null => {
    const validCoordinates = coordinates.filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));
    if (!validCoordinates.length) return null;

    const lats = validCoordinates.map(([lat]) => lat);
    const lngs = validCoordinates.map(([, lng]) => lng);
    return [toMapPoint(Math.min(...lats), Math.min(...lngs)), toMapPoint(Math.max(...lats), Math.max(...lngs))];
};

const getCameraTarget = (camera: any): MapPoint | null => {
    if (!camera) return null;
    if (typeof camera.getTarget === 'function') return camera.getTarget();
    return camera.target ?? null;
};

const getCameraZoom = (camera: any): number | null => {
    if (!camera) return null;
    if (typeof camera.getZoom === 'function') {
        const zoom = Number(camera.getZoom());
        return Number.isFinite(zoom) ? zoom : null;
    }
    const zoom = Number(camera.zoom);
    return Number.isFinite(zoom) ? zoom : null;
};

const normalizeMapPoint = (point: any): MapPoint | null => {
    if (!point) return null;
    const lat = Number(point.lat);
    const lng = Number(point.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) ? {lat, lng} : null;
};

const setCameraZoom = (camera: any, zoom: number) => {
    if (!camera) return;
    if (typeof camera.setZoom === 'function') {
        camera.setZoom(zoom);
        return;
    }
    camera.zoom = zoom;
};

const getMapMinZoom = (map: Map4dMapInstance) =>
    typeof map?.getMinZoom === 'function' ? Number(map.getMinZoom()) : DEFAULT_MIN_ZOOM;

const getMapMaxZoom = (map: Map4dMapInstance) =>
    typeof map?.getMaxZoom === 'function' ? Number(map.getMaxZoom()) : DEFAULT_MAX_ZOOM;

const clearMap4dOverlays = (overlays: Map4dOverlay[]) => {
    overlays.forEach((overlay) => overlay?.setMap?.(null));
    overlays.length = 0;
};

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
    const { t } = useLanguage();
    const mapContainerReactId = useId();
    const mapNodeRef = useRef<HTMLDivElement | null>(null);
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<Map4dMapInstance | null>(null);
    const projectionRef = useRef<Map4dProjection | null>(null);
    const mapListenersRef = useRef<Map4dListener[]>([]);
    const markerRefs = useRef<Map4dOverlay[]>([]);
    // Mức zoom hiện tại (cập nhật khi camera dừng) để tính độ dài nét/gap
    // của vòng vườn nét đứt theo pixel màn hình, nhìn đều ở mọi mức zoom.
    const [mapZoom, setMapZoom] = useState<number | null>(null);
    const markerVisualStateRefs = useRef<Array<{active: boolean; sold: boolean} | null>>([]);
    const previousActivePinRef = useRef(-1);
    const circleRefs = useRef<Map4dOverlay[]>([]);
    const onPinClickRef = useRef(onPinClick);
    const popupCardRef = useRef<HTMLDivElement | null>(null);
    const activePointFrameRef = useRef<number | null>(null);
    const updateActivePointRef = useRef<() => void>(() => undefined);
    const lastTreeFocusZoomRef = useRef<number | null>(null);
    const cameraStateLockedUntilRef = useRef(0);
    const prevBoundsKey = useRef<number | undefined>(undefined);
    const prevFlyTargetKey = useRef<string | null>(null);
    const prevGardenKey = useRef<string | null>(null);
    const [mapReadyToken, setMapReadyToken] = useState(0);
    const [mapError, setMapError] = useState(false);
    const [activePoint, setActivePoint] = useState<ActivePoint | null>(null);
    const [mapSize, setMapSize] = useState({width: 0, height: 0});
    const [popupSize, setPopupSize] = useState({width: MAP_POPUP_MAX_WIDTH, height: 210});

    const activePinData = activePin >= 0 ? pins[activePin] : undefined;
    const mapContainerId = useMemo(() => `seeme-map4d-${mapContainerReactId.replace(/:/g, '')}`, [mapContainerReactId]);

    const mapOptions = useMemo(
        () => ({
            center: toMapPoint(defaultCenter[0], defaultCenter[1]),
            zoom: 6,
            minZoom: DEFAULT_MIN_ZOOM,
            maxZoom: DEFAULT_MAX_ZOOM,
            controls: false,
            cooperativeGestures: false,
        }),
        [],
    );
    const cameraStateRef = useRef<{center: MapPoint | null; zoom: number | null}>({
        center: mapOptions.center,
        zoom: mapOptions.zoom,
    });

    const writeCameraState = useCallback((center?: MapPoint | null, zoom?: number | null) => {
        const safeCenter = normalizeMapPoint(center);
        const safeZoom = Number.isFinite(Number(zoom)) ? Number(zoom) : null;

        if (safeCenter) cameraStateRef.current.center = safeCenter;
        if (safeZoom !== null) cameraStateRef.current.zoom = safeZoom;

        if (!mapNodeRef.current) return;

        const nextCenter = cameraStateRef.current.center;
        const nextZoom = cameraStateRef.current.zoom;
        if (nextZoom !== null) mapNodeRef.current.dataset.zoom = String(nextZoom);
        if (nextCenter) mapNodeRef.current.dataset.center = `${nextCenter.lat.toFixed(6)},${nextCenter.lng.toFixed(6)}`;
    }, []);

    const readCameraState = useCallback((map: Map4dMapInstance) => {
        try {
            if (typeof map?.getCamera === 'function') {
                const camera = map.getCamera();
                const center = normalizeMapPoint(getCameraTarget(camera));
                const zoom = getCameraZoom(camera);
                if (center || zoom !== null) return {center, zoom};
            }
        } catch {
            /* Camera can be unavailable while Map4D is still settling. */
        }

        return cameraStateRef.current;
    }, []);

    const updateMapSize = useCallback(() => {
        if (!mapNodeRef.current) return;
        const rect = mapNodeRef.current.getBoundingClientRect();
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);
        setMapSize((current) => (current.width === width && current.height === height ? current : {width, height}));
    }, []);

    // Không gom cụm nữa (Hải chốt 1/11/2026): mọi cây luôn là 1 marker hình
    // cây riêng ở đúng vị trí thật, ở mọi mức zoom - không còn huy hiệu số.
    // Ở zoom thấp các cây trong cùng vườn sẽ chồng nhau (vườn chỉ rộng
    // ~450m), nhưng vòng khoanh vườn giúp phân biệt 3 vườn.
    const clusters = useMemo(() => {
        const result: Array<{center: {lat: number; lng: number}; members: number[]}> = [];
        pins.forEach((pin, index) => {
            if (!Number.isFinite(pin.lat) || !Number.isFinite(pin.lng)) return;
            result.push({center: {lat: pin.lat, lng: pin.lng}, members: [index]});
        });
        return result;
    }, [pins]);

    // Vị trí hiển thị của từng pin chính là vị trí thật của cây. Popup neo theo vị trí này.
    const displayedPositions = useMemo(() => {
        const map = new Map<number, {lat: number; lng: number}>();
        clusters.forEach((cluster) => {
            cluster.members.forEach((pinIndex) => map.set(pinIndex, cluster.center));
        });
        return map;
    }, [clusters]);

    const updateActivePoint = useCallback(() => {
        const map = mapRef.current;
        if (!map || !activePinData || !Number.isFinite(activePinData.lat) || !Number.isFinite(activePinData.lng)) {
            setActivePoint(null);
            return;
        }

        if (!projectionRef.current && window.map4d?.Projection) {
            projectionRef.current = new window.map4d.Projection(map);
        }

        const displayPos = displayedPositions.get(activePin);
        const lat = displayPos?.lat ?? activePinData.lat;
        const lng = displayPos?.lng ?? activePinData.lng;
        const point = projectionRef.current?.fromLatLngToScreen(createMap4dLatLng(lat, lng));
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
    }, [activePin, activePinData, displayedPositions]);

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

    const validBoundaries = useMemo(() => (gardenBoundaries ?? []).filter(isValidBoundary), [gardenBoundaries]);
    const hasMapData = pins.length > 0 || validBoundaries.length > 0;
    // Vườn khoanh nét liền: vườn đang chọn ở sidebar, nếu không thì vườn của cây đang chọn.
    const activeBoundary = useMemo(
        () => validBoundaries.find((b) => String(b.gardenId) === String(activeGardenId)) ?? null,
        [validBoundaries, activeGardenId],
    );
    const gardenBoundaryKey = activeBoundary
        ? `${activeBoundary.lat}:${activeBoundary.lng}:${activeBoundary.radius}`
        : null;
    const solidGardenId = activeGardenId ?? (activePinData?.gardenId ?? null);

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

    const updateViewportDataset = useCallback(() => {
        const map = mapRef.current;
        if (!map) return;
        if (window.performance.now() < cameraStateLockedUntilRef.current) return;

        const {center, zoom} = readCameraState(map);
        writeCameraState(center, zoom);
    }, [readCameraState, writeCameraState]);

    useEffect(() => {
        onPinClickRef.current = onPinClick;
    }, [onPinClick]);

    const updateMarkerVisual = useCallback(
        (index: number, active: boolean) => {
            const marker = markerRefs.current[index];
            const pin = pins[index];
            if (!marker || !pin) return;

            const nextState = {active, sold: Boolean(pin.sold)};
            const currentState = markerVisualStateRefs.current[index];
            if (currentState?.active === nextState.active && currentState.sold === nextState.sold) return;

            const markerElement = mapNodeRef.current?.querySelector<HTMLElement>(
                `.seeme-map-tree-marker[data-map-pin-index="${index}"]`,
            );
            if (markerElement) {
                const visual = getTeaTreeMarkerVisual(active, pin.sold);
                markerElement.classList.toggle('is-active', active);
                markerElement.style.setProperty('--marker-bg', visual.background);
                markerElement.style.setProperty('--marker-border', visual.border);
                markerElement.style.setProperty('--marker-tree', visual.tree);
                markerElement.style.setProperty('--marker-trunk', visual.trunk);
                markerElement.style.setProperty('--marker-shadow', visual.shadow);
            } else {
                marker.setIconView?.(createTeaTreeIconView(active, pin.sold, index));
            }
            marker.setZIndex?.(active ? 1000 : pin.sold ? 10 : 100);
            markerVisualStateRefs.current[index] = nextState;
        },
        [pins],
    );

    const fitMapToCoordinates = useCallback(
        (
            map: Map4dMapInstance,
            targetCoordinates: [number, number][],
            options: {
                paddingTopLeft: [number, number];
                paddingBottomRight: [number, number];
                maxZoom: number;
                duration: number;
            },
        ) => {
            const targetBounds = createBoundsFromCoordinates(targetCoordinates);
            if (!targetBounds) return;

            const padding = {
                top: options.paddingTopLeft[1],
                left: options.paddingTopLeft[0],
                bottom: options.paddingBottomRight[1],
                right: options.paddingBottomRight[0],
            };
            const animation = {animate: true, duration: options.duration, easing: easeOutCubic};
            const nextCamera =
                typeof map.getCameraWithBounds === 'function' ? map.getCameraWithBounds(targetBounds, padding) : null;

            lastTreeFocusZoomRef.current = null;

            if (nextCamera && typeof map.moveCamera === 'function') {
                const nextZoom = getCameraZoom(nextCamera);
                const safeZoom = nextZoom !== null ? Math.min(nextZoom, options.maxZoom) : null;
                if (safeZoom !== null) setCameraZoom(nextCamera, safeZoom);
                map.moveCamera(nextCamera, animation);
                writeCameraState(getCameraTarget(nextCamera), safeZoom);
            } else if (typeof map.fitBounds === 'function') {
                map.fitBounds(targetBounds, padding, animation);
                const centerLat = (targetBounds[0].lat + targetBounds[1].lat) / 2;
                const centerLng = (targetBounds[0].lng + targetBounds[1].lng) / 2;
                writeCameraState(toMapPoint(centerLat, centerLng), null);
            }

            window.setTimeout(scheduleActivePointUpdate, options.duration + 80);
        },
        [scheduleActivePointUpdate, writeCameraState],
    );

    useEffect(() => {
        if (!hasMapData || mapRef.current || !mapContainerRef.current) return;

        let canceled = false;
        const container = mapContainerRef.current;
        const markers = markerRefs.current;
        const circles = circleRefs.current;
        setMapError(false);

        loadMap4dSdk()
            .then((map4d) => {
                if (canceled || !container) return;

                const map = new map4d.Map(container, mapOptions);
                const handleCameraChange = () => {
                    updateViewportDataset();
                    scheduleActivePointUpdate();
                };

                mapRef.current = map;
                projectionRef.current = map4d.Projection ? new map4d.Projection(map) : null;
                mapListenersRef.current = [
                    map.addListener?.('click', (args: any) => args?.marker?.onClick?.(args), {marker: true}),
                    map.addListener?.('cameraChanging', handleCameraChange),
                    map.addListener?.('idle', handleCameraChange),
                    map.addListener?.('idle', () => {
                        // Cập nhật zoom khi camera dừng để gom cụm theo màn hình.
                        // Đọc qua camera thật (map.getCamera()) như readCameraState:
                        // đọc trực tiếp từ map không đáng tin trên mọi bản SDK,
                        // kẹt ở zoom khởi tạo thì cụm không bao giờ bung ra.
                        const {zoom: z} = readCameraState(map);
                        if (z !== null) setMapZoom((cur) => (cur === z ? cur : z));
                    }),
                    map.addListener?.('boundsChanged', handleCameraChange),
                    map.addListener?.('tilesLoaded', handleCameraChange),
                ];

                updateMapSize();
                updateViewportDataset();
                setMapReadyToken((token) => token + 1);
                window.setTimeout(() => {
                    updateMapSize();
                    scheduleActivePointUpdate();
                }, 120);
            })
            .catch(() => {
                if (!canceled) setMapError(true);
            });

        return () => {
            canceled = true;
            mapListenersRef.current.forEach((listener) => listener?.remove?.());
            mapListenersRef.current = [];
            clearMap4dOverlays(markers);
            clearMap4dOverlays(circles);
            projectionRef.current = null;
            mapRef.current?.destroy?.();
            mapRef.current = null;
            container.innerHTML = '';
        };
    }, [hasMapData, mapOptions, readCameraState, scheduleActivePointUpdate, updateMapSize, updateViewportDataset]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !window.map4d?.Marker) return;

        clearMap4dOverlays(markerRefs.current);
        markerVisualStateRefs.current = [];
        previousActivePinRef.current = -1;
        clusters.forEach((cluster) => {
            cluster.members.forEach((pinIndex) => {
                const pin = pins[pinIndex];
                const pos = displayedPositions.get(pinIndex);
                if (!pin || !pos) return;
                const isActive = pinIndex === activePin;
                const marker = new window.map4d.Marker({
                    position: toMapPoint(pos.lat, pos.lng),
                    anchor: {x: 0.5, y: 1},
                    iconView: createTeaTreeIconView(isActive, pin.sold, pinIndex),
                    zIndex: pin.sold ? 10 : 100,
                    userInteractionEnabled: true,
                });
                marker.onClick = () => onPinClickRef.current(pinIndex);
                marker.setMap(map);
                markerRefs.current[pinIndex] = marker;
                markerVisualStateRefs.current[pinIndex] = {active: isActive, sold: Boolean(pin.sold)};
            });
        });
    }, [mapReadyToken, pins, clusters, displayedPositions, activePin]);

    useEffect(() => {
        const changedIndexes = new Set([previousActivePinRef.current, activePin]);
        changedIndexes.forEach((index) => {
            if (index >= 0) updateMarkerVisual(index, index === activePin);
        });
        previousActivePinRef.current = activePin;
    }, [activePin, mapReadyToken, updateMarkerVisual]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !window.map4d?.Circle) return;

        clearMap4dOverlays(circleRefs.current);
        // Khoanh cả 3 vườn: vườn đang chọn (hoặc vườn của cây đang chọn) khoanh
        // đỏ nét liền, các vườn còn lại khoanh đỏ nét đứt. Map4D Circle không
        // có nét đứt sẵn nên vòng đứt vẽ bằng các cung Polyline ngắn, độ dài
        // nét/gap tính theo pixel màn hình ở zoom hiện tại để nhìn đều ở mọi
        // mức zoom (vẽ lại khi zoom đổi).
        const zoom = mapZoom ?? 6;
        validBoundaries.forEach((boundary) => {
            const isSolid = solidGardenId !== null && String(boundary.gardenId) === String(solidGardenId);
            if (isSolid) {
                const circle = new window.map4d.Circle({
                    center: toMapPoint(boundary.lat, boundary.lng),
                    radius: boundary.radius,
                    strokeColor: BOUNDARY_STROKE_COLOR,
                    strokeWidth: 3,
                    fillColor: BOUNDARY_FILL_COLOR,
                    fillOpacity: 0,
                    zIndex: 10,
                    userInteractionEnabled: false,
                });
                circle.setMap(map);
                circleRefs.current.push(circle);
                return;
            }
            if (!window.map4d?.Polyline) return;
            const mpp = metersPerPixelAt(boundary.lat, zoom);
            const dashAngle = (16 * mpp) / boundary.radius;
            const gapAngle = (12 * mpp) / boundary.radius;
            const step = dashAngle + gapAngle;
            for (let start = 0; start < Math.PI * 2; start += step) {
                const end = Math.min(start + dashAngle, Math.PI * 2);
                const subSteps = Math.max(1, Math.ceil((end - start) / ((10 * Math.PI) / 180)));
                const path = [];
                for (let s = 0; s <= subSteps; s++) {
                    const angle = start + ((end - start) * s) / subSteps;
                    const pt = destinationPoint(boundary.lat, boundary.lng, boundary.radius, angle);
                    path.push(createMap4dLatLng(pt.lat, pt.lng));
                }
                const dash = new window.map4d.Polyline({
                    path,
                    strokeColor: BOUNDARY_STROKE_COLOR,
                    strokeWidth: 3,
                    strokeOpacity: 1,
                    zIndex: 10,
                    userInteractionEnabled: false,
                });
                dash.setMap(map);
                circleRefs.current.push(dash);
            }
        });
    }, [validBoundaries, solidGardenId, mapReadyToken, mapZoom]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !bounds || bounds.length < 2) return;
        if (boundsKey === prevBoundsKey.current) return;
        prevBoundsKey.current = boundsKey;

        fitMapToCoordinates(map, bounds, {
            paddingTopLeft: [84, 84],
            paddingBottomRight: [84, 132],
            maxZoom: 14,
            duration: 1450,
        });
    }, [bounds, boundsKey, fitMapToCoordinates, mapReadyToken]);

    useEffect(() => {
        const map = mapRef.current;
        if (!activeBoundary) {
            prevGardenKey.current = null;
            return;
        }
        if (!map || gardenBoundaryKey === prevGardenKey.current) return;
        prevGardenKey.current = gardenBoundaryKey;

        if (flyTarget) return;

        fitMapToCoordinates(map, getBoundaryBounds(activeBoundary), {
            paddingTopLeft: [82, 82],
            paddingBottomRight: [82, 136],
            maxZoom: 16,
            duration: 1380,
        });
    }, [fitMapToCoordinates, flyTarget, activeBoundary, gardenBoundaryKey, mapReadyToken]);

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

        const minZoom = getMapMinZoom(map);
        const maxZoom = getMapMaxZoom(map);
        const desiredZoom = clamp(flyTarget.zoom, minZoom, maxZoom);
        const rememberedFocusZoom = lastTreeFocusZoomRef.current;
        const currentZoom = cameraStateRef.current.zoom ?? readCameraState(map).zoom;
        const currentSafeZoom = currentZoom === null ? null : clamp(currentZoom, minZoom, maxZoom);
        const strongestKnownZoom = Math.max(rememberedFocusZoom ?? minZoom, currentSafeZoom ?? minZoom);
        const isAlreadyAtTreeZoom = currentSafeZoom !== null && currentSafeZoom >= desiredZoom - 0.15;
        const isSwitchingFocusedTree =
            (rememberedFocusZoom !== null || isAlreadyAtTreeZoom) && strongestKnownZoom >= desiredZoom - 0.15;
        const targetZoom = Math.max(strongestKnownZoom, desiredZoom);
        const target = toMapPoint(flyTarget.lat, flyTarget.lng);
        if (isSwitchingFocusedTree) {
            const duration = 520;
            cameraStateLockedUntilRef.current = window.performance.now() + duration + 140;
            map.moveCamera?.({target, zoom: targetZoom}, {animate: true, duration, easing: easeOutCubic});
            writeCameraState(target, targetZoom);
            lastTreeFocusZoomRef.current = targetZoom;
            window.setTimeout(scheduleActivePointUpdate, duration + 80);
            return;
        }

        const duration = currentSafeZoom !== null && Math.abs(targetZoom - currentSafeZoom) < 0.15 ? 680 : 860;
        cameraStateLockedUntilRef.current = window.performance.now() + duration + 140;
        map.moveCamera?.({target, zoom: targetZoom}, {animate: true, duration, easing: easeOutCubic});
        writeCameraState(target, targetZoom);
        lastTreeFocusZoomRef.current = targetZoom;
        window.setTimeout(scheduleActivePointUpdate, duration + 80);
    }, [
        flyTarget,
        mapReadyToken,
        readCameraState,
        scheduleActivePointUpdate,
        writeCameraState,
    ]);

    useLayoutEffect(() => {
        if (!mapRef.current || !activePinData) {
            return;
        }

        scheduleActivePointUpdate('microtask');
        return () => {
            if (activePointFrameRef.current !== null) {
                window.cancelAnimationFrame(activePointFrameRef.current);
                activePointFrameRef.current = null;
            }
        };
    }, [activePinData, mapReadyToken, scheduleActivePointUpdate]);

    useEffect(() => {
        if (!activePinData || !popupLayout || !popupCardRef.current) return;

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
    }, [activePinData, popupLayout]);

    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            updateMapSize();
            scheduleActivePointUpdate();
        });
        if (mapNodeRef.current) resizeObserver.observe(mapNodeRef.current);
        return () => resizeObserver.disconnect();
    }, [hasMapData, scheduleActivePointUpdate, updateMapSize]);

    useEffect(
        () => () => {
            if (activePointFrameRef.current !== null) window.cancelAnimationFrame(activePointFrameRef.current);
        },
        [],
    );

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
            data-map4d-tea-map
            className="relative h-[520px] w-full md:h-[620px] lg:h-full"
        >
            <div
                id={mapContainerId}
                ref={mapContainerRef}
                className="h-full w-full bg-[#DDEBAA]"
            />

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
                        <InfoCard
                            pin={activePinData}
                            onClose={() => onPinClick(-1)}
                        />
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default MapComponent;
