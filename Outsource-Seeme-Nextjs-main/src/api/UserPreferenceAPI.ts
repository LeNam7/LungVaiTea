import APIBase from './config/APIBase';
import {
    TrackingAction,
    TrackingType,
    type TrackingCreatedModel,
    type TrackingGetModel,
} from '@/types/swagger.types';

export type TrackingRecord = {
    userId?: number;
    type?: TrackingType;
    action?: TrackingAction;
    itemId?: number;
    itemName?: string | null;
    image?: string | null;
    id?: number;
    trackingId?: number;
    createdDate?: string | null;
    updatedDate?: string | null;
    isDelete?: boolean;
    product?: unknown;
    tea?: unknown;
    item?: unknown;
};

export type TrackingToggleResult = {
    tracked: boolean;
    liked: boolean;
    id: number;
    tracking?: TrackingRecord | null;
};

type TrackingDeleteLookup = {
    id: number;
    type: TrackingType;
    action: TrackingAction;
    itemId: number;
};

const unwrap = (res: any) => res?.data ?? res;

const getListData = (res: any) => {
    const inner = unwrap(res);
    if (Array.isArray(inner)) return inner;
    if (Array.isArray(inner?.data)) return inner.data;
    return [];
};

const getTrackingId = (tracking: any) =>
    Number(tracking?.id ?? tracking?.trackingId ?? tracking?.tracking?.id ?? 0);

const isMatchingTracking = (tracking: any, data: TrackingGetModel) =>
    Boolean(
        tracking &&
        Number(tracking.type) === Number(data.type) &&
        Number(tracking.action) === Number(data.action) &&
        Number(tracking.itemId) === Number(data.itemId),
    );

const unwrapTrackingRecord = (res: any): TrackingRecord | null => {
    const inner = unwrap(res);
    const tracking = Array.isArray(inner) ? inner[0] : Array.isArray(inner?.data) ? inner.data[0] : inner;
    if (!tracking || typeof tracking !== 'object') return null;
    return tracking;
};

const findTrackingRecord = (res: any, data: TrackingGetModel): TrackingRecord | null => {
    const list = getListData(res);
    const tracking = list.find((item: any) => isMatchingTracking(item, data));
    if (tracking) return tracking;

    const single = unwrapTrackingRecord(res);
    return isMatchingTracking(single, data) ? single : null;
};

const isHttpStatus = (error: any, status: number) => Number(error?.response?.status) === status;

let trackingListCacheVersion = 0;
const trackingListCache = new Map<string, any[]>();
const trackingListRequests = new Map<string, Promise<any[]>>();
const trackingActionCache = new Map<string, any[]>();
const trackingActionRequests = new Map<string, Promise<any[]>>();
const trackingItemRequests = new Map<string, Promise<TrackingRecord | null>>();
const trackingViewRequests = new Map<string, Promise<any>>();

const getUserCacheKey = (userId?: number) => (userId ? String(userId) : 'current');
const getTrackingActionCacheKey = (action: TrackingAction, userId?: number) =>
    `${getUserCacheKey(userId)}:${action}`;
const getTrackingListCacheKey = (action: TrackingAction, type: TrackingType, userId?: number) =>
    `${getUserCacheKey(userId)}:${action}:${type}`;
const getTrackingItemCacheKey = (type: TrackingType, action: TrackingAction, itemId: number) =>
    `${type}:${action}:${itemId}`;

const invalidateTrackingListCache = () => {
    trackingListCacheVersion += 1;
    trackingListCache.clear();
    trackingListRequests.clear();
    trackingActionCache.clear();
    trackingActionRequests.clear();
    trackingItemRequests.clear();
};

export const invalidateTrackingCache = invalidateTrackingListCache;

export const getCachedTrackingByActionAPI = (action: TrackingAction, userId?: number) => {
    const key = getTrackingActionCacheKey(action, userId);
    const cached = trackingActionCache.get(key);
    if (cached) return Promise.resolve(cached);

    const existingRequest = trackingActionRequests.get(key);
    if (existingRequest) return existingRequest;

    const requestVersion = trackingListCacheVersion;
    const request = getTrackingByActionAPI(action)
        .then((res) => {
            const list = getListData(res).filter((item: any) => Number(item?.action) === action);
            if (requestVersion === trackingListCacheVersion) {
                trackingActionCache.set(key, list);
            }
            return list;
        })
        .finally(() => {
            if (trackingActionRequests.get(key) === request) {
                trackingActionRequests.delete(key);
            }
        });

    trackingActionRequests.set(key, request);
    return request;
};

