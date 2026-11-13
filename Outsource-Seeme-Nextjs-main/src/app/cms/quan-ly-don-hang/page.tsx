'use client';
import React, {useCallback, useEffect, useState} from 'react';
import {
    Col,
    Button,
    Divider,
    Drawer,
    Form,
    Image,
    Input,
    message,
    Modal,
    Popconfirm,
    Row,
    Select,
    Space,
    Table,
    Tag,
    Typography,
} from 'antd';
import type {ColumnsType} from 'antd/es/table';
import {Ban, ClipboardList, Edit2, Eye, Plus, Sprout} from 'lucide-react';
import {
    getOrdersPagingAPI,
    getOrderByIdAPI,
    getOrderProductsPagingAPI,
    getOrderTeasPagingAPI,
    updateOrderProductStatusAPI,
    updateOrderTeaStatusAPI,
    updateOrderPaymentAPI,
    cancelOrderAPI,
} from '@/api/OrderAPI';
import {createPlantProcessAPI, getPlantProcessPagingAPI, updatePlantProcessAPI} from '@/api/PlantProcessAPI';
import {unwrapApiData, unwrapListData, unwrapPagingData} from '@/api/response';
import ImageUploadField from '@/components/cms/ImageUploadField';
import {resolveApiImageUrl} from '@/utils/imageUrl';
import {parseCompanyInvoice} from '@/utils/companyInvoice';
import {formatTeaVolume, getTeaType} from '@/utils/teaFields';
import {OrderProductStatus, OrderTeaStatus, type PlantProgressResponse} from '@/types/swagger.types';
import dayjs from 'dayjs';

const PRODUCT_STATUS_MAP: Record<number, {label: string; color: string}> = {
    [OrderProductStatus.Approved]: {label: 'Chờ xác nhận', color: 'gold'},
    [OrderProductStatus.Processing]: {label: 'Đang chuẩn bị hàng', color: 'blue'},
    [OrderProductStatus.Shipped]: {label: 'Đã giao', color: 'cyan'},
    [OrderProductStatus.Completed]: {label: 'Hoàn thành', color: 'green'},
    [OrderProductStatus.Canceled]: {label: 'Đã huỷ', color: 'red'},
};

const TEA_STATUS_MAP: Record<number, {label: string; color: string}> = {
    [OrderTeaStatus.Approved]: {label: 'Chờ xác nhận', color: 'gold'},
    [OrderTeaStatus.Processing]: {label: 'Đang trồng', color: 'blue'},
    [OrderTeaStatus.Completed]: {label: 'Hoàn thành', color: 'green'},
    // Đơn cây không có trạng thái huỷ riêng trong enum (huỷ đi đường CancelOrderAsync,
    // ghi reasonCancellation + trả cây về chưa bán) - mục này chỉ để hiển thị + mở modal huỷ.
    [OrderProductStatus.Canceled]: {label: 'Đã huỷ', color: 'red'},
};

const PRODUCT_STATUS_OPTIONS = Object.entries(PRODUCT_STATUS_MAP).map(([value, status]) => ({
    value: Number(value),
    label: status.label,
}));

const TEA_STATUS_OPTIONS = Object.entries(TEA_STATUS_MAP).map(([value, status]) => ({
    value: Number(value),
    label: status.label,
}));

const getOrderId = (order: any) => Number(order?.orderId ?? order?.id ?? 0);
const statusMapForOrder = (order: any) =>
    String(order?.orderType ?? '').toLowerCase() === 'tea' ? TEA_STATUS_MAP : PRODUCT_STATUS_MAP;
const getProductItemId = (item: any) =>
    Number(item?.orderProductId ?? item?.OrderProductId ?? item?.id ?? item?.Id ?? 0);
const getTeaItemId = (item: any) => Number(item?.orderTeaId ?? item?.OrderTeaId ?? item?.id ?? item?.Id ?? 0);

const ORDER_STATUS_FILTER_OPTIONS = [
    {value: OrderProductStatus.Approved, label: PRODUCT_STATUS_MAP[OrderProductStatus.Approved].label},
    {value: OrderProductStatus.Processing, label: PRODUCT_STATUS_MAP[OrderProductStatus.Processing].label},
    {value: OrderProductStatus.Shipped, label: PRODUCT_STATUS_MAP[OrderProductStatus.Shipped].label},
    {value: OrderProductStatus.Completed, label: PRODUCT_STATUS_MAP[OrderProductStatus.Completed].label},
    {value: OrderProductStatus.Canceled, label: PRODUCT_STATUS_MAP[OrderProductStatus.Canceled].label},
];

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

    const explicitStatus = getNumericStatus(order?.orderStatus ?? order?.status);
    if (explicitStatus !== null) return explicitStatus as OrderProductStatus;

    const statuses = [order?.productStatus, order?.teaStatus]
        .map(getNumericStatus)
        .filter((status): status is number => status !== null);

    return deriveOrderStatus(statuses);
};

const renderStatusTag = (value: any, map: Record<number, {label: string; color: string}>) => {
    if (value === undefined || value === null || value === '') return <Tag color="default">Không áp dụng</Tag>;
    const status = map[Number(value)];
    return status ? <Tag color={status.color}>{status.label}</Tag> : <Tag color="default">Trạng thái {Number(value)}</Tag>;
};

/** Trạng thái thanh toán 3 giá trị: đủ tiền → Đã thanh toán; COD chưa đủ tiền → COD;
 * QR chưa đủ tiền → Chờ thanh toán (khách chưa chuyển / chuyển lỗi / hệ thống chưa tự xác nhận). */
type PaymentState = 'paid' | 'cod' | 'pending';

const getPaymentMethod = (order: any): string | null => {
    // Danh sách đơn (BE GetOrdersPagingAsync) trả sẵn paymentMethod; đơn chi tiết
    // hoặc dữ liệu cũ thì rút từ deliveryInformation như trước.
    if (typeof order?.paymentMethod === 'string' && order.paymentMethod.trim()) {
        return order.paymentMethod.toLowerCase();
    }
    const info = getDeliveryInfo(order?.deliveryInformation);
    const method = info?.paymentMethod;
    return typeof method === 'string' ? method.toLowerCase() : null;
};

const getPaymentState = (order: any): PaymentState => {
    const totalPrice = Number(order?.totalPrice ?? 0);
    const totalPayment = Number(order?.totalPayment ?? 0);
    if (totalPrice > 0 && totalPayment >= totalPrice) return 'paid';
    if (getPaymentMethod(order) === 'cod') return 'cod';
    return 'pending';
};

const PAYMENT_STATE_TAG: Record<PaymentState, {label: string; color: string}> = {
    paid: {label: 'Đã thanh toán', color: 'green'},
    cod: {label: 'COD', color: 'blue'},
    pending: {label: 'Chờ thanh toán', color: 'gold'},
};

const renderPaymentStatus = (order: any) => {
    const tag = PAYMENT_STATE_TAG[getPaymentState(order)];
    return <Tag color={tag.color}>{tag.label}</Tag>;
};

const getField = (source: any, keys: string[]) => {
    for (const key of keys) {
        const value = source?.[key];
        if (value !== undefined && value !== null && value !== '') return value;
    }
    return undefined;
};

const getRelatedOrderId = (item: any) => {
    const id = Number(getField(item, ['orderId', 'OrderId', 'orderID', 'OrderID']));
    return Number.isFinite(id) ? id : 0;
};

const filterItemsForOrder = (items: any[], orderId: number) => {
    if (!orderId) return [];
    return items.filter((item) => getRelatedOrderId(item) === orderId);
};

const getItemEntity = (item: any) => item?.tea ?? item?.Tea;

const getTeaId = (item: any) => {
    const entity = getItemEntity(item);
    const id =
        getField(item, ['teaId', 'TeaId', 'itemId', 'ItemId', 'plantId', 'PlantId']) ?? getField(entity, ['id', 'Id']);
    const numericId = Number(id ?? 0);
    return Number.isFinite(numericId) ? numericId : 0;
};

