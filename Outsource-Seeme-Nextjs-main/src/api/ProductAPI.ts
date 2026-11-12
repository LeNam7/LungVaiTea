import APIBase from './config/APIBase';
import type { Product, PaginationParam } from '@/types/swagger.types';

/** POST /api/product/paging - Lấy danh sách sản phẩm phân trang (20 bản ghi/trang) */
export const getProductsPagingAPI = (data: PaginationParam) =>
    APIBase.post('/api/product/paging', data);

/** GET /api/product/{id} - Lấy thông tin chi tiết sản phẩm theo ID */
export const getProductByIdAPI = (id: number) =>
    APIBase.get(`/api/product/${id}`);

/** PUT /api/product/{id} - Cập nhật thông tin sản phẩm */
export const updateProductAPI = (id: number, data: Product) =>
    APIBase.put(`/api/product/${id}`, data);

/** DELETE /api/product/{id} - Xóa sản phẩm */
export const deleteProductAPI = (id: number) =>
    APIBase.delete(`/api/product/${id}`);

/** GET /api/product/category/{id} - Lấy danh sách sản phẩm theo ID danh mục */
export const getProductsByCategoryAPI = (id: number) =>
    APIBase.get(`/api/product/category/${id}`);

/** POST /api/product - Thêm mới sản phẩm */
export const createProductAPI = (data: Product) =>
    APIBase.post('/api/product', data);

/** GET /api/product/sold-counts - Tổng hợp số đã bán theo sản phẩm (chỉ tính đơn Hoàn thành).
 *  Sản phẩm chưa bán không có trong danh sách (FE coi như 0). Endpoint mới từ BE 30/10/2026;
 *  nếu BE chưa deploy thì request lỗi và FE tự rơi về không có dữ liệu doanh số. */
export const getSoldCountsAPI = () => APIBase.get('/api/product/sold-counts');
