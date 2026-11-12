import {Tag, Tooltip} from 'antd';

export enum OrderFulfillmentStatus {
    Pending = 0,
    Processing = 1,
    Shipping = 2,
    Completed = 3,
    Cancelled = 4,
    Refunded = 5,
}

export const STATUS_META: Record<number, {label: string; color: string; description: string}> = {
    [OrderFulfillmentStatus.Pending]: {
        label: 'Chờ xác nhận',
        color: 'gold',
        description: 'Đơn mới tạo, chờ xác nhận xử lý.',
    },
    [OrderFulfillmentStatus.Processing]: {
        label: 'Đang chuẩn bị',
        color: 'blue',
        description: 'Đơn đã xác nhận và đang chuẩn bị hàng.',
    },
    [OrderFulfillmentStatus.Shipping]: {
        label: 'Đang giao',
        color: 'cyan',
        description: 'Đơn đang trong quá trình vận chuyển.',
    },
    [OrderFulfillmentStatus.Completed]: {
        label: 'Hoàn thành',
        color: 'green',
        description: 'Đơn đã hoàn tất.',
    },
    [OrderFulfillmentStatus.Cancelled]: {
        label: 'Đã huỷ',
        color: 'red',
        description: 'Đơn đã bị huỷ.',
    },
    [OrderFulfillmentStatus.Refunded]: {
        label: 'Hoàn tiền',
        color: 'purple',
        description: 'Đơn đã hoặc đang xử lý hoàn tiền.',
    },
};

export const normalizeOrderStatus = (value: unknown): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
};

export const getOrderLikeId = (order: any) => Number(order?.orderId ?? order?.id ?? order?.OrderId ?? order?.Id ?? 0);

export const getOrderTypeLabel = (orderType?: string | null) => {
    if (orderType === 'Both') return 'Cây trà & Sản phẩm';
    if (orderType === 'Tea') return 'Cây trà';
    if (orderType === 'Product') return 'Sản phẩm';
    return orderType || 'Không rõ';
};

export const getDerivedOrderStatus = (order: any): number => {
    if (order?.reasonCancellation) return OrderFulfillmentStatus.Cancelled;
    const explicitStatus = normalizeOrderStatus(order?.orderStatus ?? order?.status);
    if (explicitStatus !== null) return explicitStatus;
    const statusValues = [order?.productStatus, order?.teaStatus]
        .map(normalizeOrderStatus)
        .filter((status): status is number => status !== null);
    if (!statusValues.length) return OrderFulfillmentStatus.Pending;
    if (statusValues.every((status) => status === OrderFulfillmentStatus.Cancelled)) return OrderFulfillmentStatus.Cancelled;
    if (statusValues.every((status) => status === OrderFulfillmentStatus.Completed)) return OrderFulfillmentStatus.Completed;
    if (statusValues.some((status) => status === OrderFulfillmentStatus.Shipping)) return OrderFulfillmentStatus.Shipping;
    if (statusValues.some((status) => status === OrderFulfillmentStatus.Processing)) return OrderFulfillmentStatus.Processing;
    return statusValues[0] ?? OrderFulfillmentStatus.Pending;
};

export const renderOrderStatusTag = (value: unknown, fallbackLabel = 'Chờ xác nhận') => {
    const status = normalizeOrderStatus(value);
    const meta = status !== null ? STATUS_META[status] : null;
    const safeMeta = meta ?? {
        label: status === null ? fallbackLabel : `Trạng thái ${status}`,
        color: status === null ? 'gold' : 'default',
        description: status === null ? 'Chưa có trạng thái chi tiết từ hệ thống.' : 'Trạng thái chưa được định nghĩa.',
    };
    return (
        <Tooltip title={safeMeta.description}>
            <Tag color={safeMeta.color}>{safeMeta.label}</Tag>
        </Tooltip>
    );
};

export const renderPaymentTag = (order: any) => {
    const totalPrice = Number(order?.totalPrice ?? 0);
    const totalPayment = Number(order?.totalPayment ?? 0);
    if (totalPrice > 0 && totalPayment >= totalPrice) return <Tag color="green">Đã TT</Tag>;
    if (totalPayment > 0) return <Tag color="blue">TT một phần</Tag>;
    return <Tag color="gold">Chưa TT</Tag>;
};
