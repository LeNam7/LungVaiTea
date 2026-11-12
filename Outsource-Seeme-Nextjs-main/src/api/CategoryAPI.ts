import APIBase from './config/APIBase';
import type { CategoryTea, PaginationParam } from '@/types/swagger.types';

/** POST /api/categories/paging - Lấy danh sách phân loại cây trà phân trang (20 bản ghi/trang) */
export const getCategoriesPagingAPI = (data: PaginationParam) =>
    APIBase.post('/api/categories/paging', data);

/** GET /api/categories/{id} - Lấy thông tin chi tiết phân loại cây trà theo ID */
export const getCategoryByIdAPI = (id: number) =>
    APIBase.get(`/api/categories/${id}`);

/** PUT /api/categories/{id} - Cập nhật thông tin phân loại cây trà */
export const updateCategoryAPI = (id: number, data: CategoryTea) =>
    APIBase.put(`/api/categories/${id}`, data);

/** DELETE /api/categories/{id} - Xóa phân loại cây trà */
export const deleteCategoryAPI = (id: number) =>
    APIBase.delete(`/api/categories/${id}`);

/** POST /api/categories - Thêm mới phân loại cây trà */
export const createCategoryAPI = (data: CategoryTea) =>
    APIBase.post('/api/categories', data);
