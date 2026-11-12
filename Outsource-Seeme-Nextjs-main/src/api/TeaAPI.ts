import APIBase from './config/APIBase';
import type { Tea, PaginationParam } from '@/types/swagger.types';

/** POST /api/teas/paging - Lấy danh sách cây trà phân trang (20 bản ghi/trang) */
export const getTeasPagingAPI = (data: PaginationParam) =>
    APIBase.post('/api/teas/paging', data);

/** GET /api/teas/{id} - Lấy thông tin chi tiết cây trà theo ID */
export const getTeaByIdAPI = (id: number) =>
    APIBase.get(`/api/teas/${id}`);

/** GET /api/teas/owner - Lấy danh sách cây trà thuộc sở hữu của user hiện tại */
export const getOwnerTeasAPI = () =>
    APIBase.get('/api/teas/owner');

/** PUT /api/teas/{id} - Cập nhật thông tin cây trà */
export const updateTeaAPI = (id: number, data: Tea) =>
    APIBase.put(`/api/teas/${id}`, data);

/** DELETE /api/teas/{id} - Xóa cây trà */
export const deleteTeaAPI = (id: number) =>
    APIBase.delete(`/api/teas/${id}`);

/** POST /api/teas - Thêm mới cây trà */
export const createTeaAPI = (data: Tea) =>
    APIBase.post('/api/teas', data);
