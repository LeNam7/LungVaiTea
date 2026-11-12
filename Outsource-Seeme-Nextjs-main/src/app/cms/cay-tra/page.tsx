'use client';
import {useCallback, useEffect, useMemo, useState} from 'react';
import type {Key} from 'react';
import {
    Button,
    Col,
    Form,
    Input,
    InputNumber,
    message,
    Modal,
    Popconfirm,
    Row,
    Select,
    Space,
    Spin,
    Switch,
    Table,
    Tag,
    Typography,
} from 'antd';
import type {ColumnsType} from 'antd/es/table';
import {Download, Edit2, Eye, Plus, QrCode, Trash2, Leaf, Sprout} from 'lucide-react';
import download from 'downloadjs';
import JSZip from 'jszip';
import Image from 'next/image';
import ImageUploadField from '@/components/cms/ImageUploadField';
import {getTeasPagingAPI, getTeaByIdAPI, createTeaAPI, updateTeaAPI, deleteTeaAPI} from '@/api/TeaAPI';
import {createPlantProcessAPI, getPlantProcessPagingAPI, updatePlantProcessAPI} from '@/api/PlantProcessAPI';
import {getGardensPagingAPI} from '@/api/GardenAPI';
import {normalizeSearchText} from '@/lib/tea-taxonomy';
import {unwrapApiData, unwrapPagingData} from '@/api/response';
import {getFirstApiImageUrl, parseApiImageList, resolveApiImageUrl} from '@/utils/imageUrl';
import {
    generateTeaQrDownloadBlob,
    generateTeaQrPreviewDataUrl,
    generateTeaQrThumbDataUrl,
    getTeaQrFileName,
    getTeaQrUrl,
} from '@/utils/teaQr';
import type {Tea, Garden, PlantProgressResponse} from '@/types/swagger.types';
import dayjs from 'dayjs';
import {formatTeaVolume} from '@/utils/teaFields';

const {Title} = Typography;

const getFirstImage = (images?: string | null): string => {
    return getFirstApiImageUrl(images, '/images/bosuutaptraimg.png');
};

const getImageList = (images?: string | null): string[] => {
    return parseApiImageList(images);
};

const resolveImageUrl = (path: string) => {
    return resolveApiImageUrl(path, '/images/bosuutaptraimg.png');
};

