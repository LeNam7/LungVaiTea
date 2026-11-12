import APIBase from './config/APIBase';
import type { Garden, PaginationParam } from '@/types/swagger.types';

/** POST /api/gardens/paging - Lấy danh sách vườn trà phân trang (20 bản ghi/trang) */
export const getGardensPagingAPI = (data: PaginationParam) =>
    APIBase.post('/api/gardens/paging', data);

/** GET /api/gardens/{id} - Lấy thông tin chi tiết vườn trà theo ID */
export const getGardenByIdAPI = (id: number) =>
    APIBase.get(`/api/gardens/${id}`);

/** PUT /api/gardens/{id} - Cập nhật thông tin vườn trà */
export const updateGardenAPI = (id: number, data: Garden) =>
    APIBase.put(`/api/gardens/${id}`, data);

/** DELETE /api/gardens/{id} - Xóa vườn trà */
export const deleteGardenAPI = (id: number) =>
    APIBase.delete(`/api/gardens/${id}`);

/** POST /api/gardens - Thêm mới vườn trà */
export const createGardenAPI = (data: Garden) =>
    APIBase.post('/api/gardens', data);
