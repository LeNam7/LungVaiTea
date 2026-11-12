import APIBase from './config/APIBase';
import type {Contact, PaginationParam} from '@/types/swagger.types';

export interface ContactRequest {
    name: string;
    phone: string;
    email: string;
    subject?: string;
    message?: string;
}

/** POST /api/blog/send-contact - Gửi liên hệ từ user */
export const sendContactAPI = (data: ContactRequest) =>
    APIBase.post('/api/blog/send-contact', data);

/** POST /api/blog/paging-contact - CMS phân trang danh sách liên hệ */
export const getContactsPagingAPI = (data: PaginationParam) =>
    APIBase.post('/api/blog/paging-contact', data);

/** @deprecated use sendContactAPI */
export const createContactAPI = sendContactAPI;
export type {Contact};