const getCachedTrackingList = (action: TrackingAction, type: TrackingType, userId?: number) => {
    const key = getTrackingListCacheKey(action, type, userId);
    const cached = trackingListCache.get(key);
    if (cached) return Promise.resolve(cached);

    const existingRequest = trackingListRequests.get(key);
    if (existingRequest) return existingRequest;

    const requestVersion = trackingListCacheVersion;
    const request = getCachedTrackingByActionAPI(action, userId)
        .then((list) => {
            const filteredList = list.filter(
                (item: any) => Number(item?.type) === type && Number(item?.action) === action,
            );
            if (requestVersion === trackingListCacheVersion) {
                trackingListCache.set(key, filteredList);
            }
            return filteredList;
        })
        .finally(() => {
            if (trackingListRequests.get(key) === request) {
                trackingListRequests.delete(key);
            }
        });

    trackingListRequests.set(key, request);
    return request;
};

/** POST /api/tracking/get */
export const getTrackingAPI = (data: TrackingGetModel) =>
    APIBase.post('/api/tracking/get', data);

export const getTrackingByItemAPI = async (data: TrackingGetModel): Promise<TrackingRecord | null> => {
    try {
        return unwrapTrackingRecord(await getTrackingAPI(data));
    } catch (error: any) {
        if (isHttpStatus(error, 404)) return null;
        throw error;
    }
};

export const getTrackingRecordAPI = (data: TrackingGetModel): Promise<TrackingRecord | null> => {
    const {type, action, itemId} = data;
    if (!type || !action || !itemId) return Promise.resolve(null);

    const key = getTrackingItemCacheKey(type, action, itemId);
    const existingRequest = trackingItemRequests.get(key);
    if (existingRequest) return existingRequest;

    const request = (async () => {
        try {
            const tracking = findTrackingRecord(await getTrackingAPI(data), data);
            if (tracking) return tracking;
        } catch (error: any) {
            if (!isHttpStatus(error, 404)) throw error;
        }

        const byAction = await getTrackingByActionAPI(action);
        return findTrackingRecord(byAction, data);
    })().finally(() => {
        if (trackingItemRequests.get(key) === request) {
            trackingItemRequests.delete(key);
        }
    });

    trackingItemRequests.set(key, request);
    return request;
};

/** GET /api/tracking/get-by-action?action=... */
export const getTrackingByActionAPI = (action: TrackingAction) =>
    APIBase.get('/api/tracking/get-by-action', {params: {action}});

/** POST /api/tracking */
export const createTrackingAPI = (data: TrackingCreatedModel) =>
    APIBase.post('/api/tracking', data);

/** DELETE /api/tracking/{id} */
export const deleteTrackingAPI = (id: number) =>
    APIBase.delete(`/api/tracking/${id}`);

const createTrackingAndVerifyAPI = async (data: TrackingCreatedModel): Promise<TrackingRecord | null> => {
    try {
        const created = await createTrackingAPI(data);
        const createdTracking = findTrackingRecord(created, data);
        if (getTrackingId(createdTracking)) return createdTracking;
    } catch {
        /*
         * The current API can return HTTP 500 for POST /api/tracking even when
         * the record is actually created. Verify before reporting failure.
         */
    }

    const verified = await getTrackingRecordAPI(data);
    if (getTrackingId(verified)) return verified;
    return null;
};

const deleteTrackingAndVerifyAPI = async (id: number, data: TrackingGetModel) => {
    try {
        await deleteTrackingAPI(id);
        return;
    } catch {
        const verified = await getTrackingRecordAPI(data);
        if (!getTrackingId(verified)) return;
        throw new Error('Không thể xoá tracking');
    }
};

export const getFavoriteProductsAPI = async (_userId?: number) => {
    return getCachedTrackingList(TrackingAction.Like, TrackingType.Product, _userId);
};

export const getViewedProductsAPI = async (_userId?: number) => {
    return getCachedTrackingList(TrackingAction.View, TrackingType.Product, _userId);
};

