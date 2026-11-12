import APIBase from './config/APIBase';
import type {TeaGroupRecord, PaginationParam} from '@/types/swagger.types';

/** POST /api/tea-groups/paging - Lấy danh sách nhóm trà phân trang */
export const getTeaGroupsPagingAPI = (data: PaginationParam) =>
    APIBase.post('/api/tea-groups/paging', data);

/** GET /api/tea-groups/{slug} - Lấy thông tin nhóm trà theo slug */
export const getTeaGroupBySlugAPI = (slug: string) =>
    APIBase.get(`/api/tea-groups/${slug}`);

/** POST /api/tea-groups - Thêm mới nhóm trà */
export const createTeaGroupAPI = (data: TeaGroupRecord) =>
    APIBase.post('/api/tea-groups', data);

/** PUT /api/tea-groups/{slug} - Cập nhật nhóm trà (không đổi được slug) */
export const updateTeaGroupAPI = (slug: string, data: TeaGroupRecord) =>
    APIBase.put(`/api/tea-groups/${slug}`, data);

/** DELETE /api/tea-groups/{slug} - Xóa mềm nhóm trà (còn danh mục thì BE trả 400) */
export const deleteTeaGroupAPI = (slug: string) =>
    APIBase.delete(`/api/tea-groups/${slug}`);