const getTeaName = (item: any) => {
    const entity = getItemEntity(item);
    const id = getTeaId(item);
    return (
        getField(item, ['teaName', 'TeaName', 'itemName', 'ItemName', 'name', 'Name']) ??
        getField(entity, ['name', 'Name']) ??
        (id ? `Cây trà #${id}` : 'Cây trà')
    );
};

const getProductName = (item: any) =>
    getField(item, ['productName', 'ProductName', 'itemName', 'ItemName', 'name', 'Name']) ??
    `SP #${getField(item, ['productId', 'ProductId']) ?? '-'}`;

const getDeliveryInfo = (value?: string | null) => {
    if (!value) return null;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
};

const getHarvestSummary = (item: any) => {
    const spring = [getField(item, ['springHarvestName', 'SpringHarvestName']), getField(item, ['springHarvestOutput', 'SpringHarvestOutput'])]
        .filter(Boolean)
        .join(' · ');
    const winter = [getField(item, ['winterHarvestName', 'WinterHarvestName']), getField(item, ['winterHarvestOutput', 'WinterHarvestOutput'])]
        .filter(Boolean)
        .join(' · ');
    return [spring ? `Vụ Xuân: ${spring}` : null, winter ? `Vụ Đông: ${winter}` : null].filter(Boolean);
};

const getOwnershipPeriod = (item: any) => {
    const fromDate = getField(item, ['fromDate', 'FromDate']);
    const toDate = getField(item, ['toDate', 'ToDate']);
    return fromDate || toDate ? `${formatDateTime(fromDate)} - ${formatDateTime(toDate)}` : '';
};

const getImageList = (images?: string | null): string[] => {
    if (!images) return [];
    const value = images.trim();
    if (!value) return [];
    try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
        /* comma-separated fallback */
    }
    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
};

const resolveImageUrl = (path: string) => {
    return resolveApiImageUrl(path);
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

const toObjectArray = (value: unknown): any[] => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return [value];
    return toArray(value);
};

const getItemsByKeys = (source: any, keys: string[]) => {
    for (const key of keys) {
        const items = toArray(source?.[key]);
        if (items.length) return items;
    }
    return [];
};

const getTypedOrderDetails = (order: any, type: 'tea' | 'product') =>
    toArray(order?.orderDetails).filter((item) => {
        const itemType = String(item?.type ?? item?.Type ?? '').toLowerCase();
        if (type === 'tea') return itemType === 'tea' || item?.teaId || item?.TeaId;
        return itemType === 'product' || item?.productId || item?.ProductId;
    });

const flattenTypedOrderItems = (ordersOrItems: any[], type: 'tea' | 'product') =>
    ordersOrItems.flatMap((item) => {
        const nestedItems = firstNonEmpty(
            getItemsByKeys(
                item,
                type === 'tea'
                    ? ['teaStatuses', 'orderTeaDetails', 'teaDetails', 'orderTeas', 'teas']
                    : ['productStatuses', 'orderProductDetails', 'productDetails', 'orderProducts', 'products'],
            ),
            getTypedOrderDetails(item, type),
        );
        if (!nestedItems.length) return [item];
        return nestedItems.map((nestedItem) => ({
            ...item,
            ...nestedItem,
            orderId: getRelatedOrderId(item) || getOrderId(item),
        }));
    });

const parseStatusDetailItems = (order: any, type: 'tea' | 'product') => {
    const sourceKeys =
        type === 'tea' ? ['orderTeaDetails', 'OrderTeaDetails'] : ['orderProductDetails', 'OrderProductDetails'];
    const idKeys =
        type === 'tea' ? ['orderTeaId', 'OrderTeaId', 'id', 'Id'] : ['orderProductId', 'OrderProductId', 'id', 'Id'];
    const statusIdKey = type === 'tea' ? 'orderTeaId' : 'orderProductId';

    return sourceKeys.flatMap((key) =>
        toObjectArray(order?.[key]).flatMap((statusRecord) => {
            const statusId = Number(getField(statusRecord, idKeys) ?? 0);
            const status = getItemStatus(statusRecord);
            const orderId = getRelatedOrderId(statusRecord) || getOrderId(order);
            const nestedItems = getTypedOrderDetails(statusRecord, type);
            const base = {
                ...statusRecord,
                orderId,
                status,
                ...(Number.isFinite(statusId) && statusId > 0 ? {[statusIdKey]: statusId} : {}),
            };

            if (!nestedItems.length) return [base];

            return nestedItems.map((nestedItem) => ({
                ...base,
                ...nestedItem,
                orderId,
                status,
                ...(Number.isFinite(statusId) && statusId > 0 ? {[statusIdKey]: statusId} : {}),
            }));
        }),
    );
};

const hasProductInfo = (item: any) => Boolean(getField(item, ['productName', 'ProductName', 'productId', 'ProductId']));

const hasTeaInfo = (item: any) => Boolean(getField(item, ['teaName', 'TeaName', 'teaId', 'TeaId', 'itemId', 'ItemId']));

const firstNonEmpty = (...lists: any[][]) => lists.find((items) => items.length > 0) ?? [];

const getProductItems = (order: any, history: any[] = [], pagingItems: any[] = []) =>
    firstNonEmpty(
        parseStatusDetailItems(order, 'product'),
        getItemsByKeys(order, [
            'productStatuses',
            'orderProductDetails',
            'productDetails',
            'orderProducts',
            'products',
        ]),
        getTypedOrderDetails(order, 'product'),
        pagingItems.filter(hasProductInfo),
        history.filter(hasProductInfo),
    );

const getTeaItems = (order: any, history: any[] = [], pagingItems: any[] = []) =>
    firstNonEmpty(
        parseStatusDetailItems(order, 'tea'),
        getItemsByKeys(order, ['teaStatuses', 'orderTeaDetails', 'teaDetails', 'orderTeas', 'teas']),
        getTypedOrderDetails(order, 'tea'),
        pagingItems.filter(hasTeaInfo),
        history.filter(hasTeaInfo),
    );

const getItemStatus = (item: any) =>
    getField(item, [
        'status',
        'Status',
        'orderStatus',
        'OrderStatus',
        'productStatus',
        'ProductStatus',
        'teaStatus',
        'TeaStatus',
    ]);

const formatMoney = (value: any) => (value != null ? Number(value).toLocaleString('vi-VN') + '₫' : '-');

const formatDateTime = (value: any) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '-');

const uniqueIds = (items: any[], getId: (item: any) => number) =>
    Array.from(new Set(items.map(getId).filter((id) => Number.isFinite(id) && id > 0)));

const getGroupStatus = (items: any[], fallback: number) => {
    const statuses = items
        .map((item) => getNumericStatus(getItemStatus(item)))
        .filter((status): status is number => status !== null);

    return statuses.length ? deriveOrderStatus(statuses) : fallback;
};

const patchOrderItemStatus = (order: any, type: 'product' | 'tea', itemIds: number[], status: number) => {
    if (!order) return order;

    const idSet = new Set(itemIds);
    const listKey = type === 'tea' ? 'teaStatuses' : 'productStatuses';
    const statusKey = type === 'tea' ? 'teaStatus' : 'productStatus';
    const getId = type === 'tea' ? getTeaItemId : getProductItemId;
    const items = Array.isArray(order?.[listKey]) ? order[listKey] : [];
    const nextItems = items.map((item: any) =>
        idSet.has(getId(item))
            ? {
                  ...item,
                  status,
                  orderStatus: status,
                  [statusKey]: status,
              }
            : item,
    );
    const nextGroupStatus = nextItems.length ? getGroupStatus(nextItems, status) : status;
    const nextOrder = {
        ...order,
        [statusKey]: nextGroupStatus,
        ...(items.length ? {[listKey]: nextItems} : {}),
    };
    const orderStatus = deriveOrderStatus(
        [nextOrder.productStatus, nextOrder.teaStatus]
            .map(getNumericStatus)
            .filter((value): value is number => value !== null),
    );

    return {
        ...nextOrder,
        orderStatus,
        status: orderStatus,
    };
};

