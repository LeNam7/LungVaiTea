import APIBase from './config/APIBase';
import type {PaginationParam} from '@/types/swagger.types';
import {getCookie} from '@/utils/cookie';

/** Schema mới theo API /api/user-address */
export interface UserAddress {
    id?: number;
    userId?: number;
    customerName?: string;
    cityId?: number;
    provinceId?: number;
    provinceName?: string;
    wardId?: number;
    wardName?: string;
    address?: string;
    phone?: string;
    isDefault?: boolean;
}

/** GET /api/user-address - Lấy tất cả địa chỉ của user hiện tại (dùng auth token) */
let addressesCache: unknown[] | null = null;
let addressesRequest: Promise<unknown[]> | null = null;
let addressesCacheToken: string | null = null;

export const invalidateAddressesCache = () => {
    addressesCache = null;
    addressesRequest = null;
    addressesCacheToken = null;
};

const getListData = (res: any) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    return [];
};

export const getAddressesAPI = () => {
    const token = getCookie('accessToken');
    if (addressesCacheToken !== token) {
        addressesCache = null;
        addressesRequest = null;
        addressesCacheToken = token;
    }

    if (addressesCache) return Promise.resolve(addressesCache);
    if (addressesRequest) return addressesRequest;

    addressesRequest = APIBase.get('/api/user-address')
        .then((res) => {
            const list = getListData(res);
            addressesCache = list;
            addressesCacheToken = token;
            return list;
        })
        .finally(() => {
            addressesRequest = null;
        });

    return addressesRequest;
};

/** GET /api/user-address/default - Lấy địa chỉ mặc định của user hiện tại */
export const getDefaultAddressAPI = () =>
    APIBase.get('/api/user-address/default');

/** GET /api/user-address/{id} - Lấy địa chỉ theo Id */
export const getAddressByIdAPI = (id: number) =>
    APIBase.get(`/api/user-address/${id}`);

/** POST /api/user-address - Thêm địa chỉ mới */
export const createAddressAPI = (data: UserAddress) =>
    APIBase.post('/api/user-address', data).then((res) => {
        invalidateAddressesCache();
        return res;
    });

/** PUT /api/user-address/{id} - Cập nhật địa chỉ theo Id */
export const updateAddressAPI = (id: number, data: UserAddress) =>
    APIBase.put(`/api/user-address/${id}`, data).then((res) => {
        invalidateAddressesCache();
        return res;
    });

/** DELETE /api/user-address/{id} - Xóa địa chỉ */
export const deleteAddressAPI = (id: number) =>
    APIBase.delete(`/api/user-address/${id}`).then((res) => {
        invalidateAddressesCache();
        return res;
    });

/** PUT /api/user-address/set-default/{id} - Đặt địa chỉ làm mặc định */
export const setDefaultAddressAPI = (id: number) =>
    APIBase.put(`/api/user-address/set-default/${id}`, {}).then((res) => {
        invalidateAddressesCache();
        return res;
    });

/** POST /api/user-address/paging - Danh sách địa chỉ phân trang */
export const getAddressesPagingAPI = (data: PaginationParam) =>
    APIBase.post('/api/user-address/paging', data);
