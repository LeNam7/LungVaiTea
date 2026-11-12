import APIBase from './config/APIBase';
import type {
    CreateUserByAdminInput,
    UpdateUserModel,
    PaginationParam,
} from '@/types/swagger.types';

/** POST /api/user/paging - Lấy danh sách người dùng phân trang */
export const getUsersPagingAPI = (data: PaginationParam) =>
    APIBase.post('/api/user/paging', data);

/** POST /api/user - Thêm mới người dùng bởi Admin */
export const createUserByAdminAPI = (data: CreateUserByAdminInput) =>
    APIBase.post('/api/user', data);

/** GET /api/user/{id} - Lấy thông tin người dùng theo Id */
export const getUserByIdAPI = (id: number) =>
    APIBase.get(`/api/user/${id}`);

/** PUT /api/user/{id} - Cập nhật thông tin người dùng */
export const updateUserAPI = (id: number, data: UpdateUserModel) =>
    APIBase.put(`/api/user/${id}`, data);

/** DELETE /api/user/{id} - Xóa người dùng (soft delete) */
export const deleteUserAPI = (id: number) =>
    APIBase.delete(`/api/user/${id}`);

/** PUT /api/user/block/{id} - Khóa/mở khóa tài khoản người dùng */
export const toggleBlockUserAPI = (id: number) =>
    APIBase.put(`/api/user/block/${id}`);
