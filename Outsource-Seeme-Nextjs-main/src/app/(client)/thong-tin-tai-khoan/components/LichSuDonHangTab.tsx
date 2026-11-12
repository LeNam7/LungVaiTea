'use client';

import React from 'react';
import {useRouter} from 'next/navigation';
import {cancelOrderAPI, getOrderProductsHistoryAPI, getOrderTeasHistoryAPI} from '@/api/OrderAPI';
import {getTeaByIdAPI} from '@/api/TeaAPI';
import type {Tea} from '@/types/swagger.types';
import {unwrapApiData, unwrapListData} from '@/api/response';
import {useCart} from '@/hooks/useCart';
import {useAppSelector} from '@/store/hooks';
import {OrderProductStatus, OrderTeaStatus} from '@/types/swagger.types';
import {resolveApiImageUrl} from '@/utils/imageUrl';
import {toast} from '@/utils/toast';
import {cn} from '@/utils/cn';
import {formatTeaVolume, getTeaType, getTeaCost, TEA_SPRING_PRODUCT} from '@/utils/teaFields';
import {parseCompanyInvoice} from '@/utils/companyInvoice';
import {useLanguage} from '@/context/LanguageContext';

type MainTab = 'tea' | 'product';
type StatusFilter = 'all' | number;

const MAIN_TABS: {value: MainTab; label: string}[] = [
    {value: 'tea', label: 'Đơn hàng cây trà (trồng cây)'},
    {value: 'product', label: 'Đơn hàng sản phẩm trà'},
];

const PRODUCT_STATUS_TABS: {value: StatusFilter; label: string}[] = [
    {value: 'all', label: 'Tất cả'},
    {value: OrderProductStatus.Approved, label: 'Chờ xác nhận'},
    {value: OrderProductStatus.Processing, label: 'Đang chuẩn bị hàng'},
    {value: OrderProductStatus.Shipped, label: 'Đã giao'},
    {value: OrderProductStatus.Completed, label: 'Hoàn thành'},
    {value: OrderProductStatus.Canceled, label: 'Đã huỷ'},
];

const TEA_STATUS_TABS: {value: StatusFilter; label: string}[] = [
    {value: 'all', label: 'Tất cả'},
    {value: OrderTeaStatus.Approved, label: 'Chờ xác nhận'},
    {value: OrderTeaStatus.Processing, label: 'Đang trồng'},
    {value: OrderTeaStatus.Completed, label: 'Hoàn thành'},
    {value: OrderProductStatus.Canceled, label: 'Đã huỷ'},
];

const ORDER_PAGE_SIZE = 3;

const productStatusLabel: Record<number, string> = {
    [OrderProductStatus.Approved]: 'Chờ xác nhận',
    [OrderProductStatus.Processing]: 'Đang chuẩn bị hàng',
    [OrderProductStatus.Shipped]: 'Đã giao',
    [OrderProductStatus.Completed]: 'Hoàn thành',
    [OrderProductStatus.Canceled]: 'Đã huỷ',
};

const teaStatusLabel: Record<number, string> = {
    [OrderTeaStatus.Approved]: 'Chờ xác nhận',
    [OrderTeaStatus.Processing]: 'Đang trồng',
    [OrderTeaStatus.Completed]: 'Hoàn thành',
    [OrderProductStatus.Canceled]: 'Đã huỷ',
};

const getOrderStatusLabel = (status: number, tab: MainTab) =>
    (tab === 'tea' ? teaStatusLabel[status] : productStatusLabel[status]) ?? 'Đang xử lý';

const getValue = (source: any, keys: string[]) => {
    for (const key of keys) {
        const value = source?.[key];
        if (value !== undefined && value !== null && value !== '') return value;
    }
    return undefined;
};

const toArray = (value: unknown): any[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
};

const formatDateTime = (value?: string | null) => {
    if (!value) return '--';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;

    const time = d.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit', hour12: false}).replace(':', 'h');
    return `${time}, ${d.toLocaleDateString('vi-VN')}`;
};

const fmtMoney = (value?: number | null) => `${(value ?? 0).toLocaleString('vi-VN')} VND`;

// Chỉ chống gọi trùng khi đang bay (historyRequest), KHÔNG giữ cache kết quả:
// trạng thái đơn có thể do admin đổi sau khi khách mở tab, nên mỗi lần mở
// tab và mỗi lần cửa sổ được focus lại đều phải tải mới từ server.
let historyRequest: Promise<{teaOrders: any[]; productOrders: any[]}> | null = null;

const getDeliveryInfo = (value?: string | null) => {
    if (!value) return null;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
};