const patchOrderCanceled = (order: any, reason: string) => {
    if (!order) return order;
    return {
        ...order,
        reasonCancellation: reason,
        orderStatus: OrderProductStatus.Canceled,
        status: OrderProductStatus.Canceled,
        ...(order.productStatus !== undefined || order.productStatuses?.length
            ? {productStatus: OrderProductStatus.Canceled}
            : {}),
    };
};

export default function QuanLyDonHangPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [pageIndex, setPageIndex] = useState(1);
    const [keyword, setKeyword] = useState('');
    const [orderStatusFilter, setOrderStatusFilter] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);
    const [markingPaid, setMarkingPaid] = useState(false);
    const [updatingItemKey, setUpdatingItemKey] = useState<string | null>(null);
    const [bulkUpdatingKey, setBulkUpdatingKey] = useState<'product' | 'tea' | null>(null);
    const [progressForm] = Form.useForm();
    const [progressModalOpen, setProgressModalOpen] = useState(false);
    const [progressFormOpen, setProgressFormOpen] = useState(false);
    const [progressTea, setProgressTea] = useState<{id: number; name: string} | null>(null);
    const [progressRecords, setProgressRecords] = useState<PlantProgressResponse[]>([]);
    const [progressTotal, setProgressTotal] = useState(0);
    const [progressPageIndex, setProgressPageIndex] = useState(1);
    const [progressKeyword, setProgressKeyword] = useState('');
    const [progressLoading, setProgressLoading] = useState(false);
    const [progressSaving, setProgressSaving] = useState(false);
    const [editingProgress, setEditingProgress] = useState<PlantProgressResponse | null>(null);

    const [messageApi, contextHolder] = message.useMessage();

    /**
     * API danh sách đơn KHÔNG trả trạng thái (chỉ có id, tên khách, loại đơn,
     * tiền, ngày đặt) nên cột "Trạng thái" trước đây luôn rơi về mặc định
     * "Chờ xác nhận" cho mọi đơn. Gộp thêm trạng thái item (sản phẩm + cây)
     * từ 2 API paging item rồi suy ra trạng thái từng đơn - nhờ đó cột trạng
     * thái và bộ lọc trạng thái mới hiện đúng (đơn đã xác nhận không còn
     * hiện "Chờ xác nhận"). Đơn cây đã huỷ vẫn hiện "Hoàn thành" vì BE đang
     * ghi item cây huỷ thành Completed - chờ sửa BE (xem đợt việc BE).
     */
    const enrichWithItemStatuses = useCallback(async (orders: any[]) => {
        if (!orders.length) return orders;
        try {
            const fetchAllItems = async (api: (params: any) => Promise<any>) => {
                const first = unwrapPagingData<any>(await api({pageIndex: 1, pageSize: 500}));
                const items = [...first.data];
                for (let nextPage = 2; nextPage <= first.totalPages; nextPage += 1) {
                    const next = unwrapPagingData<any>(await api({pageIndex: nextPage, pageSize: 500}));
                    items.push(...next.data);
                }
                return items;
            };
            const [teaItems, productItems] = await Promise.all([
                fetchAllItems((params) => getOrderTeasPagingAPI(params).catch(() => null)),
                fetchAllItems((params) => getOrderProductsPagingAPI(params).catch(() => null)),
            ]);
            const statusesOf = (items: any[], orderId: number) =>
                filterItemsForOrder(items, orderId)
                    .map(getItemStatus)
                    .map(getNumericStatus)
                    .filter((status): status is number => status !== null);
            return orders.map((order) => {
                const id = getOrderId(order);
                const teaStatuses = statusesOf(teaItems, id);
                const productStatuses = statusesOf(productItems, id);
                return {
                    ...order,
                    teaStatus: teaStatuses.length ? deriveOrderStatus(teaStatuses) : order.teaStatus,
                    productStatus: productStatuses.length ? deriveOrderStatus(productStatuses) : order.productStatus,
                };
            });
        } catch {
            return orders;
        }
    }, []);

    const fetchData = useCallback(async (silent?: boolean) => {
        await Promise.resolve();
        if (!silent) setLoading(true);
        try {
            const pageSize = orderStatusFilter === null ? 20 : 500;
            const res = (await getOrdersPagingAPI({
                pageIndex: orderStatusFilter === null ? pageIndex : 1,
                pageSize,
                keyword: keyword || undefined,
            })) as any;
            /* Hỗ trợ cả hai cấu trúc: { data: { data: [], totalRecords } } và { data: [], totalRecords } */
            const paging = unwrapPagingData<any>(res);
            if (orderStatusFilter === null) {
                setOrders(await enrichWithItemStatuses(paging.data));
                setTotal(paging.totalRecords);
            } else {
                const allOrders = [...paging.data];
                for (let nextPage = 2; nextPage <= paging.totalPages; nextPage += 1) {
                    const nextRes = await getOrdersPagingAPI({
                        pageIndex: nextPage,
                        pageSize,
                        keyword: keyword || undefined,
                    });
                    allOrders.push(...unwrapPagingData<any>(nextRes).data);
                }
                const enriched = await enrichWithItemStatuses(allOrders);
                const filteredOrders = enriched.filter((order) => getOrderStatus(order) === orderStatusFilter);
                const start = (pageIndex - 1) * 20;
                setOrders(filteredOrders.slice(start, start + 20));
                setTotal(filteredOrders.length);
            }
        } catch {
            messageApi.error('Không thể tải đơn hàng');
        } finally {
            setLoading(false);
        }
    }, [pageIndex, keyword, orderStatusFilter, messageApi, enrichWithItemStatuses]);

    useEffect(() => {
        void Promise.resolve().then(() => fetchData());
    }, [fetchData]);

    // Admin đổi trạng thái đơn ở tab khác (hoặc khách huỷ đơn): quay lại tab
    // quản lý là tải mới, không hiện trạng thái cũ (tải nền, không chớp bảng).
    useEffect(() => {
        const onFocus = () => {
            void fetchData(true);
        };
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [fetchData]);

    const loadOrderDetail = useCallback(
        async (id: number) => {
            setDetailLoading(true);
            try {
                const [res, teaHistoryRes, productHistoryRes, teaPagingRes, productPagingRes] = await Promise.all([
                    getOrderByIdAPI(id) as any,
                    Promise.resolve(null),
                    Promise.resolve(null),
                    getOrderTeasPagingAPI({pageIndex: 1, pageSize: 500, keyword: String(id)}).catch(() => null),
                    getOrderProductsPagingAPI({pageIndex: 1, pageSize: 500, keyword: String(id)}).catch(() => null),
                ]);
                /* API có thể trả về { data: order } hoặc order trực tiếp */
                const order = unwrapApiData<any>(res);
                const teaHistory = unwrapListData<any>(teaHistoryRes);
                const productHistory = unwrapListData<any>(productHistoryRes);
                const teaPagingItems = flattenTypedOrderItems(
                    filterItemsForOrder(unwrapPagingData<any>(teaPagingRes).data, id),
                    'tea',
                );
                const productPagingItems = flattenTypedOrderItems(
                    filterItemsForOrder(unwrapPagingData<any>(productPagingRes).data, id),
                    'product',
                );
                setSelectedOrder({
                    ...order,
                    orderId: getOrderId(order) || id,
                    productStatuses: getProductItems(order, productHistory, productPagingItems),
                    teaStatuses: getTeaItems(order, teaHistory, teaPagingItems),
                    teaHistory,
                    productHistory,
                });
            } catch {
                messageApi.error('Không thể tải chi tiết đơn hàng');
            } finally {
                setDetailLoading(false);
            }
        },
        [messageApi],
    );

    const openDetail = useCallback(async (id: number) => {
        setDrawerOpen(true);
        await loadOrderDetail(id);
    }, [loadOrderDetail]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const orderId = Number(params.get('orderId'));
        if (Number.isFinite(orderId) && orderId > 0) {
            void Promise.resolve().then(() => openDetail(orderId));
        }
    }, [openDetail]);

    const applyLocalStatusUpdate = (type: 'product' | 'tea', itemIds: number[], status: number) => {
        const orderId = getOrderId(selectedOrder);
        setSelectedOrder((current: any) => patchOrderItemStatus(current, type, itemIds, status));
        setOrders((current) =>
            current.map((order) =>
                getOrderId(order) === orderId ? patchOrderItemStatus(order, type, itemIds, status) : order,
            ),
        );
    };

    const handleUpdateProductStatus = async (orderProductId: number, status: number) => {
        if (!orderProductId) {
            messageApi.error('Không tìm thấy ID item sản phẩm');
            return;
        }
        const itemKey = `product-${orderProductId}`;
        setUpdatingItemKey(itemKey);
        try {
            await updateOrderProductStatusAPI(orderProductId, status as OrderProductStatus);
            applyLocalStatusUpdate('product', [orderProductId], status);
            messageApi.success('Cập nhật trạng thái thành công');
        } catch {
            messageApi.error('Cập nhật thất bại');
        } finally {
            setUpdatingItemKey(null);
        }
    };

    const handleUpdateTeaStatus = async (orderTeaId: number, status: number) => {
        // Chọn 'Đã huỷ' thì đi đường huỷ đơn (nhập lý do, trả cây về chưa bán),
        // không gọi API đổi trạng thái item vì OrderTeaStatus không có Canceled.
        if (status === OrderProductStatus.Canceled) {
            setCancelModalOpen(true);
            return;
        }
        if (!orderTeaId) {
            messageApi.error('Không tìm thấy ID item cây trà');
            return;
        }
        const itemKey = `tea-${orderTeaId}`;
        setUpdatingItemKey(itemKey);
        try {
            await updateOrderTeaStatusAPI(orderTeaId, status as OrderTeaStatus);
            applyLocalStatusUpdate('tea', [orderTeaId], status);
            messageApi.success('Cập nhật trạng thái thành công');
        } catch {
            messageApi.error('Cập nhật thất bại');
        } finally {
            setUpdatingItemKey(null);
        }
    };

    const handleUpdateAllProductStatus = async (status: number) => {
        const ids = uniqueIds(selectedOrder?.productStatuses ?? [], getProductItemId);
        if (!ids.length) {
            messageApi.error('Không tìm thấy ID item sản phẩm trong đơn');
            return;
        }
        setBulkUpdatingKey('product');
        try {
            await Promise.all(ids.map((id) => updateOrderProductStatusAPI(id, status as OrderProductStatus)));
            applyLocalStatusUpdate('product', ids, status);
            messageApi.success('Đã cập nhật trạng thái tất cả sản phẩm trong đơn');
        } catch {
            messageApi.error('Cập nhật trạng thái sản phẩm thất bại');
        } finally {
            setBulkUpdatingKey(null);
        }
    };

    const handleUpdateAllTeaStatus = async (status: number) => {
        // Chọn 'Đã huỷ' thì đi đường huỷ đơn (nhập lý do, trả cây về chưa bán),
        // không gọi API đổi trạng thái item vì OrderTeaStatus không có Canceled.
        if (status === OrderProductStatus.Canceled) {
            setCancelModalOpen(true);
            return;
        }
        const ids = uniqueIds(selectedOrder?.teaStatuses ?? [], getTeaItemId);
        if (!ids.length) {
            messageApi.error('Không tìm thấy ID item cây trà trong đơn');
            return;
        }
        setBulkUpdatingKey('tea');
        try {
            await Promise.all(ids.map((id) => updateOrderTeaStatusAPI(id, status as OrderTeaStatus)));
            applyLocalStatusUpdate('tea', ids, status);
            messageApi.success('Đã cập nhật trạng thái tất cả cây trà trong đơn');
        } catch {
            messageApi.error('Cập nhật trạng thái cây trà thất bại');
        } finally {
            setBulkUpdatingKey(null);
        }
    };

    const handleMarkPaid = async () => {
        const orderId = getOrderId(selectedOrder);
        const totalPrice = Number(selectedOrder?.totalPrice ?? 0);
        if (!orderId || !totalPrice) return;
        setMarkingPaid(true);
        try {
            await updateOrderPaymentAPI(orderId, totalPrice);
            messageApi.success('Đã ghi nhận thanh toán cho đơn hàng');
            const patch = (order: any) => (order ? {...order, totalPayment: totalPrice} : order);
            setSelectedOrder(patch);
            setOrders((current) =>
                current.map((order) => (getOrderId(order) === orderId ? patch(order) : order)),
            );
        } catch {
            messageApi.error('Ghi nhận thanh toán thất bại');
        } finally {
            setMarkingPaid(false);
        }
    };

    const handleCancelOrder = async () => {
        const orderId = getOrderId(selectedOrder);
        if (!orderId) return;
        const reason = cancelReason.trim();
        if (!reason) {
            messageApi.warning('Vui lòng nhập lý do huỷ đơn');
            return;
        }
        setCancelling(true);
        try {
            await cancelOrderAPI(orderId, reason);
            messageApi.success('Đã huỷ đơn hàng');
            setCancelModalOpen(false);
            setCancelReason('');
            setSelectedOrder((current: any) => patchOrderCanceled(current, reason));
            setOrders((current) =>
                current.map((order) => (getOrderId(order) === orderId ? patchOrderCanceled(order, reason) : order)),
            );
        } catch {
            messageApi.error('Huỷ đơn thất bại');
        } finally {
            setCancelling(false);
        }
    };

    const fetchProgress = useCallback(
        async (teaId = progressTea?.id) => {
            if (!teaId) return;
            await Promise.resolve();
            setProgressLoading(true);
            try {
                const res = await getPlantProcessPagingAPI({
                    teaId,
                    pageIndex: progressPageIndex,
                    pageSize: 10,
                    orderBy: 'CreatedDate desc',
                    keyword: progressKeyword || undefined,
                });
                const paging = unwrapPagingData<PlantProgressResponse>(res);
                setProgressRecords(paging.data);
                setProgressTotal(paging.totalRecords);
            } catch {
                messageApi.error('Không thể tải tiến độ cây trồng');
            } finally {
                setProgressLoading(false);
            }
        },
        [messageApi, progressKeyword, progressPageIndex, progressTea?.id],
    );

    useEffect(() => {
        if (progressModalOpen && progressTea?.id) {
            void Promise.resolve().then(() => fetchProgress(progressTea.id));
        }
    }, [fetchProgress, progressModalOpen, progressTea?.id]);

    const openProgress = (item: any) => {
        const teaId = getTeaId(item);
        if (!teaId) {
            messageApi.warning('Đơn hàng này chưa có mã cây trà (teaId) để cập nhật tiến độ');
            return;
        }
        setProgressTea({id: teaId, name: String(getTeaName(item))});
        setProgressRecords([]);
        setProgressTotal(0);
        setProgressKeyword('');
        setProgressPageIndex(1);
        setProgressModalOpen(true);
    };

    const openCreateProgress = () => {
        if (!progressTea?.id) return;
        setEditingProgress(null);
        progressForm.resetFields();
        setProgressFormOpen(true);
    };

    const openEditProgress = (record: PlantProgressResponse) => {
        setEditingProgress(record);
        progressForm.setFieldsValue({
            title: record.title,
            content: record.content,
            images: record.images,
        });
        setProgressFormOpen(true);
    };

    const handleSaveProgress = async () => {
        const teaId = progressTea?.id;
        if (!teaId) return;
        const values = await progressForm.validateFields();
        setProgressSaving(true);
        try {
            if (editingProgress?.id) {
                await updatePlantProcessAPI({
                    id: editingProgress.id,
                    title: values.title,
                    content: values.content,
                    images: values.images,
                });
                messageApi.success('Cập nhật tiến độ thành công');
            } else {
                await createPlantProcessAPI({
                    teaId,
                    title: values.title,
                    content: values.content,
                    images: values.images,
                });
                messageApi.success('Thêm tiến độ thành công');
            }
            setProgressFormOpen(false);
            setEditingProgress(null);
            await fetchProgress(teaId);
        } catch {
            messageApi.error('Lưu tiến độ thất bại');
        } finally {
            setProgressSaving(false);
        }
    };

    const renderProductItems = (items: any[]) => (
        <div className="overflow-hidden rounded-[8px] border border-[#edf0e8] bg-white">
            <div className="hidden grid-cols-[72px_minmax(0,1fr)_52px_110px_160px] gap-2 bg-[#fafafa] px-3 py-2 text-[12px] font-semibold text-[#4f4f4f] md:grid">
                <span>Mã mục</span>
                <span>Tên sản phẩm</span>
                <span>SL</span>
                <span>Đơn giá</span>
                <span>Trạng thái</span>
            </div>
            {items.map((item, index) => {
                const value = getNumericStatus(getItemStatus(item)) ?? OrderProductStatus.Approved;
                const itemId = getProductItemId(item);
                const itemKey = `product-${itemId}`;
                const isCancelled =
                    Number(value) === OrderProductStatus.Canceled || Boolean(selectedOrder?.reasonCancellation);
                return (
                    <div
                        key={itemId || `${getProductName(item)}-${index}`}
                        className="grid grid-cols-2 gap-2 border-t border-[#edf0e8] px-3 py-3 text-[13px] md:grid-cols-[72px_minmax(0,1fr)_52px_110px_160px] md:items-center md:py-2"
                    >
                        <div>
                            <span className="mb-1 block text-[11px] font-medium text-[#8a8a8a] md:hidden">Mã mục</span>
                            {itemId || '-'}
                        </div>
                        <div className="col-span-2 min-w-0 md:col-span-1">
                            <span className="mb-1 block text-[11px] font-medium text-[#8a8a8a] md:hidden">Tên sản phẩm</span>
                            <p className="line-clamp-2 font-medium text-[#262626]">{getProductName(item)}</p>
                            {(() => {
                                const packagingName = getField(item, ['packagingName', 'PackagingName']);
                                const colorImage = getField(item, ['colorImage', 'ColorImage']);
                                const colorName = getField(item, ['colorName', 'ColorName']);
                                if (!packagingName && !colorImage && !colorName) return null;
                                return (
                                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#8a8a8a]">
                                        {packagingName ? <span>Phân loại: {String(packagingName)}</span> : null}
                                        {colorImage || colorName ? (
                                            <span className="inline-flex items-center gap-1.5">
                                                Màu:
                                                {colorImage ? (
                                                    /* eslint-disable-next-line @next/next/no-img-element */
                                                    <img
                                                        src={resolveImageUrl(String(colorImage))}
                                                        alt=""
                                                        style={{width: 28, height: 28, objectFit: 'cover', borderRadius: 6, border: '1px solid #edf0e8'}}
                                                    />
                                                ) : null}
                                                {colorName ? <span>{String(colorName)}</span> : null}
                                            </span>
                                        ) : null}
                                    </div>
                                );
                            })()}
                        </div>
                        <div>
                            <span className="mb-1 block text-[11px] font-medium text-[#8a8a8a] md:hidden">SL</span>
                            {getField(item, ['quantity', 'Quantity']) ?? '-'}
                        </div>
                        <div>
                            <span className="mb-1 block text-[11px] font-medium text-[#8a8a8a] md:hidden">Đơn giá</span>
                            {formatMoney(getField(item, ['price', 'Price']))}
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <span className="mb-1 block text-[11px] font-medium text-[#8a8a8a] md:hidden">Trạng thái</span>
                            <Select
                                value={value}
                                size="small"
                                style={{width: '100%'}}
                                loading={updatingItemKey === itemKey}
                                disabled={!itemId || isCancelled || updatingItemKey !== null || bulkUpdatingKey !== null}
                                options={PRODUCT_STATUS_OPTIONS}
                                onChange={(newStatus) => handleUpdateProductStatus(itemId, newStatus)}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );

    const renderTeaItems = (items: any[]) => (
        <div className="overflow-hidden rounded-[8px] border border-[#edf0e8] bg-white">
            <div className="hidden grid-cols-[72px_minmax(0,1fr)_52px_104px_154px_112px] gap-2 bg-[#fafafa] px-3 py-2 text-[12px] font-semibold text-[#4f4f4f] lg:grid">
                <span>Mã mục</span>
                <span>Tên cây trà</span>
                <span>SL</span>
                <span>Đơn giá</span>
                <span>Trạng thái</span>
                <span>Tiến độ</span>
            </div>
            {items.map((item, index) => {
                const value = getNumericStatus(getItemStatus(item)) ?? OrderTeaStatus.Approved;
                const itemId = getTeaItemId(item);
                const teaId = getTeaId(item);
                const itemKey = `tea-${itemId}`;
                const isCancelled = Boolean(selectedOrder?.reasonCancellation);
                const harvestSummary = getHarvestSummary(item);
                const period = getOwnershipPeriod(item);

                return (
                    <div
                        key={itemId || teaId || `${getTeaName(item)}-${index}`}
                        className="grid grid-cols-2 gap-2 border-t border-[#edf0e8] px-3 py-3 text-[13px] lg:grid-cols-[72px_minmax(0,1fr)_52px_104px_154px_112px] lg:items-center lg:py-2"
                    >
                        <div>
                            <span className="mb-1 block text-[11px] font-medium text-[#8a8a8a] lg:hidden">Mã mục</span>
                            {itemId || '-'}
                        </div>
                        <div className="col-span-2 min-w-0 lg:col-span-1">
                            <span className="mb-1 block text-[11px] font-medium text-[#8a8a8a] lg:hidden">Tên cây trà</span>
                            <p className="line-clamp-2 font-medium text-[#262626]">{getTeaName(item)}</p>
                            <div className="mt-1 space-y-0.5 text-[12px] leading-5 text-[#6f6f6f]">
                                <p>Sản lượng cây: {formatTeaVolume(item, 'Đang cập nhật')}</p>
                                <p>Loại cây: {getTeaType(item) || 'Đang cập nhật'}</p>
                                {(harvestSummary.length > 0 || period) && (
                                    <>
                                        {harvestSummary.map((line) => (
                                            <p key={line}>{line}</p>
                                        ))}
                                        {period && <p>Thời gian nhận trồng: {period}</p>}
                                    </>
                                )}
                            </div>
                        </div>
                        <div>
                            <span className="mb-1 block text-[11px] font-medium text-[#8a8a8a] lg:hidden">SL</span>
                            {getField(item, ['quantity', 'Quantity']) ?? '-'}
                        </div>
                        <div>
                            <span className="mb-1 block text-[11px] font-medium text-[#8a8a8a] lg:hidden">Đơn giá</span>
                            {formatMoney(getField(item, ['price', 'Price']))}
                        </div>
                        <div>
                            <span className="mb-1 block text-[11px] font-medium text-[#8a8a8a] lg:hidden">Trạng thái</span>
                            <Select
                                value={value}
                                size="small"
                                style={{width: '100%'}}
                                loading={updatingItemKey === itemKey}
                                disabled={!itemId || isCancelled || updatingItemKey !== null || bulkUpdatingKey !== null}
                                options={TEA_STATUS_OPTIONS}
                                onChange={(newStatus) => handleUpdateTeaStatus(itemId, newStatus)}
                            />
                        </div>
                        <div>
                            <span className="mb-1 block text-[11px] font-medium text-[#8a8a8a] lg:hidden">Tiến độ</span>
                            <Button
                                size="small"
                                icon={<Sprout size={14} />}
                                disabled={!teaId}
                                title={teaId ? 'Xem / cập nhật tiến độ cây' : 'Thiếu teaId trong dữ liệu đơn hàng'}
                                onClick={() => openProgress(item)}
                                style={{width: '100%'}}
                            >
                                Cập nhật
                            </Button>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    const progressColumns: ColumnsType<PlantProgressResponse> = [
        {title: 'ID', dataIndex: 'id', key: 'id', width: 70},
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
            render: (value) => <span className="font-medium">{value || 'Cập nhật tiến độ'}</span>,
        },
        {
            title: 'Nội dung',
            dataIndex: 'content',
            key: 'content',
            ellipsis: true,
            render: (value) => value || <span className="text-gray-400">-</span>,
        },
        {
            title: 'Hình ảnh',
            dataIndex: 'images',
            key: 'images',
            width: 150,
            render: (images) => {
                const list = getImageList(images).slice(0, 3);
                if (!list.length) return <span className="text-gray-400">-</span>;
                return (
                    <Space size={6}>
                        {list.map((item) => {
                            const src = resolveImageUrl(item);
                            return (
                                <Image
                                    key={src}
                                    src={src}
                                    alt=""
                                    width={34}
                                    height={34}
                                    style={{objectFit: 'cover', borderRadius: 4}}
                                    fallback="/images/videovechungtoiimg.png"
                                    preview={{mask: 'Xem'}}
                                />
                            );
                        })}
                    </Space>
                );
            },
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdDate',
            key: 'createdDate',
            width: 150,
            render: (value) => formatDateTime(value),
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 90,
            render: (_, record) => (
                <Button
                    type="text"
                    icon={<Edit2 size={15} />}
                    onClick={() => openEditProgress(record)}
                />
            ),
        },
    ];

    const historyColumns: ColumnsType<any> = [
        {title: 'ID', dataIndex: 'id', key: 'id', width: 70},
        {
            title: 'Thời gian',
            dataIndex: 'createdDate',
            key: 'createdDate',
            render: (v, r) => ((v ?? r.updatedDate) ? dayjs(v ?? r.updatedDate).format('DD/MM/YYYY HH:mm') : '-'),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (v, r) => renderStatusTag(getOrderStatus(r), statusMapForOrder(r)),
        },
        {
            title: 'Ghi chú',
            dataIndex: 'note',
            key: 'note',
            render: (v, r) => v ?? r.reason ?? r.reasonCancellation ?? r.content ?? '-',
        },
    ];

    const columns: ColumnsType<any> = [
        {
            title: 'ID',
            dataIndex: 'orderId',
            key: 'orderId',
            width: 64,
            render: (_, r) => getOrderId(r) || '-',
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'createdDate',
            key: 'createdDate',
            width: 138,
            render: (v) => (v ? dayjs(v).format('DD/MM HH:mm') : '-'),
        },
        {
            title: 'Khách hàng',
            dataIndex: 'customerName',
            key: 'customerName',
            width: 132,
            ellipsis: true,
        },
        {
            title: 'Loại đơn',
            dataIndex: 'orderType',
            key: 'orderType',
            width: 116,
            render: (v) =>
                v === 'Tea' ? (
                    <Tag color="green">Cây trà</Tag>
                ) : v === 'Product' ? (
                    <Tag color="blue">Sản phẩm</Tag>
                ) : v === 'Both' ? (
                    <Tag color="purple">Cây trà & Sản phẩm</Tag>
                ) : (
                    <Tag>{v ?? '-'}</Tag>
                ),
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            width: 112,
            align: 'right',
            render: (v) => (v != null ? v.toLocaleString('vi-VN') + '₫' : '-'),
        },
        {
            title: 'Trạng thái',
            key: 'orderStatus',
            width: 132,
            render: (_, row) => renderStatusTag(getOrderStatus(row), statusMapForOrder(row)),
        },
        {
            title: 'TT',
            key: 'totalPayment',
            width: 96,
            render: (_, row) => renderPaymentStatus(row),
        },
        {
            title: 'PTTT',
            key: 'paymentMethod',
            width: 110,
            render: (_, row) => {
                const method = getPaymentMethod(row);
                if (method === 'cod') return <Tag color="blue">COD</Tag>;
                if (method === 'qr') return <Tag color="cyan">Chuyển khoản</Tag>;
                if (method === 'stripe') return <Tag color="purple">Stripe (Thẻ QT)</Tag>;
                if (method === 'paypal') return <Tag color="gold">PayPal</Tag>;
                return <span className="text-gray-400">-</span>;
            },
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 92,
            render: (_, r) => (
                <Button
                    type="text"
                    icon={<Eye size={15} />}
                    onClick={(event) => {
                        event.stopPropagation();
                        openDetail(getOrderId(r));
                    }}
                >
                    Xem
                </Button>
            ),
        },
    ];

    return (
        <div>
            {contextHolder}
            <div
                className="flex items-center justify-between"
                // style={{
                //   position: "sticky",
                //   top: 0,
                //   zIndex: 10,
                //   background: "#f5f5f5",
                //   paddingTop: 4,
                //   paddingBottom: 4,
                //   marginBottom: 20,
                // }}
            >
                <div className="flex items-center gap-2 mb-2">
                    <ClipboardList
                        size={20}
                        color="#3B5518"
                    />
                    <Typography.Title
                        level={4}
                        style={{margin: 0, color: '#3B5518'}}
                    >
                        Quản lý đơn hàng
                    </Typography.Title>
                </div>
            </div>

            <div
                style={{
                    background: '#fff',
                    borderRadius: 10,
                    padding: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
            >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-3">
                    <Input.Search
                        placeholder="Tìm ID, thông tin giao hàng..."
                        allowClear
                        style={{maxWidth: 340}}
                        onSearch={(v) => {
                            setKeyword(v);
                            setPageIndex(1);
                        }}
                    />
                    <Select
                        allowClear
                        placeholder="Lọc trạng thái đơn hàng"
                        value={orderStatusFilter ?? undefined}
                        style={{width: 220}}
                        options={ORDER_STATUS_FILTER_OPTIONS}
                        onChange={(value) => {
                            setOrderStatusFilter(value ?? null);
                            setPageIndex(1);
                        }}
                    />
                    </div>
                </div>
                <Table
                    rowKey={(row) => getOrderId(row)}
                    columns={columns}
                    dataSource={orders}
                    loading={loading}
                    sticky
                    tableLayout="fixed"
                    onRow={(record) => ({
                        onClick: () => openDetail(getOrderId(record)),
                        style: {cursor: 'pointer'},
                    })}
                    scroll={{y: 'calc(100vh - 390px)'}}
                    pagination={{
                        current: pageIndex,
                        pageSize: 20,
                        total,
                        showTotal: (t) => `Tổng ${t} đơn hàng`,
                        onChange: (p) => setPageIndex(p),
                        showSizeChanger: false,
                    }}
                    locale={{emptyText: 'Chưa có đơn hàng'}}
                />
            </div>

            {/* Order Detail Drawer */}
            <Drawer
                title={<span>Chi tiết & cập nhật trạng thái #{getOrderId(selectedOrder) || ''}</span>}
                extra={
                    selectedOrder ? (
                        <Button
                            danger
                            size="small"
                            icon={<Ban size={14} />}
                            disabled={Boolean(selectedOrder.reasonCancellation) || cancelling}
                            onClick={() => setCancelModalOpen(true)}
                        >
                            Huỷ đơn
                        </Button>
                    ) : null
                }
                open={drawerOpen}
                onClose={() => {
                    setDrawerOpen(false);
                    setSelectedOrder(null);
                }}
                size="large"
                loading={detailLoading}
                styles={{
                    body: {overflowX: 'hidden', padding: 24},
                    header: {padding: '16px 24px'},
                    mask: {backdropFilter: 'blur(2px)'},
                }}
            >
                {selectedOrder &&
                    (() => {
                        const deliveryInfo = getDeliveryInfo(selectedOrder.deliveryInformation);
                        return (
                            <div className="space-y-5 overflow-x-hidden">
                                <div className="overflow-hidden rounded-[8px] border border-[#edf0e8] bg-white text-[13px]">
                                    <div className="grid grid-cols-1 md:grid-cols-[170px_minmax(0,1fr)_150px_minmax(0,1fr)]">
                                        <div className="border-b border-[#edf0e8] bg-[#fafafa] px-4 py-3 text-[#666]">ID đơn hàng</div>
                                        <div className="border-b border-[#edf0e8] px-4 py-3 font-medium text-[#262626]">
                                            {getOrderId(selectedOrder) || '-'}
                                        </div>
                                        <div className="border-b border-[#edf0e8] bg-[#fafafa] px-4 py-3 text-[#666]">Ngày đặt</div>
                                        <div className="border-b border-[#edf0e8] px-4 py-3 font-medium text-[#262626]">
                                            {selectedOrder.createdDate
                                                ? dayjs(selectedOrder.createdDate).format('DD/MM/YYYY HH:mm')
                                                : '-'}
                                        </div>
                                        <div className="border-b border-[#edf0e8] bg-[#fafafa] px-4 py-3 text-[#666]">Trạng thái SP</div>
                                        <div className="border-b border-[#edf0e8] px-4 py-3">
                                            {renderStatusTag(selectedOrder.productStatus, PRODUCT_STATUS_MAP)}
                                        </div>
                                        <div className="border-b border-[#edf0e8] bg-[#fafafa] px-4 py-3 text-[#666]">Trạng thái cây</div>
                                        <div className="border-b border-[#edf0e8] px-4 py-3">
                                            {renderStatusTag(selectedOrder.teaStatus, TEA_STATUS_MAP)}
                                        </div>
                                        <div className="bg-[#fafafa] px-4 py-3 text-[#666] md:flex md:items-center">Thông tin giao hàng</div>
                                        <div className="px-4 py-3 leading-7 text-[#262626] md:col-span-3">
                                            {deliveryInfo ? (
                                                <div>
                                                    {deliveryInfo.countryName && (
                                                        <p>
                                                            <b>Khu vực:</b>{' '}
                                                            <Tag color={deliveryInfo.shippingRegion === 'international' ? 'purple' : 'green'}>
                                                                {deliveryInfo.countryName} {deliveryInfo.shippingRegion === 'international' ? '(Quốc tế)' : '(Nội địa)'}
                                                            </Tag>
                                                        </p>
                                                    )}
                                                    {deliveryInfo.fullName && <p><b>Họ tên:</b> {deliveryInfo.fullName}</p>}
                                                    {deliveryInfo.phoneNumber && <p><b>SĐT:</b> {deliveryInfo.phoneNumber}</p>}
                                                    {deliveryInfo.email && <p><b>Email:</b> {deliveryInfo.email}</p>}
                                                    {deliveryInfo.stateCity && <p><b>Bang / Tỉnh / Thành phố:</b> {deliveryInfo.stateCity}</p>}
                                                    {deliveryInfo.postalCode && <p><b>Mã bưu chính (ZIP):</b> {deliveryInfo.postalCode}</p>}
                                                    {(deliveryInfo.provinceName || deliveryInfo.province) && (
                                                        <p><b>Tỉnh/TP:</b> {deliveryInfo.provinceName ?? deliveryInfo.province}</p>
                                                    )}
                                                    {(deliveryInfo.wardName || deliveryInfo.ward) && (
                                                        <p><b>Phường/Xã:</b> {deliveryInfo.wardName ?? deliveryInfo.ward}</p>
                                                    )}
                                                    {deliveryInfo.address && <p><b>Địa chỉ:</b> {deliveryInfo.address}</p>}
                                                    {deliveryInfo.note && <p><b>Lời nhắn:</b> {deliveryInfo.note}</p>}
                                                    {(() => {
                                                        const invoice = parseCompanyInvoice(deliveryInfo.companyInvoice);
                                                        if (!invoice.requested) return null;
                                                        return (
                                                            <div className="mt-2 rounded-[6px] border border-[#faad14]/40 bg-[#fffbe6] px-3 py-2">
                                                                <p><b>Cần xuất hoá đơn công ty</b></p>
                                                                {invoice.companyName && <p><b>Tên công ty:</b> {invoice.companyName}</p>}
                                                                {invoice.taxCode && <p><b>Mã số thuế:</b> {invoice.taxCode}</p>}
                                                                {invoice.email && <p><b>Email nhận hoá đơn:</b> {invoice.email}</p>}
                                                                {invoice.address && <p><b>Địa chỉ công ty:</b> {invoice.address}</p>}
                                                                {!invoice.companyName && !invoice.taxCode && !invoice.email && (
                                                                    <p className="text-[#888]">Đơn cũ chưa lưu chi tiết hoá đơn - liên hệ khách để lấy thông tin.</p>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            ) : (
                                                selectedOrder.deliveryInformation ?? '-'
                                            )}
                                        </div>
                                        {selectedOrder.reasonCancellation && (
                                            <>
                                                <div className="border-t border-[#edf0e8] bg-[#fff7f7] px-4 py-3 text-[#cf1322]">Lý do huỷ</div>
                                                <div className="border-t border-[#edf0e8] px-4 py-3 md:col-span-3">
                                                    <Tag color="red">{selectedOrder.reasonCancellation}</Tag>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {(() => {
                                    const totalPrice = Number(selectedOrder.totalPrice ?? 0);
                                    const totalPayment = Number(selectedOrder.totalPayment ?? 0);
                                    const remaining = Math.max(totalPrice - totalPayment, 0);
                                    const paymentState = getPaymentState(selectedOrder);
                                    const canceled = Boolean(selectedOrder.reasonCancellation);
                                    const methodName =
                                        deliveryInfo?.paymentMethodName ??
                                        (getPaymentMethod(selectedOrder) === 'cod'
                                            ? 'Thanh toán khi nhận hàng'
                                            : getPaymentMethod(selectedOrder) === 'qr'
                                              ? 'Quét mã QR để chuyển tiền'
                                              : getPaymentMethod(selectedOrder) === 'stripe'
                                                ? 'Thanh toán thẻ quốc tế (Stripe)'
                                                : getPaymentMethod(selectedOrder) === 'paypal'
                                                  ? 'Thanh toán qua PayPal'
                                                  : '-');
                                    return (
                                        <div className="rounded-[8px] border border-[#edf0e8] bg-white p-4 text-[13px]">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <Typography.Text strong>Thanh toán</Typography.Text>
                                                {renderPaymentStatus(selectedOrder)}
                                            </div>
                                            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                                                <div>
                                                    <div className="text-[#888]">Phương thức</div>
                                                    <div className="font-medium">{methodName}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[#888]">Tổng tiền</div>
                                                    <div className="font-medium">{totalPrice.toLocaleString('vi-VN')}₫</div>
                                                </div>
                                                <div>
                                                    <div className="text-[#888]">Đã thanh toán</div>
                                                    <div className="font-medium">{totalPayment.toLocaleString('vi-VN')}₫</div>
                                                </div>
                                                <div>
                                                    <div className="text-[#888]">Còn lại</div>
                                                    <div className="font-medium">{remaining.toLocaleString('vi-VN')}₫</div>
                                                </div>
                                            </div>
                                            {!canceled && paymentState !== 'paid' && (
                                                <div className="mt-3 flex flex-wrap items-center gap-3">
                                                    <Popconfirm
                                                        title="Xác nhận khách đã thanh toán đủ đơn này?"
                                                        description="Số tiền đã thanh toán sẽ được ghi bằng tổng giá trị đơn hàng."
                                                        onConfirm={handleMarkPaid}
                                                        okText="Đã thanh toán"
                                                        cancelText="Huỷ"
                                                    >
                                                        <Button type="primary" loading={markingPaid}>
                                                            Đánh dấu đã thanh toán
                                                        </Button>
                                                    </Popconfirm>
                                                    <span className="text-[#888]">
                                                        Đơn chưa nhận được tiền thì giữ ở Chờ thanh toán để đối soát; huỷ đơn
                                                        dùng nút Huỷ đơn góc phải trên.
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {(() => {
                                    const productIds = uniqueIds(selectedOrder.productStatuses ?? [], getProductItemId);
                                    const teaIds = uniqueIds(selectedOrder.teaStatuses ?? [], getTeaItemId);
                                    if (!productIds.length && !teaIds.length) return null;

                                    const disabled =
                                        Boolean(selectedOrder.reasonCancellation) ||
                                        updatingItemKey !== null ||
                                        bulkUpdatingKey !== null;

                                    return (
                                        <div className="rounded-[8px] border border-[#edf0e8] bg-white p-3">
                                            <Typography.Text strong>Cập nhật trạng thái cả đơn</Typography.Text>
                                            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                {productIds.length > 0 && (
                                                    <Select
                                                        value={getNumericStatus(selectedOrder.productStatus) ?? undefined}
                                                        style={{width: '100%'}}
                                                        placeholder="Tất cả sản phẩm"
                                                        loading={bulkUpdatingKey === 'product'}
                                                        disabled={disabled}
                                                        options={PRODUCT_STATUS_OPTIONS}
                                                        onChange={handleUpdateAllProductStatus}
                                                    />
                                                )}
                                                {teaIds.length > 0 && (
                                                    <Select
                                                        value={getNumericStatus(selectedOrder.teaStatus) ?? undefined}
                                                        style={{width: '100%'}}
                                                        placeholder="Tất cả cây trà"
                                                        loading={bulkUpdatingKey === 'tea'}
                                                        disabled={disabled}
                                                        options={TEA_STATUS_OPTIONS}
                                                        onChange={handleUpdateAllTeaStatus}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}

                        {/* Product order items */}
                                {Array.isArray(selectedOrder.productStatuses) && selectedOrder.productStatuses.length > 0 && (
                                    <section>
                                        <Divider orientation={'left' as any}>Sản phẩm trong đơn</Divider>
                                        {renderProductItems(selectedOrder.productStatuses)}
                                    </section>
                                )}

                        {/* Tea order items */}
                                {Array.isArray(selectedOrder.teaStatuses) && selectedOrder.teaStatuses.length > 0 && (
                                    <section>
                                        <Divider orientation={'left' as any}>Cây trà trong đơn</Divider>
                                        {renderTeaItems(selectedOrder.teaStatuses)}
                                    </section>
                                )}

                        {(!Array.isArray(selectedOrder.teaStatuses) || selectedOrder.teaStatuses.length === 0) &&
                            selectedOrder.teaStatus !== undefined &&
                            selectedOrder.teaStatus !== null && (
                                <div
                                    style={{
                                        border: '1px dashed #d9d9d9',
                                        borderRadius: 6,
                                        color: '#8c8c8c',
                                        marginBottom: 16,
                                        padding: 12,
                                    }}
                                >
                                    Đơn này có trạng thái cây trà nhưng API chi tiết chưa trả mã cây trà (teaId), nên
                                    chưa thể cập nhật tiến độ cây ngay trong đơn.
                                </div>
                            )}

                        {Array.isArray(selectedOrder.productHistory) && selectedOrder.productHistory.length > 0 && (
                            <>
                                <Divider orientation={'left' as any}>Lịch sử đơn sản phẩm</Divider>
                                <Table
                                    rowKey={(row) => row.id ?? `${row.createdDate}-${row.status}`}
                                    columns={historyColumns}
                                    dataSource={selectedOrder.productHistory}
                                    pagination={false}
                                    size="small"
                                    style={{marginBottom: 16}}
                                />
                            </>
                        )}

                        {Array.isArray(selectedOrder.teaHistory) && selectedOrder.teaHistory.length > 0 && (
                            <>
                                <Divider orientation={'left' as any}>Lịch sử đơn cây trà</Divider>
                                <Table
                                    rowKey={(row) => row.id ?? `${row.createdDate}-${row.status}`}
                                    columns={historyColumns}
                                    dataSource={selectedOrder.teaHistory}
                                    pagination={false}
                                    size="small"
                                />
                            </>
                        )}

                        {/* Fallback if no items yet */}
                        {(!Array.isArray(selectedOrder.productStatuses) ||
                            selectedOrder.productStatuses.length === 0) &&
                            (!Array.isArray(selectedOrder.teaStatuses) || selectedOrder.teaStatuses.length === 0) && (
                                <div style={{color: '#999', textAlign: 'center', padding: 40}}>
                                    Không có chi tiết sản phẩm
                                </div>
                            )}
                            </div>
                        );
                    })()}
            </Drawer>

            {/* Cancel Order Modal */}
            <Modal
                title="Huỷ đơn hàng"
                open={cancelModalOpen}
                onCancel={() => {
                    setCancelModalOpen(false);
                    setCancelReason('');
                }}
                onOk={handleCancelOrder}
                confirmLoading={cancelling}
                okText="Xác nhận huỷ"
                cancelText="Đóng"
                okButtonProps={{danger: true, disabled: !cancelReason.trim()}}
            >
                <p style={{marginBottom: 12}}>Nhập lý do huỷ đơn hàng #{getOrderId(selectedOrder)}:</p>
                <Input.TextArea
                    rows={3}
                    placeholder="Ví dụ: Khách hàng đổi ý, hết hàng..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                />
            </Modal>

            <Modal
                title={progressTea ? `Tiến độ trồng cây - ${progressTea.name}` : 'Tiến độ trồng cây'}
                open={progressModalOpen}
                onCancel={() => {
                    setProgressModalOpen(false);
                    setProgressTea(null);
                    setProgressRecords([]);
                }}
                footer={null}
                width={900}
                destroyOnHidden
            >
                <div className="mt-4">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <Input.Search
                            placeholder="Tìm tiêu đề tiến độ..."
                            allowClear
                            style={{maxWidth: 280}}
                            onSearch={(value) => {
                                setProgressKeyword(value);
                                setProgressPageIndex(1);
                            }}
                        />
                        <Button
                            type="primary"
                            icon={<Plus size={15} />}
                            onClick={openCreateProgress}
                            style={{background: '#3B5518'}}
                        >
                            Thêm tiến độ
                        </Button>
                    </div>
                    <Table
                        rowKey="id"
                        columns={progressColumns}
                        dataSource={progressRecords}
                        loading={progressLoading}
                        scroll={{x: 'max-content'}}
                        pagination={{
                            current: progressPageIndex,
                            pageSize: 10,
                            total: progressTotal,
                            showTotal: (t) => `Tổng ${t} tiến độ`,
                            onChange: (page) => setProgressPageIndex(page),
                            showSizeChanger: false,
                        }}
                        locale={{emptyText: 'Chưa có tiến độ trồng cây'}}
                    />
                </div>
            </Modal>

            <Modal
                title={editingProgress ? 'Chỉnh sửa tiến độ' : 'Thêm tiến độ trồng mới'}
                open={progressFormOpen}
                onCancel={() => {
                    setProgressFormOpen(false);
                    setEditingProgress(null);
                }}
                onOk={handleSaveProgress}
                confirmLoading={progressSaving}
                okText={editingProgress ? 'Lưu' : 'Thêm'}
                cancelText="Huỷ"
                width={620}
                destroyOnHidden
            >
                <Form
                    form={progressForm}
                    layout="vertical"
                    className="mt-4"
                >
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item label="Cây trà">
                                <Input
                                    value={progressTea ? `${progressTea.name} (#${progressTea.id})` : ''}
                                    disabled
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name="title"
                                label="Tiêu đề"
                                rules={[
                                    {required: true, message: 'Nhập tiêu đề tiến độ'},
                                    {max: 200, message: 'Tối đa 200 ký tự'},
                                ]}
                            >
                                <Input placeholder="Ví dụ: Cây ra búp non" />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name="content"
                                label="Nội dung"
                            >
                                <Input.TextArea
                                    rows={4}
                                    placeholder="Nhập mô tả tiến độ chăm sóc, sinh trưởng, thu hoạch..."
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name="images"
                                label="Hình ảnh tiến độ"
                            >
                                <ImageUploadField maxCount={6} />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
}
