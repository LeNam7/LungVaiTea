import APIBase from './config/APIBase';
import type {
    CreatePlantProgressRequest,
    UpdatePlantProgressRequest,
} from '@/types/swagger.types';

/** POST /api/plant-process - Thêm mới tiến độ cây trồng */
export const createPlantProcessAPI = (data: CreatePlantProgressRequest) =>
    APIBase.post('/api/plant-process', data);

/** PUT /api/plant-process - Cập nhật thông tin tiến độ cây trồng */
export const updatePlantProcessAPI = (data: UpdatePlantProgressRequest) =>
    APIBase.put('/api/plant-process', data);

/** GET /api/plant-process - Lấy tất cả tiến độ cây trồng theo TeaId và OwnerId của token hiện tại */
export const getPlantProcessAPI = (params: { teaId?: number }) =>
    APIBase.get('/api/plant-process', { params });

/** GET /api/plant-process/paging - Lấy danh sách tiến độ cây trồng phân trang */
export const getPlantProcessPagingAPI = (params: {
    teaId?: number;
    ownerId?: number;
    pageIndex?: number;
    pageSize?: number;
    orderBy?: string;
    keyword?: string;
}) => APIBase.get('/api/plant-process/paging', { params });