const getNumericStatus = (value: any) => {
    const status = Number(value);
    return Number.isFinite(status) ? status : null;
};

const deriveOrderStatus = (statuses: number[]): OrderProductStatus => {
    if (!statuses.length) return OrderProductStatus.Approved;
    if (statuses.every((status) => status === OrderProductStatus.Canceled)) return OrderProductStatus.Canceled;
    if (statuses.every((status) => status === OrderProductStatus.Completed)) return OrderProductStatus.Completed;
    if (statuses.some((status) => status === OrderProductStatus.Shipped)) return OrderProductStatus.Shipped;
    if (
        statuses.every((status) => status === OrderProductStatus.Processing || status === OrderProductStatus.Completed)
    ) {
        return OrderProductStatus.Processing;
    }
    return OrderProductStatus.Approved;
};

const getOrderStatus = (order: any): OrderProductStatus => {
    if (order?.reasonCancellation) return OrderProductStatus.Canceled;

    const explicitStatus = getNumericStatus(getValue(order, ['orderStatus', 'OrderStatus', 'status', 'Status']));
    if (explicitStatus !== null) return explicitStatus as OrderProductStatus;

    const statuses = ['productStatus', 'ProductStatus', 'teaStatus', 'TeaStatus']
        .map((key) => getNumericStatus(order?.[key]))
        .filter((status): status is number => status !== null);

    return deriveOrderStatus(statuses);
};

const getOrderTotal = (order: any) =>
    Number(
        getValue(order, [
            'totalPayment',
            'TotalPayment',
            'totalPrice',
            'TotalPrice',
            'totalAmount',
            'TotalAmount',
            'total',
            'Total',
            'price',
            'Price',
        ]) ?? 0,
    );

const getOrderId = (order: any) => {
    const id = Number(getValue(order, ['orderId', 'OrderId', 'id', 'Id']) ?? 0);
    return Number.isFinite(id) ? id : 0;
};

const formatOrderCode = (order: any) => {
    const code = getValue(order, ['orderCode', 'OrderCode', 'code', 'Code', 'orderNo', 'OrderNo']);
    if (code) {
        const text = String(code).trim();
        return text.startsWith('#') ? text : `#${text}`;
    }

    const id = getOrderId(order);
    return id ? `#SM${String(id).padStart(5, '0')}` : '#SM-----';
};

const getOrderItems = (order: any, tab: MainTab) => {
    const sourceKeys =
        tab === 'tea'
            ? ['teaStatuses', 'orderTeaDetails', 'teaDetails', 'orderTeas', 'teas']
            : ['productStatuses', 'orderProductDetails', 'productDetails', 'orderProducts', 'products'];

    for (const key of sourceKeys) {
        const items = toArray(order?.[key]);
        if (items.length) return items;
    }

    const orderDetails = toArray(order?.orderDetails).filter((item) => {
        const type = String(item?.type ?? item?.Type ?? '').toLowerCase();
        if (tab === 'tea') return type === 'tea' || item?.teaId || item?.TeaId;
        return type === 'product' || item?.productId || item?.ProductId;
    });
    if (orderDetails.length) return orderDetails;

    const hasSingleItem =
        tab === 'tea'
            ? getValue(order, ['teaName', 'TeaName', 'itemName', 'ItemName', 'teaId', 'TeaId'])
            : getValue(order, ['productName', 'ProductName', 'itemName', 'ItemName', 'productId', 'ProductId']);

    return hasSingleItem ? [order] : [];
};

const getItemEntity = (item: any, tab: MainTab) =>
    tab === 'tea' ? (item?.tea ?? item?.Tea) : (item?.product ?? item?.Product);

const getItemId = (item: any, tab: MainTab) => {
    const entity = getItemEntity(item, tab);
    const id =
        tab === 'tea'
            ? (getValue(item, ['teaId', 'TeaId', 'itemId', 'ItemId']) ?? getValue(entity, ['id', 'Id']))
            : (getValue(item, ['productId', 'ProductId', 'itemId', 'ItemId']) ?? getValue(entity, ['id', 'Id']));

    const numericId = Number(id ?? 0);
    return Number.isFinite(numericId) ? numericId : 0;
};

const getItemName = (item: any, tab: MainTab) => {
    const entity = getItemEntity(item, tab);
    return tab === 'tea'
        ? (getValue(item, ['teaName', 'TeaName', 'itemName', 'ItemName', 'name', 'Name']) ??
              getValue(entity, ['name', 'Name']) ??
              (getItemId(item, tab) ? `Cây trà #${getItemId(item, tab)}` : 'Cây trà'))
        : (getValue(item, ['productName', 'ProductName', 'itemName', 'ItemName', 'name', 'Name']) ??
              getValue(entity, ['name', 'Name']) ??
              (getItemId(item, tab) ? `Sản phẩm #${getItemId(item, tab)}` : 'Sản phẩm trà'));
};

