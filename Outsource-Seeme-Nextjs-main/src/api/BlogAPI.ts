import APIBase from './config/APIBase';
import type {BlogPaginationParam, Blog} from '@/types/swagger.types';

/** POST /api/blog/paging - Lấy danh sách bài viết phân trang */
export const getBlogsPagingAPI = (data: BlogPaginationParam) =>
    APIBase.post('/api/blog/paging', data);

/** GET /api/blog/{id} - Lấy chi tiết bài viết theo ID */
export const getBlogByIdAPI = (id: number) =>
    APIBase.get(`/api/blog/${id}`);

/** GET /api/blog/slug/{slug} - Lấy bài viết theo slug (dùng cho client) */
export const getBlogBySlugAPI = (slug: string) =>
    APIBase.get(`/api/blog/slug/${slug}`);

/** POST /api/blog - Tạo bài viết mới */
export const createBlogAPI = (data: Blog) =>
    APIBase.post('/api/blog', data);

/** PUT /api/blog/{id} - Cập nhật bài viết */
export const updateBlogAPI = (id: number, data: Blog) =>
    APIBase.put(`/api/blog/${id}`, data);

/** DELETE /api/blog/{id} - Xoá bài viết */
export const deleteBlogAPI = (id: number) =>
    APIBase.delete(`/api/blog/${id}`);
