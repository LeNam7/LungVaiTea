export interface PagingView<T> {
    data: T[];
    totalRecords: number;
    totalPages: number;
}

export const unwrapApiData = <T = unknown>(response: unknown): T => {
    const value = response as {data?: T} | T;
    if (
        value &&
        typeof value === 'object' &&
        'data' in value &&
        ('statusCode' in value || 'message' in value)
    ) {
        return (value as {data?: T}).data as T;
    }
    return value as T;
};

export const unwrapListData = <T = unknown>(response: unknown): T[] => {
    const data = unwrapApiData<any>(response);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    return [];
};

export const unwrapPagingData = <T = unknown>(response: unknown): PagingView<T> => {
    const data = unwrapApiData<any>(response);

    if (Array.isArray(data)) {
        return {
            data,
            totalRecords: data.length,
            totalPages: data.length ? 1 : 0,
        };
    }

    return {
        data: Array.isArray(data?.data) ? data.data : [],
        totalRecords: Number(data?.totalRecords ?? 0),
        totalPages: Number(data?.totalPages ?? 0),
    };
};