const getItemQuantity = (item: any) => Number(getValue(item, ['quantity', 'Quantity']) ?? 1) || 1;
const getItemUnit = (item: any, tab: MainTab) => getValue(item, ['unit', 'Unit']) ?? (tab === 'tea' ? 'cây' : 'hộp');
const getItemPrice = (item: any) => Number(getValue(item, ['price', 'Price', 'unitPrice', 'UnitPrice']) ?? 0);
const getItemPackaging = (item: any) => getValue(item, ['packagingName', 'PackagingName']);
const getItemColorImage = (item: any) => getValue(item, ['colorImage', 'ColorImage']);
const getItemColorName = (item: any) => getValue(item, ['colorName', 'ColorName']);
const getItemTotal = (item: any) =>
    Number(
        getValue(item, ['totalPrice', 'TotalPrice', 'totalPayment', 'TotalPayment', 'total', 'Total']) ??
            getItemPrice(item) * getItemQuantity(item),
    );

const getImagePath = (images?: unknown) => {
    if (!images) return null;
    if (Array.isArray(images)) return images.map(String).find(Boolean) ?? null;
    if (typeof images !== 'string') return null;

    const trimmed = images.trim();
    if (!trimmed) return null;

    try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(String).find(Boolean) ?? null;
    } catch {
        // Fall back to comma-separated images.
    }

    return (
        trimmed
            .split(',')
            .map((item) => item.trim())
            .find(Boolean) ?? null
    );
};

const resolveImageUrl = (images: unknown, fallback: string) => {
    const first = getImagePath(images);
    return resolveApiImageUrl(first, fallback);
};

const getItemImage = (item: any, tab: MainTab) => {
    const entity = getItemEntity(item, tab);
    const raw =
        getValue(item, [
            'images',
            'Images',
            'image',
            'Image',
            'imageUrl',
            'ImageUrl',
            'thumbnail',
            'Thumbnail',
            'productImages',
            'ProductImages',
            'teaImages',
            'TeaImages',
        ]) ??
        getValue(entity, ['images', 'Images', 'image', 'Image', 'imageUrl', 'ImageUrl', 'thumbnail', 'Thumbnail']);

    // BE lịch sử đã gắn ProductImages/TeaImages vào từng chi tiết; nếu sản phẩm
    // hoặc cây đã xóa nên không tra được ảnh thì dùng ảnh màu đã chọn (set quà),
    // cuối cùng mới rơi về ảnh mặc định.
    return resolveImageUrl(raw ?? (tab === 'tea' ? null : getItemColorImage(item)), '/images/shan-tuyet-tea-tree.jpg');
};

const getAddressLine = (deliveryInfo: any) =>
    [
        deliveryInfo?.address,
        deliveryInfo?.wardName ?? deliveryInfo?.ward,
        deliveryInfo?.districtName ?? deliveryInfo?.district,
        deliveryInfo?.provinceName ?? deliveryInfo?.province,
    ]
        .filter(Boolean)
        .join(', ') || '--';

const getPaymentMethodLabel = (method?: string | null) => {
    const normalized = String(method ?? '').toLowerCase();
    if (!normalized || normalized === 'qr' || normalized.includes('bank') || normalized.includes('transfer')) {
        return 'Chuyển khoản ngân hàng';
    }
    if (normalized.includes('cod')) return 'Thanh toán khi nhận hàng';
    return method ?? '--';
};

type OrderCardProps = {
    order: any;
    tab: MainTab;
    compact?: boolean;
    onDetail?: () => void;
    onBuyAgain: () => void;
};