const TeaQrCell = ({
    tea,
    onPreview,
    onDownload,
}: {
    tea: Tea;
    onPreview: (tea: Tea) => void;
    onDownload: (tea: Tea) => void;
}) => {
    const [qrSrc, setQrSrc] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        const id = tea.id;
        if (!id) return;

        generateTeaQrThumbDataUrl({id, name: tea.name}, 132)
            .then((src) => {
                if (mounted) setQrSrc(src);
            })
            .catch(() => {
                if (mounted) setQrSrc(null);
            });

        return () => {
            mounted = false;
        };
    }, [tea.id, tea.name]);

    if (!tea.id) return <span className="text-gray-400">-</span>;

    return (
        <div
            className="group relative h-[58px] w-[58px] overflow-hidden rounded-md border border-[#DDEBAA] bg-white p-1 shadow-[0_1px_4px_rgba(59,85,24,0.12)] transition hover:border-[#7F9635] hover:shadow-[0_4px_12px_rgba(59,85,24,0.18)]"
            title={getTeaQrUrl(tea.id)}
        >
            <div className="flex h-full w-full items-center justify-center">
                {qrSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={qrSrc}
                        alt={`QR cây trà #${tea.id}`}
                        className="h-full w-full object-contain"
                    />
                ) : (
                    <QrCode
                        size={24}
                        color="#3B5518"
                    />
                )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-[#213B0F]/45 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <button
                    type="button"
                    aria-label="Xem mã QR"
                    title="Xem mã QR"
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/92 text-[#213B0F] shadow-sm transition hover:bg-white"
                    onClick={() => onPreview(tea)}
                >
                    <Eye size={15} />
                </button>
                <button
                    type="button"
                    aria-label="Tải mã QR"
                    title="Tải mã QR"
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/92 text-[#213B0F] shadow-sm transition hover:bg-white"
                    onClick={() => onDownload(tea)}
                >
                    <Download size={15} />
                </button>
            </div>
        </div>
    );
};

export default function CayTraPage() {
    const [teas, setTeas] = useState<Tea[]>([]);
    const [pageIndex, setPageIndex] = useState(1);
    const [pageSize] = useState(20);
    const [keyword, setKeyword] = useState('');
    const [gardenFilter, setGardenFilter] = useState<number | null>(null);
    const [visibilityFilter, setVisibilityFilter] = useState<string | null>(null);
    const [soldFilter, setSoldFilter] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedTeaKeys, setSelectedTeaKeys] = useState<Key[]>([]);
    const [downloadingQr, setDownloadingQr] = useState(false);

    const [gardens, setGardens] = useState<Garden[]>([]);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingLoadingId, setEditingLoadingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [teaImagesUploading, setTeaImagesUploading] = useState(false);
    const [teaType, setTeaType] = useState('1 lá');
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [previewImg, setPreviewImg] = useState<string | null>(null);
    const [qrPreviewImg, setQrPreviewImg] = useState<string | null>(null);
    const [qrPreviewTea, setQrPreviewTea] = useState<Tea | null>(null);
    const [qrPreviewLoading, setQrPreviewLoading] = useState(false);
    const [form] = Form.useForm();
    const [progressForm] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    const [progressModalOpen, setProgressModalOpen] = useState(false);
    const [progressFormOpen, setProgressFormOpen] = useState(false);
    const [progressTea, setProgressTea] = useState<Tea | null>(null);
    const [progressRecords, setProgressRecords] = useState<PlantProgressResponse[]>([]);
    const [progressTotal, setProgressTotal] = useState(0);
    const [progressPageIndex, setProgressPageIndex] = useState(1);
    const [progressKeyword, setProgressKeyword] = useState('');
    const [progressLoading, setProgressLoading] = useState(false);
    const [progressSaving, setProgressSaving] = useState(false);
    const [editingProgress, setEditingProgress] = useState<PlantProgressResponse | null>(null);

    const fetchTeas = useCallback(async () => {
        await Promise.resolve();
        setLoading(true);
        try {
            // Lấy toàn bộ cây về rồi lọc tại chỗ: tìm kiếm phía server không khớp
            // tên/mã cây nên gõ là không ra. 233 cây là con số nhỏ, lọc client đủ nhanh
            // và chuẩn hóa không dấu được (gõ "hec" vẫn ra "Hẹc", "233" ra "08-233-E").
            const res = await getTeasPagingAPI({pageIndex: 1, pageSize: 500} as any);
            const paging = unwrapPagingData<Tea>(res);
            setTeas(paging.data);
        } catch {
            messageApi.error('Không thể tải danh sách cây trà');
        } finally {
            setLoading(false);
        }
    }, [messageApi]);

    useEffect(() => {
        void Promise.resolve().then(fetchTeas);
    }, [fetchTeas]);

    useEffect(() => {
        const fetchMeta = async () => {
            try {
                const gardenRes = await getGardensPagingAPI({pageIndex: 1, pageSize: 100});
                setGardens(unwrapPagingData<Garden>(gardenRes).data);
            } catch {
                /* silent */
            }
        };
        fetchMeta();
    }, []);

    const openCreate = () => {
        setEditingId(null);
        setTeaImagesUploading(false);
        setTeaType('1 lá');
        form.resetFields();
        form.setFieldsValue({volume: 0, isActive: true, sold: false});
        setModalOpen(true);
    };

    const openEdit = async (id: number) => {
        if (editingLoadingId || deletingId) return;
        setEditingLoadingId(id);
        try {
            const res = (await getTeaByIdAPI(id)) as any;
            const tea = unwrapApiData<Tea>(res);
            setEditingId(id);
            setTeaImagesUploading(false);
            setTeaType(tea.type || '1 lá');
            form.setFieldsValue({
                ...tea,
                categoryIds: tea.categoryIds ? tea.categoryIds.split(',').map(Number) : [],
            });
            setModalOpen(true);
        } catch {
            messageApi.error('Không thể tải thông tin cây trà');
        } finally {
            setEditingLoadingId(null);
        }
    };

    const handleSave = async () => {
        if (teaImagesUploading) {
            messageApi.warning('Vui lòng chờ upload ảnh hoàn tất');
            return;
        }
        const values = await form.validateFields();
        setSaving(true);
        try {
            const payload: Tea = {
                ...values,
                volume: Number(values.volume ?? 0),
                type: teaType,
                // Form không có ô chọn phân loại nhưng BE bắt buộc CategoryIds
                // (thiếu là 400 'The CategoryIds field is required.'). Mọi cây
                // thật hiện tại đều mang '1' nên mặc định '1' khi form không có
                // giá trị, sửa thì giữ nguyên giá trị cũ của cây đó.
                categoryIds: (Array.isArray(values.categoryIds)
                    ? values.categoryIds.join(',')
                    : values.categoryIds) || '1',
            };
            if (editingId) {
                await updateTeaAPI(editingId, payload);
                messageApi.success('Cập nhật cây trà thành công');
            } else {
                await createTeaAPI(payload);
                messageApi.success('Thêm cây trà thành công');
            }
            setModalOpen(false);
            fetchTeas();
        } catch (err: unknown) {
            const response = (err as {response?: {data?: unknown}})?.response;
            const data = response?.data;
            let serverMessage: string | undefined;
            if (typeof data === 'string') {
                serverMessage = data;
            } else if (data && typeof data === 'object') {
                const obj = data as {message?: unknown; title?: unknown; errors?: unknown};
                if (typeof obj.message === 'string') {
                    serverMessage = obj.message;
                } else if (obj.errors && typeof obj.errors === 'object') {
                    // Lỗi validate của ASP.NET: {title, errors: {field: [msg]}} - không có message.
                    const first = Object.values(obj.errors as Record<string, unknown>)
                        .flat()
                        .find((v) => typeof v === 'string');
                    if (typeof first === 'string') serverMessage = first;
                    else if (typeof obj.title === 'string') serverMessage = obj.title;
                } else if (typeof obj.title === 'string') {
                    serverMessage = obj.title;
                }
            }
            messageApi.error(
                !response
                    ? 'Mất kết nối tới máy chủ, vui lòng kiểm tra mạng rồi thử lại'
                    : serverMessage?.trim()
                      ? serverMessage.trim()
                      : 'Lưu thất bại, vui lòng thử lại',
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (deletingId || editingLoadingId) return;
        setDeletingId(id);
        try {
            await deleteTeaAPI(id);
            messageApi.success('Xoá cây trà thành công');
            fetchTeas();
        } catch {
            messageApi.error('Xoá thất bại');
        } finally {
            setDeletingId(null);
        }
    };

    const fetchProgress = useCallback(
        async (teaId = progressTea?.id) => {
            if (!teaId) return;
            await Promise.resolve();
            setProgressLoading(true);
            try {
                const res = await getPlantProcessPagingAPI({
                    teaId,
                    pageIndex: progressPageIndex,
                    pageSize: 10,
                    orderBy: 'CreatedDate desc',
                    keyword: progressKeyword || undefined,
                });
                const paging = unwrapPagingData<PlantProgressResponse>(res);
                setProgressRecords(paging.data);
                setProgressTotal(paging.totalRecords);
            } catch {
                messageApi.error('Không thể tải tiến độ cây trồng');
            } finally {
                setProgressLoading(false);
            }
        },
        [messageApi, progressKeyword, progressPageIndex, progressTea?.id],
    );

    useEffect(() => {
        if (progressModalOpen && progressTea?.id) {
            void Promise.resolve().then(() => fetchProgress(progressTea.id));
        }
    }, [fetchProgress, progressModalOpen, progressTea?.id]);

    const openProgress = (tea: Tea) => {
        setProgressTea(tea);
        setProgressRecords([]);
        setProgressTotal(0);
        setProgressKeyword('');
        setProgressPageIndex(1);
        setProgressModalOpen(true);
    };

    const openCreateProgress = () => {
        if (!progressTea?.id) return;
        setEditingProgress(null);
        progressForm.resetFields();
        setProgressFormOpen(true);
    };

    const openEditProgress = (record: PlantProgressResponse) => {
        setEditingProgress(record);
        progressForm.setFieldsValue({
            title: record.title,
            content: record.content,
            images: record.images,
        });
        setProgressFormOpen(true);
    };

    const handleSaveProgress = async () => {
        const teaId = progressTea?.id;
        if (!teaId) return;
        const values = await progressForm.validateFields();
        setProgressSaving(true);
        try {
            if (editingProgress?.id) {
                await updatePlantProcessAPI({
                    id: editingProgress.id,
                    title: values.title,
                    content: values.content,
                    images: values.images,
                });
                messageApi.success('Cập nhật tiến độ thành công');
            } else {
                await createPlantProcessAPI({
                    teaId,
                    title: values.title,
                    content: values.content,
                    images: values.images,
                });
                messageApi.success('Thêm tiến độ thành công');
            }
            setProgressFormOpen(false);
            setEditingProgress(null);
            await fetchProgress(teaId);
        } catch {
            messageApi.error('Lưu tiến độ thất bại');
        } finally {
            setProgressSaving(false);
        }
    };

    // Lọc tại chỗ theo vườn + hiển thị + đã bán + từ khóa chuẩn hóa không dấu (tên/mã cây, tên vườn,
    // loại cây, mô tả, id). Gõ không dấu vẫn khớp chữ có dấu, gõ số vẫn khớp mã cây.
    const displayedTeas = useMemo(() => {
        const words = normalizeSearchText(keyword).split(' ').filter(Boolean);
        return teas.filter((tea) => {
            if (gardenFilter && tea.gardenId !== gardenFilter) return false;
            if (visibilityFilter === 'visible' && !tea.isActive) return false;
            if (visibilityFilter === 'hidden' && tea.isActive) return false;
            if (soldFilter === 'sold' && !tea.sold) return false;
            if (soldFilter === 'unsold' && tea.sold) return false;
            if (words.length === 0) return true;
            const gardenName = gardens.find((g) => g.id === tea.gardenId)?.name ?? '';
            const haystack = normalizeSearchText(
                `${tea.name ?? ''} ${gardenName} ${tea.type ?? ''} ${tea.description ?? ''} ${tea.id ?? ''}`,
            );
            return words.every((word) => haystack.includes(word));
        });
    }, [teas, gardens, gardenFilter, visibilityFilter, soldFilter, keyword]);
    const selectedTeas = useMemo(
        () => displayedTeas.filter((tea) => tea.id && selectedTeaKeys.includes(tea.id)),
        [displayedTeas, selectedTeaKeys],
    );

    const downloadTeaQrFile = useCallback(async (tea: Tea) => {
        if (!tea.id) throw new Error('Cây trà chưa có ID');
        const blob = await generateTeaQrDownloadBlob({id: tea.id, name: tea.name});
        download(blob, getTeaQrFileName({id: tea.id, name: tea.name}), 'image/png');
    }, []);

    const handleDownloadTeaQr = useCallback(
        async (tea: Tea) => {
            setDownloadingQr(true);
            try {
                await downloadTeaQrFile(tea);
                messageApi.success('Đã tạo ảnh QR');
            } catch {
                messageApi.error('Không thể tạo ảnh QR');
            } finally {
                setDownloadingQr(false);
            }
        },
        [downloadTeaQrFile, messageApi],
    );

    const handlePreviewTeaQr = useCallback(
        async (tea: Tea) => {
            if (!tea.id) return;

            setQrPreviewTea(tea);
            setQrPreviewImg(null);
            setQrPreviewLoading(true);
            try {
                const src = await generateTeaQrPreviewDataUrl({id: tea.id, name: tea.name});
                setQrPreviewImg(src);
            } catch {
                messageApi.error('Không thể tạo ảnh xem trước QR');
                setQrPreviewTea(null);
            } finally {
                setQrPreviewLoading(false);
            }
        },
        [messageApi],
    );

    const handleDownloadSelectedQr = useCallback(async () => {
        if (!selectedTeas.length) {
            messageApi.warning('Vui lòng chọn cây trà cần tải QR');
            return;
        }

        setDownloadingQr(true);
        try {
            if (selectedTeas.length === 1) {
                await downloadTeaQrFile(selectedTeas[0]);
            } else {
                const zip = new JSZip();
                for (const tea of selectedTeas) {
                    if (!tea.id) continue;
                    const blob = await generateTeaQrDownloadBlob({id: tea.id, name: tea.name});
                    zip.file(getTeaQrFileName({id: tea.id, name: tea.name}), blob);
                }
                const zipBlob = await zip.generateAsync({type: 'blob'});
                download(zipBlob, `ma-qr-cay-tra-${dayjs().format('YYYYMMDD-HHmm')}.zip`, 'application/zip');
            }
            messageApi.success(`Đã tạo ${selectedTeas.length} mã QR`);
        } catch {
            messageApi.error('Không thể tải mã QR đã chọn');
        } finally {
            setDownloadingQr(false);
        }
    }, [downloadTeaQrFile, messageApi, selectedTeas]);

    const columns: ColumnsType<Tea> = [
        {title: 'ID', dataIndex: 'id', key: 'id', width: 50},
        {
            title: 'Ảnh',
            dataIndex: 'images',
            key: 'images',
            width: 64,
            render: (images) => {
                const src = getFirstImage(images);
                return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={src}
                        alt=""
                        style={{width: 48, height: 48, objectFit: 'cover', borderRadius: 6, cursor: 'pointer'}}
                        onClick={() => setPreviewImg(src)}
                        onError={(e) => {
                            const i = e.currentTarget;
                            i.onerror = null;
                            i.src = '/images/videovechungtoiimg.png';
                        }}
                    />
                );
            },
        },
        {
            title: 'Tên cây trà',
            dataIndex: 'name',
            key: 'name',
            width: 130,
            ellipsis: true,
            render: (name) => (
                <span className="block truncate text-[13px] font-medium" title={name}>
                    {name}
                </span>
            ),
        },
        {
            title: 'Sản lượng (kg/năm)',
            dataIndex: 'volume',
            key: 'volume',
            width: 115,
            sorter: (a, b) => (a.volume ?? 0) - (b.volume ?? 0),
            render: (_, record) => formatTeaVolume(record, 'Chưa có trong Excel'),
        },
        {
            title: 'Loại cây',
            dataIndex: 'type',
            key: 'type',
            width: 75,
            render: (value) => value || '-',
        },
        {
            title: 'Mã QR',
            key: 'qr',
            width: 85,
            render: (_, record) => (
                <TeaQrCell
                    tea={record}
                    onPreview={handlePreviewTeaQr}
                    onDownload={handleDownloadTeaQr}
                />
            ),
        },
        {
            title: 'Vườn',
            dataIndex: 'gardenId',
            key: 'gardenId',
            width: 85,
            render: (id) => gardens.find((g) => g.id === id)?.name ?? <span className="text-gray-400">-</span>,
        },
        {
            title: 'Đơn giá (VNĐ/kg)',
            dataIndex: 'price',
            key: 'price',
            width: 110,
            sorter: (a, b) => (a.price ?? 0) - (b.price ?? 0),
            render: (v) =>
                v != null ? (
                    v === 0 ? (
                        <Tag color="blue">Liên hệ</Tag>
                    ) : (
                        v.toLocaleString('vi-VN')
                    )
                ) : (
                    '-'
                ),
        },
        {
            title: 'Năm tuổi',
            dataIndex: 'yearOld',
            key: 'yearOld',
            width: 80,
            sorter: (a, b) => (a.yearOld ?? 0) - (b.yearOld ?? 0),
            render: (v) => (v && v > 0 ? v : <span className="text-gray-400">-</span>),
        },
        {
            title: 'Lat',
            dataIndex: 'lat',
            key: 'lat',
            width: 88,
            ellipsis: true,
            render: (v) => (v != null ? v : <span className="text-gray-400">-</span>),
        },
        {
            title: 'Long',
            dataIndex: 'long',
            key: 'long',
            width: 88,
            ellipsis: true,
            render: (v) => (v != null ? v : <span className="text-gray-400">-</span>),
        },
        {
            title: 'Đã bán',
            dataIndex: 'sold',
            key: 'sold',
            width: 80,
            render: (v) => (v ? <Tag color="red">Đã bán</Tag> : <Tag color="green">Còn</Tag>),
        },
        {
            title: 'Hiển thị',
            dataIndex: 'isActive',
            key: 'isActive',
            width: 85,
            render: (v) => <Tag color={v ? 'green' : 'default'}>{v ? 'Đang hiện' : 'Đang ẩn'}</Tag>,
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdDate',
            key: 'createdDate',
            width: 95,
            render: (v) => (v ? dayjs(v).format('DD/MM/YYYY') : '-'),
        },
        {
            title: 'Thao tác',
            key: 'actions',
            fixed: 'right',
            width: 105,
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        title="Cập nhật tiến độ trồng"
                        icon={<Sprout size={15} />}
                        disabled={deletingId !== null || editingLoadingId !== null}
                        onClick={() => openProgress(record)}
                    />
                    <Button
                        type="text"
                        icon={<Edit2 size={15} />}
                        loading={editingLoadingId === record.id}
                        disabled={deletingId !== null}
                        onClick={() => openEdit(record.id!)}
                    />
                    <Popconfirm
                        title="Xoá cây trà này?"
                        onConfirm={() => handleDelete(record.id!)}
                        okButtonProps={{loading: deletingId === record.id}}
                        okText="Xoá"
                        cancelText="Huỷ"
                    >
                        <Button
                            type="text"
                            danger
                            disabled={deletingId !== null || editingLoadingId !== null}
                            icon={
                                <Trash2
                                    size={15}
                                    color="#DC2626"
                                />
                            }
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const progressColumns: ColumnsType<PlantProgressResponse> = [
        {title: 'ID', dataIndex: 'id', key: 'id', width: 70},
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
            render: (value) => <span className="font-medium">{value}</span>,
        },
        {
            title: 'Nội dung',
            dataIndex: 'content',
            key: 'content',
            ellipsis: true,
            render: (value) => value || <span className="text-gray-400">-</span>,
        },
        {
            title: 'Hình ảnh',
            dataIndex: 'images',
            key: 'images',
            width: 150,
            render: (images) => {
                const list = getImageList(images).slice(0, 3);
                if (!list.length) return <span className="text-gray-400">-</span>;
                return (
                    <div className="flex gap-1.5">
                        {list.map((item) => {
                            const src = resolveImageUrl(item);
                            return (
                                <Image
                                    key={src}
                                    src={src}
                                    alt=""
                                    width={68}
                                    height={68}
                                    loading="lazy"
                                    style={{
                                        width: 34,
                                        height: 34,
                                        objectFit: 'cover',
                                        borderRadius: 4,
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => setPreviewImg(src)}
                                    onError={(e) => {
                                        const i = e.currentTarget;
                                        i.onerror = null;
                                        i.src = '/images/videovechungtoiimg.png';
                                    }}
                                />
                            );
                        })}
                    </div>
                );
            },
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdDate',
            key: 'createdDate',
            width: 150,
            render: (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '-'),
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 90,
            render: (_, record) => (
                <Button
                    type="text"
                    icon={<Edit2 size={15} />}
                    onClick={() => openEditProgress(record)}
                />
            ),
        },
    ];

    return (
        <div style={{display: 'flex', height: '100%', minHeight: 0, flexDirection: 'column', overflow: 'hidden'}}>
            {contextHolder}
            <div
                className="flex items-center justify-between"
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    background: '#f5f5f5',
                    paddingTop: 4,
                    paddingBottom: 4,
                    marginBottom: 20,
                    flexShrink: 0,
                }}
            >
                <div className="flex items-center gap-2">
                    <Leaf
                        size={20}
                        color="#3B5518"
                    />
                    <Title
                        level={4}
                        style={{margin: 0, color: '#3B5518'}}
                    >
                        Quản lý cây trà
                    </Title>
                </div>
                <Button
                    type="primary"
                    icon={<Plus size={15} />}
                    onClick={openCreate}
                    style={{background: '#3B5518'}}
                >
                    Thêm cây trà
                </Button>
            </div>

            <div
                style={{
                    background: '#fff',
                    borderRadius: 10,
                    padding: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    display: 'flex',
                    minHeight: 0,
                    flex: 1,
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                <div className="mb-4 flex flex-wrap gap-3">
                    <Input.Search
                        placeholder="Tìm kiếm tên cây trà..."
                        allowClear
                        style={{maxWidth: 280}}
                        onChange={(e) => {
                            setKeyword(e.target.value);
                            setPageIndex(1);
                        }}
                        onSearch={(v) => {
                            setKeyword(v);
                            setPageIndex(1);
                        }}
                    />
                    <Select
                        placeholder="Lọc theo vườn"
                        allowClear
                        style={{minWidth: 200}}
                        options={gardens.map((g) => ({value: g.id, label: g.name}))}
                        onChange={(val) => {
                            setGardenFilter(val ?? null);
                            setPageIndex(1);
                        }}
                    />
                    <Select
                        placeholder="Lọc theo hiển thị"
                        allowClear
                        style={{minWidth: 160}}
                        options={[
                            {value: 'visible', label: 'Đang hiện'},
                            {value: 'hidden', label: 'Đang ẩn'},
                        ]}
                        onChange={(val) => {
                            setVisibilityFilter(val ?? null);
                            setPageIndex(1);
                        }}
                    />
                    <Select
                        placeholder="Lọc theo đã bán"
                        allowClear
                        style={{minWidth: 160}}
                        options={[
                            {value: 'sold', label: 'Đã bán'},
                            {value: 'unsold', label: 'Còn'},
                        ]}
                        onChange={(val) => {
                            setSoldFilter(val ?? null);
                            setPageIndex(1);
                        }}
                    />
                    <Button
                        icon={<Download size={15} />}
                        disabled={!selectedTeas.length}
                        loading={downloadingQr}
                        onClick={handleDownloadSelectedQr}
                    >
                        Tải QR đã chọn{selectedTeas.length ? ` (${selectedTeas.length})` : ''}
                    </Button>
                </div>

                <Table
                    className="tea-tree-admin-table"
                    rowKey="id"
                    rowSelection={{
                        selectedRowKeys: selectedTeaKeys,
                        onChange: (keys) => setSelectedTeaKeys(keys),
                        getCheckboxProps: (record) => ({disabled: !record.id}),
                    }}
                    columns={columns}
                    dataSource={displayedTeas}
                    loading={loading}
                    scroll={{x: 1400, y: 'calc(100vh - 380px)'}}
                    pagination={{
                        current: pageIndex,
                        pageSize,
                        total: displayedTeas.length,
                        showTotal: (t) => `Tổng ${t} cây trà`,
                        onChange: (page) => setPageIndex(page),
                        showSizeChanger: false,
                    }}
                    locale={{emptyText: 'Chưa có cây trà nào'}}
                />
            </div>

            <style jsx global>{`
                .tea-tree-admin-table .ant-table-tbody > tr.ant-table-row-selected > td {
                    background: #f4f8ea !important;
                }

                .tea-tree-admin-table .ant-table-tbody > tr.ant-table-row-selected:hover > td {
                    background: #edf4dc !important;
                }

                .tea-tree-admin-table .ant-checkbox-checked .ant-checkbox-inner {
                    background-color: #7f9635 !important;
                    border-color: #7f9635 !important;
                }

                .tea-tree-admin-table .ant-checkbox-wrapper:hover .ant-checkbox-inner,
                .tea-tree-admin-table .ant-checkbox:hover .ant-checkbox-inner,
                .tea-tree-admin-table .ant-checkbox-input:focus-visible + .ant-checkbox-inner {
                    border-color: #7f9635 !important;
                }

                .tea-tree-admin-table .ant-table-selection-column {
                    background: inherit !important;
                }
            `}</style>

            <Modal
                title={editingId ? 'Chỉnh sửa cây trà' : 'Thêm cây trà mới'}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                onOk={handleSave}
                confirmLoading={saving}
                okButtonProps={{disabled: teaImagesUploading}}
                okText={teaImagesUploading ? 'Đang upload ảnh...' : editingId ? 'Lưu' : 'Thêm'}
                cancelText="Huỷ"
                width={680}
                destroyOnHidden
            >
                <Form
                    form={form}
                    layout="vertical"
                    className="mt-4"
                >
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item
                                name="name"
                                label="Tên/Mã cây trà (Theo Excel)"
                                rules={[{required: true, message: 'Nhập mã cây trà'}]}
                            >
                                <Input placeholder="Ví dụ: 01-001-A" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="price"
                                label="Đơn giá (VNĐ/kg)"
                                extra="Nhập 0 nếu là giá Liên hệ (hệ thống sẽ hiển thị nút Liên hệ Zalo)"
                            >
                                <InputNumber
                                    style={{width: '100%'}}
                                    min={0}
                                    formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    placeholder="29,700,000 (hoặc 0 nếu Liên hệ)"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="volume"
                                label="Sản lượng (kg/cây/năm)"
                            >
                                <InputNumber
                                    style={{width: '100%'}}
                                    min={0}
                                    step={0.1}
                                    precision={2}
                                    placeholder="Ví dụ: 1.6"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Loại cây"
                                required
                            >
                                <Select
                                    placeholder="Chọn loại cây"
                                    value={teaType}
                                    onChange={setTeaType}
                                    options={[
                                        {value: '1 lá', label: '1 lá'},
                                        {value: '2 lá', label: '2 lá'},
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="yearOld"
                                label="Số năm tuổi"
                                extra="Để trống hoặc 0 nếu không có trong Excel"
                            >
                                <InputNumber
                                    style={{width: '100%'}}
                                    min={0}
                                    placeholder="0"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="gardenId"
                                label="Vườn trà"
                                rules={[{required: true, message: 'Chọn vườn trà'}]}
                            >
                                <Select
                                    placeholder="Chọn vườn"
                                    allowClear
                                    options={gardens.map((g) => ({value: g.id, label: g.name}))}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item
                                name="aspect"
                                label="Thông số cây"
                            >
                                <Input placeholder="Ví dụ: Đông Nam" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="lat"
                                label="Vĩ độ (lat)"
                            >
                                <InputNumber
                                    style={{width: '100%'}}
                                    placeholder="Ví dụ: 21.5928"
                                    step={0.0001}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="long"
                                label="Kinh độ (long)"
                            >
                                <InputNumber
                                    style={{width: '100%'}}
                                    placeholder="Ví dụ: 105.8442"
                                    step={0.0001}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="isActive"
                                label="Hiện"
                                valuePropName="checked"
                            >
                                <Switch />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="sold"
                                label="Đã bán"
                                valuePropName="checked"
                            >
                                <Switch />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name="description"
                                label="Mô tả"
                            >
                                <Input.TextArea
                                    rows={3}
                                    placeholder="Mô tả về cây trà..."
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name="images"
                                label="Hình ảnh cây trà"
                            >
                                <ImageUploadField
                                    maxCount={6}
                                    onUploadingChange={setTeaImagesUploading}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            <Modal
                title={
                    progressTea
                        ? `Tiến độ trồng cây - ${progressTea.name ?? `#${progressTea.id}`}`
                        : 'Tiến độ trồng cây'
                }
                open={progressModalOpen}
                onCancel={() => {
                    setProgressModalOpen(false);
                    setProgressTea(null);
                    setProgressRecords([]);
                }}
                footer={null}
                width={900}
                destroyOnHidden
            >
                <div className="mt-4">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <Input.Search
                            placeholder="Tìm tiêu đề tiến độ..."
                            allowClear
                            style={{maxWidth: 280}}
                            onSearch={(value) => {
                                setProgressKeyword(value);
                                setProgressPageIndex(1);
                            }}
                        />
                        <Button
                            type="primary"
                            icon={<Plus size={15} />}
                            onClick={openCreateProgress}
                            style={{background: '#3B5518'}}
                        >
                            Thêm tiến độ
                        </Button>
                    </div>
                    <Table
                        rowKey="id"
                        columns={progressColumns}
                        dataSource={progressRecords}
                        loading={progressLoading}
                        scroll={{x: 'max-content'}}
                        pagination={{
                            current: progressPageIndex,
                            pageSize: 10,
                            total: progressTotal,
                            showTotal: (t) => `Tổng ${t} tiến độ`,
                            onChange: (page) => setProgressPageIndex(page),
                            showSizeChanger: false,
                        }}
                        locale={{emptyText: 'Chưa có tiến độ trồng cây'}}
                    />
                </div>
            </Modal>

            <Modal
                title={editingProgress ? 'Chỉnh sửa tiến độ' : 'Thêm tiến độ trồng mới'}
                open={progressFormOpen}
                onCancel={() => {
                    setProgressFormOpen(false);
                    setEditingProgress(null);
                }}
                onOk={handleSaveProgress}
                confirmLoading={progressSaving}
                okText={editingProgress ? 'Lưu' : 'Thêm'}
                cancelText="Huỷ"
                width={620}
                destroyOnHidden
            >
                <Form
                    form={progressForm}
                    layout="vertical"
                    className="mt-4"
                >
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item label="Cây trà">
                                <Input
                                    value={progressTea?.name ?? progressTea?.id ?? ''}
                                    disabled
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name="title"
                                label="Tiêu đề"
                                rules={[
                                    {required: true, message: 'Nhập tiêu đề tiến độ'},
                                    {max: 200, message: 'Tối đa 200 ký tự'},
                                ]}
                            >
                                <Input placeholder="Ví dụ: Cây ra búp non" />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name="content"
                                label="Nội dung"
                            >
                                <Input.TextArea
                                    rows={4}
                                    placeholder="Ghi chú chăm sóc, tình trạng cây, sản lượng dự kiến..."
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name="images"
                                label="Hình ảnh tiến độ"
                            >
                                <ImageUploadField maxCount={6} />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            <Modal
                title={
                    qrPreviewTea
                        ? `Mã QR cây #${qrPreviewTea.id}${qrPreviewTea.name ? ` - ${qrPreviewTea.name}` : ''}`
                        : 'Mã QR cây trà'
                }
                open={!!qrPreviewTea}
                footer={null}
                onCancel={() => {
                    setQrPreviewTea(null);
                    setQrPreviewImg(null);
                    setQrPreviewLoading(false);
                }}
                centered
                width={560}
            >
                <div className="flex min-h-[380px] items-center justify-center pt-2">
                    {qrPreviewLoading ? (
                        <Spin />
                    ) : qrPreviewImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={qrPreviewImg}
                            alt={`QR cây trà #${qrPreviewTea?.id ?? ''}`}
                            className="h-auto w-full max-w-[470px]"
                        />
                    ) : null}
                </div>
            </Modal>

            <Modal
                open={!!previewImg}
                footer={null}
                onCancel={() => setPreviewImg(null)}
                centered
                width={600}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={previewImg ?? ''}
                    alt="preview"
                    style={{width: '100%', borderRadius: 8}}
                    onError={(e) => {
                        const i = e.currentTarget;
                        i.onerror = null;
                        i.src = '/images/videovechungtoiimg.png';
                    }}
                />
            </Modal>
        </div>
    );
}
