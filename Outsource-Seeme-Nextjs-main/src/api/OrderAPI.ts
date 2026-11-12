import APIBase from './config/APIBase';
import type {
    CreateOrderRequestModel,
    PaginationParam,
    OrderProductStatus,
    OrderTeaStatus,
} from '@/types/swagger.types';

/** POST /api/order - Tạo đơn hàng mới */
export const createOrderAPI = (data: CreateOrderRequestModel) =>
    APIBase.post('/api/order', data);

/** GET /api/order/{id} - Lấy chi tiết đơn hàng theo Id */
export const getOrderByIdAPI = (id: number) =>
    APIBase.get(`/api/order/${id}`);

/** POST /api/order/paging - Lấy danh sách đơn hàng phân trang (20 bản ghi/trang) */
export const getOrdersPagingAPI = (data: PaginationParam) =>
    APIBase.post('/api/order/paging', data);

/** POST /api/order/teas/paging - Lấy danh sách đơn hàng cây trà phân trang (20 bản ghi/trang) */
export const getOrderTeasPagingAPI = (data: PaginationParam) =>
    APIBase.post('/api/order/teas/paging', data);

/** POST /api/order/products/paging - Lấy danh sách đơn hàng sản phẩm phân trang (20 bản ghi/trang) */
export const getOrderProductsPagingAPI = (data: PaginationParam) =>
    APIBase.post('/api/order/products/paging', data);

/** GET /api/order/teas/history - Lấy lịch sử đơn hàng cây trà */
export const getOrderTeasHistoryAPI = (params?: {orderId?: number}) =>
    APIBase.get('/api/order/teas/history', {params});

/** GET /api/order/products/history - Lấy lịch sử đơn hàng sản phẩm */
export const getOrderProductsHistoryAPI = (params?: {orderId?: number}) =>
    APIBase.get('/api/order/products/history', {params});

/** PUT /api/order/product-status/{orderProductId} - Body là enum number OrderProductStatus */
export const updateOrderProductStatusAPI = (
    orderProductId: number,
    status: OrderProductStatus
) => APIBase.put(`/api/order/product-status/${orderProductId}`, status);

/** PUT /api/order/tea-status/{orderTeaId} - Body là enum number OrderTeaStatus */
export const updateOrderTeaStatusAPI = (
    orderTeaId: number,
    status: OrderTeaStatus
) => APIBase.put(`/api/order/tea-status/${orderTeaId}`, status);

/** PUT /api/order/cancel/{orderId} - Hủy đơn hàng với lý do */
export const cancelOrderAPI = (orderId: number, reason: string) =>
    APIBase.put(`/api/order/cancel/${orderId}`, JSON.stringify(reason));

/** PUT /api/order/payment/{orderId} - Body là số tiền đã thanh toán (admin đối soát tay) */
export const updateOrderPaymentAPI = (orderId: number, totalPayment: number) =>
    APIBase.put(`/api/order/payment/${orderId}`, totalPayment);