const OrderCard = ({order, tab, compact, onDetail, onBuyAgain}: OrderCardProps) => {
    const items = getOrderItems(order, tab);
    const visibleItems = items.length ? items : [order];
    const calculatedTotal = visibleItems.reduce((sum, item) => sum + getItemTotal(item), 0);
    const totalAmount = getOrderTotal(order) || calculatedTotal;
    const status = getOrderStatus(order);
    // Dòng thanh toán trên thẻ lịch sử: phương thức lấy từ DeliveryInformation,
    // đã/chưa thanh toán suy từ TotalPayment (lịch sử sản phẩm có field này sau đợt BE 01/11).
    const cardPaymentMethod = String(getDeliveryInfo(order?.deliveryInformation)?.paymentMethod ?? '').toLowerCase();
    const cardTotalPrice = Number(getValue(order, ['totalPrice', 'TotalPrice']) ?? 0);
    const cardTotalPayment = getValue(order, ['totalPayment', 'TotalPayment']);
    const cardPaid =
        cardTotalPayment != null && cardTotalPrice > 0 && Number(cardTotalPayment) >= cardTotalPrice;
    const paymentLine = (() => {
        if (cardPaymentMethod === 'cod') {
            return cardPaid
                ? 'Thanh toán khi nhận hàng (COD) · Đã thanh toán'
                : 'Thanh toán khi nhận hàng (COD) · Trả khi nhận hàng';
        }
        if (cardPaymentMethod === 'qr') {
            if (cardTotalPayment == null) return 'Chuyển khoản QR';
            return cardPaid ? 'Chuyển khoản QR · Đã thanh toán' : 'Chuyển khoản QR · Chờ thanh toán';
        }
        return cardPaid ? 'Đã thanh toán' : null;
    })();

    return (
        <div
            data-order-card
            className={cn(
                'w-full max-w-full overflow-hidden bg-[#7B943E] text-[#F4F0E4] rounded-lg',
                compact ? 'p-3' : 'p-3 sm:p-4',
            )}
        >
            <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold leading-tight sm:text-[15px]">
                <span>{formatOrderCode(order)}</span>
                <span className="h-3.5 w-px bg-[#F4F0E4]/70" />
                <span>{getOrderStatusLabel(status, tab)}</span>
            </div>

            <div className={cn('space-y-3', compact ? 'mt-2.5' : 'mt-3')}>
                {visibleItems.map((item, index) => (
                    <div
                        key={`${getItemId(item, tab) || index}-${index}`}
                        className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 sm:grid-cols-[82px_minmax(0,1fr)_auto] sm:items-start"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={getItemImage(item, tab)}
                            alt={String(getItemName(item, tab))}
                            className="h-[72px] w-[72px] rounded-[6px] bg-[#F4F0E4] object-cover sm:h-[82px] sm:w-[82px]"
                            onError={(event) => {
                                event.currentTarget.onerror = null;
                                event.currentTarget.src =
                                    tab === 'tea' ? '/images/shan-tuyet-tea-tree.jpg' : '/images/shan-tuyet-tea-tree.jpg';
                            }}
                        />
                        <div className="min-w-0 pt-0.5">
                            <p className="truncate font-source-serif-4 text-[17px] leading-tight text-white sm:text-lg">
                                {getItemName(item, tab)}
                            </p>
                            {tab !== 'tea' && (
                                <div className="mt-1.5 space-y-1 text-xs text-[#F4F0E4]/88 sm:text-[13px]">
                                    {getItemPackaging(item) ? (
                                        <p className="truncate">Phân loại: {getItemPackaging(item)}</p>
                                    ) : null}
                                    {getItemColorImage(item) || getItemColorName(item) ? (
                                        <p className="flex items-center gap-1.5">
                                            Màu:
                                            {getItemColorImage(item) ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img
                                                    src={resolveApiImageUrl(getItemColorImage(item))}
                                                    alt=""
                                                    className="h-7 w-7 rounded object-cover"
                                                    onError={(event) => {
                                                        event.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                            ) : null}
                                            {getItemColorName(item) ? <span>{getItemColorName(item)}</span> : null}
                                        </p>
                                    ) : null}
                                </div>
                            )}
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] leading-none sm:text-sm">
                                <span>Số lượng</span>
                                <span className="flex h-6 min-w-8 items-center justify-center rounded-[3px] bg-[#D9E5AD] px-2.5 font-semibold text-[#3B5518]">
                                    {getItemQuantity(item)}
                                </span>
                                <span>{getItemUnit(item, tab)}</span>
                            </div>
                            {tab === 'tea' && (
                                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#F4F0E4]/88">
                                    <span>Sản lượng: {formatTeaVolume(item, 'Đang cập nhật')}</span>
                                    <span>Loại cây: {getTeaType(item) || 'Đang cập nhật'}</span>
                                </div>
                            )}
                        </div>
                        <p className="col-span-2 text-right text-base font-semibold leading-tight sm:col-span-1 sm:min-w-[126px] sm:pt-1 sm:text-[17px]">
                            {fmtMoney(getItemTotal(item) || getItemPrice(item))}
                        </p>
                    </div>
                ))}
            </div>

            <div className="mt-3 border-t border-[#F4F0E4]/65 pt-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                        {onDetail && (
                            <button
                                type="button"
                                onClick={onDetail}
                                className="h-8 rounded-[5px] border border-[#F4F0E4] px-3 text-[13px] font-medium text-white transition hover:bg-white/10 sm:text-sm"
                            >
                                Xem chi tiết
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onBuyAgain}
                            className="h-8 min-w-[92px] rounded-[5px] bg-[#3B5518] px-4 text-[13px] font-semibold text-[#F4F0E4] transition hover:bg-[#2F4413] sm:text-sm"
                        >
                            Mua lại
                        </button>
                    </div>
                    <div className="flex flex-wrap items-baseline justify-end gap-3 text-right sm:gap-5">
                        <span className="font-source-serif-4 text-sm">Tổng thanh toán</span>
                        <span className="text-lg font-semibold leading-none sm:text-xl">{fmtMoney(totalAmount)}</span>
                    </div>
                    {paymentLine && (
                        <div className="mt-2 text-left text-[13px] text-[#F4F0E4]/90">
                            Thanh toán: {paymentLine}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const DetailInfoField = ({label, value, wide}: {label: string; value?: React.ReactNode; wide?: boolean}) => (
    <div className={cn(wide && 'md:col-span-2')}>
        <p className="text-xs text-[#F4F0E4]/85">{label}</p>
        <p className="mt-1 text-sm font-medium leading-relaxed text-white">{value || '--'}</p>
    </div>
);

const OrderHistorySkeleton = () => (
    <div className="space-y-3">
        {Array.from({length: 2}).map((_, index) => (
            <div
                key={index}
                className="bg-[#7F9635]/70 p-4"
            >
                <div className="h-5 w-40 rounded bg-white/20" />
                <div className="mt-4 grid grid-cols-[88px_1fr] gap-3">
                    <div className="h-[88px] rounded bg-white/20" />
                    <div>
                        <div className="h-5 w-36 rounded bg-white/20" />
                        <div className="mt-4 h-5 w-48 rounded bg-white/20" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export default function LichSuDonHangTab() {
    const { t } = useLanguage();
    const user = useAppSelector((s) => s.auth.user as any);
    const router = useRouter();
    const {addProduct, addTea} = useCart();

    const [tab, setTab] = React.useState<MainTab>('product');
    const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
    const [pageIndex, setPageIndex] = React.useState(1);
    const [loading, setLoading] = React.useState(false);
    const [teaOrders, setTeaOrders] = React.useState<any[]>([]);
    const [productOrders, setProductOrders] = React.useState<any[]>([]);
    const [selectedOrder, setSelectedOrder] = React.useState<any | null>(null);
    const [cancelling, setCancelling] = React.useState(false);
    const [cancelModalOpen, setCancelModalOpen] = React.useState(false);
    const [cancelReason, setCancelReason] = React.useState('');

    const userId = Number(user?.id);

    const fetchOrders = React.useCallback(
        async (silent?: boolean) => {
            await Promise.resolve();
            if (!userId) {
                setTeaOrders([]);
                setProductOrders([]);
                setLoading(false);
                return;
            }
            if (!silent) setLoading(true);
            try {
                if (!historyRequest) {
                    historyRequest = Promise.all([getOrderTeasHistoryAPI(), getOrderProductsHistoryAPI()]).then(
                        ([teaRes, productRes]) => ({
                            teaOrders: unwrapListData<any>(teaRes),
                            productOrders: unwrapListData<any>(productRes),
                        }),
                    );
                }
                const result = await historyRequest;
                setTeaOrders(result.teaOrders);
                setProductOrders(result.productOrders);
            } catch {
                if (!silent) toast.error('Không thể tải lịch sử đơn hàng');
            } finally {
                historyRequest = null;
                setLoading(false);
            }
        },
        [userId],
    );

    React.useEffect(() => {
        void Promise.resolve().then(() => fetchOrders());
    }, [fetchOrders]);

    // Admin đổi trạng thái đơn trong lúc khách đang mở tab khác: quay lại tab
    // là tải mới, không hiện trạng thái cũ.
    React.useEffect(() => {
        const onFocus = () => {
            void fetchOrders(true);
        };
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [fetchOrders]);

    const orders = tab === 'tea' ? teaOrders : productOrders;
    const filteredOrders =
        statusFilter === 'all' ? orders : orders.filter((order) => getOrderStatus(order) === statusFilter);
    const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDER_PAGE_SIZE));
    const safePageIndex = Math.min(pageIndex, totalPages);
    const pageStart = (safePageIndex - 1) * ORDER_PAGE_SIZE;
    const displayedOrders = filteredOrders.slice(pageStart, pageStart + ORDER_PAGE_SIZE);

    const handleChangeMainTab = (nextTab: MainTab) => {
        setTab(nextTab);
        setStatusFilter('all');
        setSelectedOrder(null);
        setPageIndex(1);
    };

    const handleChangeStatusFilter = (nextStatus: StatusFilter) => {
        setStatusFilter(nextStatus);
        setSelectedOrder(null);
        setPageIndex(1);
    };

    const handleBuyAgain = async (order: any) => {
        const items = getOrderItems(order, tab);
        if (!items.length) {
            toast.error('Không tìm thấy sản phẩm trong đơn hàng');
            return;
        }

        let addedCount = 0;

        for (const item of items) {
            const id = getItemId(item, tab);
            if (!id) continue;

            if (tab === 'product') {
                addProduct({
                    id,
                    name: String(getItemName(item, tab)),
                    price: getItemPrice(item),
                    quantity: getItemQuantity(item),
                    unit: String(getItemUnit(item, tab)),
                    images:
                        getValue(item, ['images', 'Images']) ??
                        getValue(getItemEntity(item, tab), ['images', 'Images']) ??
                        null,
                });
                addedCount += 1;
                continue;
            }

            try {
                const tea = unwrapApiData<Tea>(await getTeaByIdAPI(id));
                if (!tea || tea.sold || getTeaCost(tea) === null) continue;
                addTea({
                    id,
                    name: tea.name ?? String(getItemName(item, tab)),
                    code: String(getValue(item, ['teaCode', 'TeaCode', 'code', 'Code']) ?? '#' + id),
                    price: tea.price!,
                    images: tea.images,
                    volume: tea.volume,
                    type: tea.type,
                    seasons: [{label: 'Vụ Xuân', variant: TEA_SPRING_PRODUCT, quantity: tea.volume!}],
                    plantingYears: 1,
                });
                addedCount += 1;
            } catch {
                // Never reuse a historical order price as a unit price.
            }
        }

        if (!addedCount) {
            toast.error('Không thể thêm lại đơn hàng vào giỏ');
            return;
        }

        toast.success('Đã thêm lại vào giỏ hàng');
        router.push('/gio-hang');
    };

    const handleCancelOrder = async () => {
        if (!selectedOrder || cancelling) return;
        const orderId = getOrderId(selectedOrder);
        if (!orderId) {
            toast.error('Không tìm thấy mã đơn hàng');
            return;
        }

        setCancelReason('');
        setCancelModalOpen(true);
    };

    const confirmCancelOrder = async () => {
        if (!selectedOrder || cancelling) return;
        const orderId = getOrderId(selectedOrder);
        if (!orderId) {
            toast.error('Không tìm thấy mã đơn hàng');
            return;
        }

        const trimmedReason = cancelReason.trim();
        if (!trimmedReason) {
            toast.error('Vui lòng nhập lý do huỷ đơn');
            return;
        }

        setCancelling(true);
        try {
            await cancelOrderAPI(orderId, trimmedReason);
            await fetchOrders();
            setSelectedOrder((current: any | null) =>
                current
                    ? {
                          ...current,
                          reasonCancellation: trimmedReason,
                          status: OrderProductStatus.Canceled,
                          orderStatus: OrderProductStatus.Canceled,
                      }
                    : current,
            );
            setCancelModalOpen(false);
            toast.success('Đã huỷ đơn hàng');
        } catch {
            toast.error('Huỷ đơn hàng thất bại');
        } finally {
            setCancelling(false);
        }
    };

    if (selectedOrder) {
        const deliveryInfo = getDeliveryInfo(selectedOrder.deliveryInformation);
        const status = getOrderStatus(selectedOrder);
        const canCancel =
            status !== OrderProductStatus.Shipped &&
            status !== OrderProductStatus.Completed &&
            status !== OrderProductStatus.Canceled;

        return (
            <div className="min-w-0 max-w-full">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <h2 className="font-source-serif-4 text-2xl leading-none text-[#F4F0E4] sm:text-[26px]">
                            Lịch sử đơn hàng | {formatOrderCode(selectedOrder)}
                        </h2>
                        <p className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[11px] leading-relaxed text-[#F4F0E4]/80 sm:text-xs">
                            <span>Thời gian đặt: {formatDateTime(selectedOrder.createdDate)}</span>
                            <span>|</span>
                            <span>Trạng thái: {getOrderStatusLabel(status, tab)}</span>
                            <span>|</span>
                            <span>Phương thức thanh toán: {getPaymentMethodLabel(deliveryInfo?.paymentMethod)}</span>
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setSelectedOrder(null)}
                        className="w-fit text-[13px] text-[#F4F0E4]/80 underline underline-offset-4 transition hover:text-white sm:text-sm"
                    >
                        Quay lại
                    </button>
                </div>

                <section className="mt-5">
                    <h3 className="border-b border-[#F4F0E4]/45 pb-2 font-source-serif-4 text-[17px] text-[#F4F0E4] sm:text-lg">
                        Thông tin nhận hàng
                    </h3>
                    <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-3">
                        <DetailInfoField
                            label="Họ và tên"
                            value={deliveryInfo?.fullName ?? selectedOrder.customerName ?? selectedOrder.fullName}
                        />
                        <DetailInfoField
                            label="Số điện thoại"
                            value={deliveryInfo?.phoneNumber ?? selectedOrder.phoneNumber}
                        />
                        <DetailInfoField
                            label="Email"
                            value={deliveryInfo?.email ?? selectedOrder.email}
                        />
                        <DetailInfoField
                            label="Địa chỉ"
                            value={getAddressLine(deliveryInfo)}
                            wide
                        />
                        <DetailInfoField
                            label="Lời nhắn"
                            value={deliveryInfo?.note ?? selectedOrder.note ?? '--'}
                        />
                    </div>
                    {(() => {
                        const invoice = parseCompanyInvoice(deliveryInfo?.companyInvoice);
                        if (!invoice.requested) return null;
                        return (
                            <div className="mt-4 rounded-xl border border-[#F4F0E4]/30 bg-white/5 p-4 text-sm text-[#F4F0E4]">
                                <p className="font-semibold">Cần xuất hoá đơn công ty</p>
                                {invoice.companyName && <p className="mt-1">Tên công ty: {invoice.companyName}</p>}
                                {invoice.taxCode && <p>Mã số thuế: {invoice.taxCode}</p>}
                                {invoice.email && <p>Email nhận hoá đơn: {invoice.email}</p>}
                                {invoice.address && <p>Địa chỉ công ty: {invoice.address}</p>}
                            </div>
                        );
                    })()}
                </section>

                <section className="mt-6">
                    <h3 className="border-b border-[#F4F0E4]/45 pb-2 font-source-serif-4 text-[17px] text-[#F4F0E4] sm:text-lg">
                        Sản phẩm
                    </h3>
                    <div className="mt-3">
                        <OrderCard
                            order={selectedOrder}
                            tab={tab}
                            compact
                            onBuyAgain={() => handleBuyAgain(selectedOrder)}
                        />
                    </div>
                </section>

                {canCancel && (
                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            onClick={handleCancelOrder}
                            disabled={cancelling}
                            className="text-sm text-[#F4F0E4] underline underline-offset-4 transition hover:text-white disabled:cursor-wait disabled:opacity-60"
                        >
                            {cancelling ? 'Đang huỷ đơn hàng...' : 'Huỷ đơn hàng'}
                        </button>
                    </div>
                )}

                {cancelModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div
                            className="absolute inset-0 bg-black/40"
                            onClick={() => !cancelling && setCancelModalOpen(false)}
                        />
                        <div className="relative mx-4 w-full max-w-sm rounded-2xl border border-[#7F9635]/40 bg-[#23340D] p-6 text-[#F4F0E4] shadow-2xl">
                            <h3 className="font-source-serif-4 text-2xl leading-none">Huỷ đơn hàng</h3>
                            <p className="mt-2 text-sm text-[#F4F0E4]/80">Nhập lý do huỷ đơn hàng:</p>
                            <textarea
                                autoFocus
                                value={cancelReason}
                                onChange={(event) => setCancelReason(event.target.value)}
                                rows={3}
                                placeholder="Ví dụ: Tôi muốn đổi sang sản phẩm khác"
                                className="mt-3 w-full rounded-lg border border-[#F4F0E4]/30 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-[#F4F0E4]/50 focus:border-[#7F9635] focus:outline-none"
                            />
                            <div className="mt-4 flex justify-end gap-2">
                                <button
                                    type="button"
                                    disabled={cancelling}
                                    onClick={() => setCancelModalOpen(false)}
                                    className="h-10 rounded-lg border border-[#F4F0E4]/40 px-4 text-sm font-medium transition hover:bg-white/10 disabled:opacity-60"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="button"
                                    disabled={cancelling}
                                    onClick={confirmCancelOrder}
                                    className="h-10 rounded-lg bg-[#EF3E4A] px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                                >
                                    {cancelling ? 'Đang huỷ...' : 'Xác nhận huỷ'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="min-w-0 max-w-full">
            <h2 className="font-source-serif-4 text-2xl leading-none text-[#F4F0E4] sm:text-[26px]">
                {t('account.orders.title', 'Lịch sử đơn hàng')}
            </h2>

            <div className="mt-5 max-w-full overflow-x-auto">
                <div
                    data-order-main-tabs
                    className="flex w-max min-w-full gap-7 border-b border-[#F4F0E4]/35 sm:gap-9"
                >
                    {MAIN_TABS.map((item) => (
                        <button
                            key={item.value}
                            data-order-main-tab={item.value}
                            type="button"
                            onClick={() => handleChangeMainTab(item.value)}
                            className={cn(
                                '-mb-px shrink-0 pb-2 text-left font-source-serif-4 text-[17px] leading-none text-[#F4F0E4]/78 transition hover:text-white sm:text-lg',
                                tab === item.value && 'border-b-2 border-[#F4F0E4] text-white',
                            )}
                        >
                            {item.value === 'tea'
                                ? t('account.orders.teaOrders', item.label)
                                : t('account.orders.productOrders', item.label)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-5 max-w-full overflow-x-auto">
                <div
                    data-order-status-tabs
                    className="flex w-max min-w-full gap-6 border-b border-[#F4F0E4]/45 sm:gap-7"
                >
                    {(tab === 'tea' ? TEA_STATUS_TABS : PRODUCT_STATUS_TABS).map((item) => {
                        let label = item.label;
                        if (item.value === 'all') label = t('account.orders.statusAll', 'Tất cả');
                        else if (item.value === OrderProductStatus.Approved) label = t('account.orders.statusApproved', 'Chờ xác nhận');
                        else if (item.value === OrderProductStatus.Processing) label = tab === 'tea' ? t('account.orders.statusPlanting', 'Đang trồng') : t('account.orders.statusProcessing', 'Đang chuẩn bị hàng');
                        else if (item.value === OrderProductStatus.Shipped) label = t('account.orders.statusShipped', 'Đã giao');
                        else if (item.value === OrderProductStatus.Completed) label = t('account.orders.statusCompleted', 'Hoàn thành');
                        else if (item.value === OrderProductStatus.Canceled) label = t('account.orders.statusCanceled', 'Đã huỷ');
                        return (
                            <button
                                key={String(item.value)}
                                data-order-status-tab={String(item.value)}
                                type="button"
                                onClick={() => handleChangeStatusFilter(item.value)}
                                className={cn(
                                    '-mb-px shrink-0 pb-3 text-[13px] font-medium text-[#F4F0E4]/72 transition hover:text-white sm:text-sm',
                                    statusFilter === item.value && 'border-b-2 border-[#F4F0E4] text-white',
                                )}
                            >
                                {item.value === 'all' ? `${label} (${orders.length})` : label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mt-5">
                {loading ? (
                    <OrderHistorySkeleton />
                ) : filteredOrders.length ? (
                    <div>
                        <div className="flex flex-col gap-4">
                            {displayedOrders.map((order: any, index) => (
                                <OrderCard
                                    key={getOrderId(order) || order.orderProductId || order.orderTeaId || index}
                                    order={order}
                                    tab={tab}
                                    onDetail={() => setSelectedOrder(order)}
                                    onBuyAgain={() => handleBuyAgain(order)}
                                />
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPageIndex((page) => Math.max(1, page - 1))}
                                    disabled={safePageIndex === 1}
                                    className="h-8 min-w-8 rounded-[6px] border border-[#F4F0E4]/65 px-3 text-sm font-semibold text-[#F4F0E4] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                                    aria-label="Trang đơn hàng trước"
                                >
                                    ‹
                                </button>
                                {Array.from({length: totalPages}).map((_, index) => {
                                    const page = index + 1;
                                    const active = page === safePageIndex;
                                    return (
                                        <button
                                            key={page}
                                            type="button"
                                            onClick={() => setPageIndex(page)}
                                            aria-current={active ? 'page' : undefined}
                                            className={cn(
                                                'h-8 min-w-8 rounded-[6px] border px-3 text-sm font-semibold transition',
                                                active
                                                    ? 'border-[#F4F0E4] bg-[#F4F0E4] text-[#3B5518]'
                                                    : 'border-[#F4F0E4]/65 text-[#F4F0E4] hover:bg-white/10',
                                            )}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}
                                <button
                                    type="button"
                                    onClick={() => setPageIndex((page) => Math.min(totalPages, page + 1))}
                                    disabled={safePageIndex === totalPages}
                                    className="h-8 min-w-8 rounded-[6px] border border-[#F4F0E4]/65 px-3 text-sm font-semibold text-[#F4F0E4] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                                    aria-label="Trang đơn hàng tiếp theo"
                                >
                                    ›
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex min-h-[120px] items-center">
                        <p className="text-sm text-[#F4F0E4]/75">
                            {t('account.orders.empty', 'Chưa có đơn hàng nào.')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