export const getFavoriteTeasAPI = async (_userId?: number) => {
    return getCachedTrackingList(TrackingAction.Like, TrackingType.Tea, _userId);
};

export const getViewedTeasAPI = async (_userId?: number) => {
    return getCachedTrackingList(TrackingAction.View, TrackingType.Tea, _userId);
};

export const toggleTrackingAPI = async (
    type: TrackingType,
    action: TrackingAction,
    itemId: number,
    itemName?: string | null,
) => {
    const tracking = await getTrackingRecordAPI({type, action, itemId});
    const trackingId = getTrackingId(tracking);
    const lookup = {type, action, itemId};

    if (trackingId) {
        await deleteTrackingAndVerifyAPI(trackingId, lookup);
        invalidateTrackingListCache();
        return {tracked: false, liked: false, id: trackingId, tracking};
    }

    const createdTracking = await createTrackingAndVerifyAPI({type, action, itemId, itemName});
    const createdTrackingId = getTrackingId(createdTracking);
    if (!createdTrackingId) throw new Error('Không thể thêm tracking');
    invalidateTrackingListCache();
    return {tracked: true, liked: true, id: createdTrackingId, tracking: createdTracking};
};

export const ensureTrackingAPI = async (
    type: TrackingType,
    action: TrackingAction,
    itemId: number,
    itemName?: string | null,
) => {
    const tracking = await getTrackingRecordAPI({type, action, itemId});
    if (getTrackingId(tracking)) return tracking;

    const createdTracking = await createTrackingAndVerifyAPI({type, action, itemId, itemName});
    const createdTrackingId = getTrackingId(createdTracking);
    if (!createdTrackingId) throw new Error('Không thể thêm tracking');
    invalidateTrackingListCache();
    return createdTracking;
};

export const trackItemViewAPI = (
    type: TrackingType,
    itemId: number,
    itemName?: string | null,
) => {
    const requestKey = `${type}:${TrackingAction.View}:${itemId}`;
    const existingRequest = trackingViewRequests.get(requestKey);
    if (existingRequest) return existingRequest;

    const request = (async () => {
        return ensureTrackingAPI(type, TrackingAction.View, itemId, itemName);
    })().finally(() => {
        if (trackingViewRequests.get(requestKey) === request) {
            trackingViewRequests.delete(requestKey);
        }
    });

    trackingViewRequests.set(requestKey, request);
    return request;
};

export const toggleFavoriteProductAPI = (_userId: number | undefined, productId: number, productName?: string | null) =>
    toggleTrackingAPI(TrackingType.Product, TrackingAction.Like, productId, productName);

export const toggleFavoriteTeaAPI = (_userId: number | undefined, teaId: number, teaName?: string | null) =>
    toggleTrackingAPI(TrackingType.Tea, TrackingAction.Like, teaId, teaName);

export const trackViewedProductAPI = (_userId: number | undefined, productId: number, productName?: string | null) =>
    trackItemViewAPI(TrackingType.Product, productId, productName);

export const trackViewedTeaAPI = (_userId: number | undefined, teaId: number, teaName?: string | null) =>
    trackItemViewAPI(TrackingType.Tea, teaId, teaName);

export const clearViewedItemsAPI = async (type: TrackingType, _userId?: number) => {
    void _userId;
    const res = await getTrackingByActionAPI(TrackingAction.View);
    const viewedItems = getListData(res).filter((item: any) => Number(item?.type) === type);
    await Promise.all(
        viewedItems
            .map((tracking: any) => ({
                id: getTrackingId(tracking),
                type: Number(tracking?.type) as TrackingType,
                action: Number(tracking?.action) as TrackingAction,
                itemId: Number(tracking?.itemId),
            }))
            .filter((tracking: TrackingDeleteLookup) => tracking.id > 0 && tracking.itemId > 0)
            .map((tracking: TrackingDeleteLookup) => deleteTrackingAndVerifyAPI(tracking.id, tracking)),
    );
    invalidateTrackingListCache();
};

export const clearViewedProductsAPI = async (_userId?: number) =>
    clearViewedItemsAPI(TrackingType.Product, _userId);

export const clearViewedTeasAPI = async (_userId?: number) =>
    clearViewedItemsAPI(TrackingType.Tea, _userId);
