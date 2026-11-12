'use client';

import React from 'react';
import {createPortal} from 'react-dom';
import {CheckCircle, ChevronLeft, ChevronRight, MoreHorizontal, X} from 'lucide-react';
import {getOwnerTeasAPI} from '@/api/TeaAPI';
import {getPlantProcessAPI, getPlantProcessPagingAPI} from '@/api/PlantProcessAPI';
import {unwrapApiData, unwrapListData, unwrapPagingData} from '@/api/response';
import type {PlantProgressResponse, Tea} from '@/types/swagger.types';
import {parseApiImageList, resolveApiImageUrl} from '@/utils/imageUrl';
import {useAppSelector} from '@/store/hooks';
import {toast} from '@/utils/toast';
import {cn} from '@/utils/cn';
import {formatTeaVolume, getTeaType, getTeaVolume} from '@/utils/teaFields';
import {useLanguage} from '@/context/LanguageContext';

type HarvestFilter = 'all' | 'one' | 'two';
type SortMode = 'harvest-nearest' | 'created-desc' | 'created-asc';

type TeaEntry = {
    item: Tea & Record<string, any>;
    key: string;
};

type ProgressContext = {
    teaId: number;
    name: string;
    code: string;
    volume: number | null;
    type: string | null;
};

type HarvestRow = {
    label: string;
    name?: unknown;
    output?: unknown;
    date?: unknown;
    harvested?: unknown;
};

const HARVEST_TABS: {value: HarvestFilter; label: string}[] = [
    {value: 'all', label: 'Tất cả'},
    {value: 'one', label: 'Cây thu hoạch 1 vụ'},
    {value: 'two', label: 'Cây thu hoạch 2 vụ'},
];

const SORT_OPTIONS: {value: SortMode; label: string; mobileLabel: string}[] = [
    {value: 'harvest-nearest', label: 'Lọc theo ngày thu hoạch gần nhất', mobileLabel: 'Thu hoạch gần nhất'},
    {value: 'created-desc', label: 'Ngày đặt mới nhất', mobileLabel: 'Mới nhất'},
    {value: 'created-asc', label: 'Ngày đặt cũ nhất', mobileLabel: 'Cũ nhất'},
];

const PAGE_SIZE_OPTIONS = [5, 10, 20];

const getValue = (source: any, keys: string[]) => {
    for (const key of keys) {
        const value = source?.[key];
        if (value !== undefined && value !== null && value !== '') return value;
    }
    return undefined;
};

const toArray = (value: unknown): any[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
};

const toDate = (value?: unknown) => {
    if (!value) return null;
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value?: unknown) => {
    const date = toDate(value);
    return date ? date.toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit', year: 'numeric'}) : '--';
};

const formatDateTime = (value?: unknown) => {
    const date = toDate(value);
    if (!date) return '--';

    return `${formatDate(value)} ${date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    })}`;
};

const formatMoney = (value?: number | null) => `${(value ?? 0).toLocaleString('vi-VN')} VND`;

const getItemEntity = (item: any) => item?.tea ?? item?.Tea;

const getItemId = (item: any) => {
    const entity = getItemEntity(item);
    const id = getValue(item, ['teaId', 'TeaId', 'itemId', 'ItemId', 'id', 'Id']) ?? getValue(entity, ['id', 'Id']);
    const numericId = Number(id ?? 0);
    return Number.isFinite(numericId) ? numericId : 0;
};

const formatOrderCode = (item: any) => {
    const code =
        getValue(item, ['teaCode', 'TeaCode', 'code', 'Code']) ?? String(getItemName(item)).match(/MS\d+/i)?.[0];
    if (code) return String(code).trim().replace(/^#/, '');

    const id = getItemId(item);
    return id ? `MS${String(id).padStart(4, '0')}` : 'MS----';
};

const getItemName = (item: any) => {
    const entity = getItemEntity(item);
    return (
        getValue(item, ['teaName', 'TeaName', 'itemName', 'ItemName', 'name', 'Name']) ??
        getValue(entity, ['name', 'Name']) ??
        (getItemId(item) ? `Cây trà #${getItemId(item)}` : 'Cây trà')
    );
};

const getTreePrice = (item: any) =>
    Number(getValue(item, ['price', 'Price', 'unitPrice', 'UnitPrice', 'totalPrice', 'TotalPrice']) ?? 0);

const getImagePath = (images?: unknown) => {
    if (!images) return null;
    if (Array.isArray(images)) return images.map(String).find(Boolean) ?? null;
    if (typeof images !== 'string') return null;

    const trimmed = images.trim();
    if (!trimmed) return null;

    try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(String).find(Boolean) ?? null;
    } catch {
        // Fall back to comma-separated images.
    }

    return (
        trimmed
            .split(',')
            .map((item) => item.trim())
            .find(Boolean) ?? null
    );
};

const resolveImageUrl = (images: unknown) => {
    const first = getImagePath(images);
    return resolveApiImageUrl(first, '/images/shan-tuyet-tea-tree.jpg');
};

const getImagePaths = (images?: unknown): string[] => {
    if (Array.isArray(images)) {
        return images.map(String).filter(Boolean).map((path) => resolveApiImageUrl(path));
    }

    if (typeof images !== 'string') return [];
    return parseApiImageList(images).map((path) => resolveApiImageUrl(path));
};

const resolveSingleImageUrl = (path: string) => {
    return resolveApiImageUrl(path);
};

const getItemImage = (item: any) => {
    const entity = getItemEntity(item);
    const raw =
        getValue(item, [
            'images',
            'Images',
            'image',
            'Image',
            'imageUrl',
            'ImageUrl',
            'thumbnail',
            'Thumbnail',
            'teaImages',
            'TeaImages',
        ]) ??
        getValue(entity, ['images', 'Images', 'image', 'Image', 'imageUrl', 'ImageUrl', 'thumbnail', 'Thumbnail']);

    return resolveImageUrl(raw);
};

const getHarvestRows = (item: any): HarvestRow[] => {
    const rows: HarvestRow[] = [
        {
            label: 'Vụ Đông',
            name: getValue(item, ['winterHarvestName', 'WinterHarvestName']),
            output: getValue(item, ['winterHarvestOutput', 'WinterHarvestOutput']),
            date: getValue(item, ['winterHarvestDate', 'WinterHarvestDate']),
            harvested: getValue(item, ['winterHarvested', 'WinterHarvested', 'isWinterHarvested', 'IsWinterHarvested']),
        },
        {
            label: 'Vụ Xuân',
            name: getValue(item, ['springHarvestName', 'SpringHarvestName']),
            output: getValue(item, ['springHarvestOutput', 'SpringHarvestOutput']),
            date: getValue(item, ['springHarvestDate', 'SpringHarvestDate']),
            harvested: getValue(item, ['springHarvested', 'SpringHarvested', 'isSpringHarvested', 'IsSpringHarvested']),
        },
    ].filter((row) => row.name || row.output || row.date);

    if (rows.length) return rows;

    const seasons = toArray(getValue(item, ['seasons', 'Seasons']));
    if (seasons.length) {
        return seasons.map((season, index) => ({
            label: String(season?.label ?? `Vụ ${index + 1}`),
            name: season?.variant ?? season?.name,
            output: season?.quantity ? `${season.quantity} kg trà khô/năm` : season?.output,
            date: season?.harvestDate ?? season?.date,
            harvested: season?.harvested ?? season?.isHarvested,
        }));
    }

    const genericName = getValue(item, ['harvestName', 'HarvestName']);
    const genericOutput = getValue(item, ['harvestOutput', 'HarvestOutput', 'quantity', 'Quantity']);
    const genericDate = getValue(item, [
        'harvestDate',
        'HarvestDate',
        'expectedHarvestDate',
        'ExpectedHarvestDate',
        'receivedDate',
        'ReceivedDate',
        'deliveredDate',
        'DeliveredDate',
    ]);
    return genericName || genericOutput
        ? [
              {
                  label: 'Vụ thu hoạch',
                  name: genericName,
                  output: typeof genericOutput === 'number' ? `${genericOutput} kg trà khô/năm` : genericOutput,
                  date: genericDate,
              },
          ]
        : [];
};

const getHarvestCount = (item: any) => {
    const explicit = Number(
        getValue(item, [
            'harvestCount',
            'HarvestCount',
            'numberOfHarvests',
            'NumberOfHarvests',
            'seasonCount',
            'SeasonCount',
        ]),
    );
    if (Number.isFinite(explicit) && explicit > 0) return Math.max(1, Math.min(2, explicit));

    const packageId = Number(getValue(item, ['packageId', 'PackageId']));
    if (Number.isFinite(packageId) && packageId > 0) return packageId >= 2 ? 2 : 1;

    return Math.max(1, Math.min(2, getHarvestRows(item).length || 1));
};

const getDisplayHarvestRows = (item: any) => {
    const count = getHarvestCount(item);
    const rows = getHarvestRows(item).slice(0, count);
    const fallbackLabels = count >= 2 ? ['Vụ Đông', 'Vụ Xuân'] : ['Vụ thu hoạch'];

    while (rows.length < count) {
        rows.push({label: fallbackLabels[rows.length] ?? `Vụ ${rows.length + 1}`});
    }

    return rows;
};

const getHarvestProgressLabel = (item: any) => {
    const count = getHarvestCount(item);
    const explicit = Number(getValue(item, ['currentHarvest', 'CurrentHarvest', 'currentSeason', 'CurrentSeason']));
    const current = Number.isFinite(explicit) && explicit > 0 ? Math.min(count, explicit) : count;
    return `vụ ${current}/${count}`;
};

const getOwnerTeaStatusLabel = (item: any) => {
    if (item?.isActive === false) return 'Ngừng hoạt động';
    return `Đang được trồng (${getHarvestProgressLabel(item)})`;
};

const getCreatedDate = (item: any) => getValue(item, ['createdDate', 'CreatedDate', 'orderDate', 'OrderDate']);

const getOwnershipDates = (item: any) => ({
    from: getValue(item, ['fromDate', 'FromDate', 'ownershipFromDate', 'OwnershipFromDate']),
    to: getValue(item, ['toDate', 'ToDate', 'ownershipToDate', 'OwnershipToDate']),
});

const getPlantingYears = (item: any) => {
    const {from, to} = getOwnershipDates(item);
    const fromDate = toDate(from);
    const toDateValue = toDate(to);
    if (!fromDate || !toDateValue || toDateValue <= fromDate) return 1;

    return Math.max(1, Math.ceil((toDateValue.getTime() - fromDate.getTime()) / (365 * 24 * 60 * 60 * 1000)));
};

const getOwnershipLine = (item: any) => {
    const {from, to} = getOwnershipDates(item);
    if (!from && !to) return 'Thời hạn trồng cây đang cập nhật';
    return `Nhận trồng cây trong ${getPlantingYears(item)} năm từ ${formatDate(from)} đến ${formatDate(to)}`;
};

const getExplicitHarvestDate = (item: any) => {
    const direct = getValue(item, [
        'harvestDate',
        'HarvestDate',
        'expectedHarvestDate',
        'ExpectedHarvestDate',
        'receivedDate',
        'ReceivedDate',
        'deliveredDate',
        'DeliveredDate',
    ]);
    if (direct) return direct;

    return getDisplayHarvestRows(item)
        .map((row) => row.date)
        .find(Boolean);
};

const isHarvestRowCompleted = (row: HarvestRow, index: number, rows: HarvestRow[]) => {
    if (typeof row.harvested === 'boolean') return row.harvested;
    if (typeof row.harvested === 'string') return row.harvested.toLowerCase() === 'true';
    return rows.length > 1 && index < rows.length - 1;
};

const getHarvestSortTime = (entry: TeaEntry) => {
    const explicit = toDate(getExplicitHarvestDate(entry.item));
    if (explicit) return explicit.getTime();

    const {from} = getOwnershipDates(entry.item);
    return toDate(from)?.getTime() ?? toDate(getCreatedDate(entry.item))?.getTime() ?? 0;
};

const buildEntries = (teas: any[]): TeaEntry[] =>
    teas.map((item, index) => ({
        item,
        key: `${getItemId(item) || index}-${index}`,
    }));

const normalizeOwnerTeas = (response: unknown): any[] => {
    const data = unwrapApiData<any>(response);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.teas)) return data.teas;
    if (Array.isArray(data?.Teas)) return data.Teas;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.records)) return data.records;
    return [];
};

let myTeaCache: {userId: number; teas: any[]} | null = null;
let myTeaRequest: Promise<any[]> | null = null;

const MyTeaSkeleton = () => (
    <div className="mt-4 flex flex-col gap-3">
        {Array.from({length: 3}).map((_, index) => (
            <div
                key={index}
                className="rounded-[8px] border border-[#DDEBAA]/20 bg-[#7F9635]/80 p-4"
            >
                <div className="h-5 w-40 rounded bg-white/20" />
                <div className="mt-4 grid grid-cols-[84px_1fr] gap-4">
                    <div className="h-[112px] rounded-[6px] bg-white/20" />
                    <div className="space-y-3">
                        <div className="h-5 w-48 rounded bg-white/20" />
                        <div className="h-7 w-full max-w-[300px] rounded bg-white/20" />
                        <div className="h-4 w-44 rounded bg-white/20" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

const PaginationButton = ({
    active,
    disabled,
    children,
    onClick,
    label,
}: {
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    onClick?: () => void;
    label?: string;
}) => (
    <button
        type="button"
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
        className={cn(
            'flex h-8 min-w-8 items-center justify-center rounded-[4px] border px-2 text-sm leading-none transition disabled:cursor-not-allowed disabled:opacity-45',
            active
                ? 'border-[#DDEBAA] bg-[#DDEBAA] !text-[#3B5518]'
                : 'border-[#F4F0E4]/55 text-[#F4F0E4] hover:border-[#DDEBAA] hover:bg-[#F4F0E4]/10',
        )}
    >
        {children}
    </button>
);

const Pagination = ({
    page,
    pageSize,
    total,
    onPageChange,
    onPageSizeChange,
}: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
}) => {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = total ? (page - 1) * pageSize + 1 : 0;
    const end = Math.min(page * pageSize, total);

    const pages = Array.from(new Set([1, page - 1, page, page + 1, totalPages]))
        .filter((item) => item >= 1 && item <= totalPages)
        .sort((a, b) => a - b);

    return (
        <div className="mt-5 flex flex-col gap-3 text-[#F4F0E4] sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
            <p className="text-sm">
                {start}-{end} of {total} dòng
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2">
                <PaginationButton
                    label="Trang trước"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                >
                    <ChevronLeft size={16} />
                </PaginationButton>

                {pages.map((item, index) => (
                    <React.Fragment key={item}>
                        {index > 0 && item - pages[index - 1] > 1 && (
                            <span className="flex h-8 min-w-8 items-center justify-center text-[#F4F0E4]">
                                <MoreHorizontal size={18} />
                            </span>
                        )}
                        <PaginationButton
                            active={item === page}
                            onClick={() => onPageChange(item)}
                        >
                            {item}
                        </PaginationButton>
                    </React.Fragment>
                ))}

                <PaginationButton
                    label="Trang sau"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                >
                    <ChevronRight size={16} />
                </PaginationButton>

                <select
                    value={pageSize}
                    onChange={(event) => onPageSizeChange(Number(event.target.value))}
                    className="h-8 rounded-[4px] border border-[#F4F0E4]/65 bg-transparent px-3 text-sm text-[#F4F0E4] outline-none transition hover:border-[#DDEBAA] [&_option]:text-[#3B5518]"
                >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                        <option
                            key={size}
                            value={size}
                        >
                            {size}/trang
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

const TeaTreeCard = ({entry, onViewProgress}: {entry: TeaEntry; onViewProgress: (entry: TeaEntry) => void}) => {
    const { t } = useLanguage();
    const {item} = entry;
    const teaId = getItemId(item);
    const harvestRows = getDisplayHarvestRows(item);
    const isTwoHarvests = harvestRows.length > 1;

    return (
        <article className="rounded-[8px] border border-[#DDEBAA]/18 bg-[#7F9635] p-2.5 text-[#F4F0E4] shadow-[0_10px_24px_rgba(15,31,9,0.12),inset_0_1px_0_rgba(255,255,255,0.08)] sm:p-4">
            <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-[11px] font-semibold leading-tight sm:gap-2 sm:text-sm">
                    <span className="rounded-[4px] bg-[#5F7424] px-2 py-1 text-[10px] font-bold text-[#F4F0E4] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] sm:px-2.5 sm:py-1.5 sm:text-[13px]">
                        {formatOrderCode(item)}
                    </span>
                    <span className="hidden h-4 w-px bg-[#F4F0E4]/65 sm:block" />
                    <span className="min-w-0 text-white">{getOwnerTeaStatusLabel(item)}</span>
                </div>
                <p className="shrink-0 text-[10px] leading-tight text-[#F4F0E4]/82 sm:text-[13px]">
                    {t('account.trees.createdTime', 'Thời gian tạo')}: {formatDateTime(getCreatedDate(item))}
                </p>
            </div>

            <div className="mt-2.5 grid grid-cols-[74px_minmax(0,1fr)] gap-2.5 sm:mt-3 sm:grid-cols-[92px_minmax(0,1fr)] sm:gap-4 md:grid-cols-[92px_minmax(0,1fr)_166px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={getItemImage(item)}
                    alt={String(getItemName(item))}
                    className={cn(
                        'w-[74px] rounded-[6px] bg-[#DDEBAA] object-cover shadow-[0_4px_12px_rgba(15,31,9,0.18)] sm:w-[92px]',
                        isTwoHarvests ? 'h-[136px] sm:h-[176px]' : 'h-[104px] sm:h-[126px]',
                    )}
                    onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = '/images/shan-tuyet-tea-tree.jpg';
                    }}
                />

                <div className="min-w-0">
                    <h3 className="line-clamp-2 font-source-serif-4 text-[16px] leading-tight text-white sm:text-[20px]">
                        {getItemName(item)}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#F4F0E4]/88 sm:text-xs">
                        <span>{t('account.trees.yield', 'Sản lượng')}: {formatTeaVolume(item, t('common.updating', 'Đang cập nhật'))}</span>
                        <span>{t('account.trees.treeType', 'Loại cây')}: {getTeaType(item) || t('common.updating', 'Đang cập nhật')}</span>
                    </div>

                    <div className="mt-2 flex flex-col gap-2 text-[12px] leading-tight sm:mt-2.5 sm:gap-2.5 sm:text-sm">
                        {harvestRows.map((row, index) => {
                            const completed = isHarvestRowCompleted(row, index, harvestRows);
                            const title = isTwoHarvests
                                ? `${t('account.trees.finishedProduct', 'Thành phẩm')} ${String(row.label).toLowerCase()}`
                                : t('account.trees.receivedProduct', 'Thành phẩm nhận được');

                            return (
                                <div
                                    key={`${row.label}-${index}`}
                                    className={cn(index > 0 && 'border-t border-[#F4F0E4]/45 pt-2 sm:pt-2.5')}
                                >
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                                        <p className="font-semibold text-white">{title}</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            <span className="inline-flex min-h-7 max-w-full items-center rounded-[3px] bg-[#DDEBAA] px-2 py-1 text-[#3B5518] sm:min-h-8 sm:px-2.5 sm:py-1.5">
                                                {String(row.name ?? t('common.updating', 'Đang cập nhật'))}
                                            </span>
                                            <span className="inline-flex min-h-7 max-w-full items-center rounded-[3px] bg-[#DDEBAA] px-2 py-1 text-[#3B5518] sm:min-h-8 sm:px-2.5 sm:py-1.5">
                                                {String(row.output ?? t('account.trees.updatingYield', 'Đang cập nhật sản lượng'))}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-1.5 flex items-start gap-1.5 leading-relaxed text-[#F4F0E4]/88 sm:mt-2">
                                        {completed && (
                                            <CheckCircle
                                                size={14}
                                                className="mt-0.5 shrink-0"
                                                fill="#DDEBAA"
                                                stroke="#7F9635"
                                            />
                                        )}
                                        <span>
                                            {completed ? t('account.trees.harvested', 'Đã thu hoạch') : t('account.trees.expectedHarvest', 'Lịch dự kiến thu hoạch')}:{' '}
                                            {row.date ? formatDate(row.date) : t('common.updating', 'Đang cập nhật')}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="col-span-2 flex flex-col gap-2 rounded-[6px] bg-[#6F8532]/45 p-2.5 sm:flex-row sm:items-end sm:justify-between sm:gap-3 sm:p-3 md:col-span-1 md:bg-transparent md:p-0 md:text-right md:flex-col md:items-end">
                    <div className="min-w-0">
                        <p className="text-[17px] font-semibold leading-none text-[#F4F0E4] sm:text-xl">
                            {formatMoney(getTreePrice(item))}
                        </p>
                        <p className="mt-1.5 max-w-[260px] text-[10px] italic leading-snug text-[#F4F0E4]/82 sm:mt-2 sm:text-[11px] md:max-w-[172px]">
                            {getOwnershipLine(item)}
                        </p>
                    </div>

                    <button
                        type="button"
                        disabled={!teaId}
                        onClick={() => onViewProgress(entry)}
                        className="min-h-[26px] w-fit max-w-full rounded-[4px] bg-[#3B5518] px-2 py-1 text-[11px] font-semibold leading-tight text-[#F4F0E4] transition hover:bg-[#2F4413] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-7 sm:px-2.5 sm:text-xs md:mt-auto"
                    >
                        {t('account.trees.viewProgress', 'Xem tiến độ trồng cây')}
                    </button>
                </div>
            </div>
        </article>
    );
};

export default function CayTraCuaToiTab() {
    const { t } = useLanguage();
    const user = useAppSelector((s) => s.auth.user as any);
    const userId = Number(user?.id);

    const [teas, setTeas] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [harvestFilter, setHarvestFilter] = React.useState<HarvestFilter>('all');
    const [sortMode, setSortMode] = React.useState<SortMode>('harvest-nearest');
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(5);
    const [progressOpen, setProgressOpen] = React.useState(false);
    const [progressLoading, setProgressLoading] = React.useState(false);
    const [progressContext, setProgressContext] = React.useState<ProgressContext | null>(null);
    const [progressRecords, setProgressRecords] = React.useState<PlantProgressResponse[]>([]);

    const getHarvestTabLabel = (val: HarvestFilter) => {
        if (val === 'all') return t('account.trees.all', 'Tất cả');
        if (val === 'one') return t('account.trees.oneSeason', 'Cây thu hoạch 1 vụ');
        return t('account.trees.twoSeasons', 'Cây thu hoạch 2 vụ');
    };

    const getSortOptionLabel = (val: SortMode, isMobile: boolean) => {
        if (val === 'harvest-nearest')
            return isMobile
                ? t('account.trees.sortNearestHarvestShort', 'Thu hoạch gần nhất')
                : t('account.trees.sortNearestHarvest', 'Lọc theo ngày thu hoạch gần nhất');
        if (val === 'created-desc')
            return isMobile
                ? t('account.trees.sortNewestShort', 'Mới nhất')
                : t('account.trees.sortNewest', 'Ngày đặt mới nhất');
        return isMobile
            ? t('account.trees.sortOldestShort', 'Cũ nhất')
            : t('account.trees.sortOldest', 'Ngày đặt cũ nhất');
    };

    const fetchOwnerTeas = React.useCallback(async () => {
        await Promise.resolve();
        if (!userId) {
            setTeas([]);
            setLoading(false);
            return;
        }
        if (myTeaCache?.userId === userId) {
            setTeas(myTeaCache.teas);
            return;
        }

        setLoading(true);
        try {
            if (!myTeaRequest) {
                myTeaRequest = getOwnerTeasAPI()
                    .then(normalizeOwnerTeas)
                    .catch((err) => {
                        if (err?.response?.status === 404) {
                            return [];
                        }
                        throw err;
                    });
            }

            const result = await myTeaRequest;
            myTeaCache = {userId, teas: result};
            setTeas(result);
        } catch (err: any) {
            if (err?.response?.status !== 404) {
                toast.error(t('account.trees.loadError', 'Không thể tải danh sách cây trà của bạn'));
            } else {
                setTeas([]);
            }
        } finally {
            myTeaRequest = null;
            setLoading(false);
        }
    }, [userId]);

    React.useEffect(() => {
        void Promise.resolve().then(fetchOwnerTeas);
    }, [fetchOwnerTeas]);

    const entries = React.useMemo(() => buildEntries(teas), [teas]);

    const harvestFilteredEntries = React.useMemo(
        () =>
            entries.filter((entry) => {
                const count = getHarvestCount(entry.item);
                if (harvestFilter === 'one') return count === 1;
                if (harvestFilter === 'two') return count >= 2;
                return true;
            }),
        [entries, harvestFilter],
    );

    const visibleEntries = React.useMemo(() => {
        return [...harvestFilteredEntries].sort((a, b) => {
            if (sortMode === 'created-desc') {
                return (
                    (toDate(getCreatedDate(b.item))?.getTime() ?? 0) - (toDate(getCreatedDate(a.item))?.getTime() ?? 0)
                );
            }
            if (sortMode === 'created-asc') {
                return (
                    (toDate(getCreatedDate(a.item))?.getTime() ?? 0) - (toDate(getCreatedDate(b.item))?.getTime() ?? 0)
                );
            }
            return getHarvestSortTime(a) - getHarvestSortTime(b);
        });
    }, [harvestFilteredEntries, sortMode]);

    const totalPages = Math.max(1, Math.ceil(visibleEntries.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const pagedEntries = visibleEntries.slice((safePage - 1) * pageSize, safePage * pageSize);

    const handleSortModeChange = (value: SortMode) => {
        setSortMode(value);
        setPage(1);
    };

    const handleHarvestFilterChange = (value: HarvestFilter) => {
        setHarvestFilter(value);
        setPage(1);
    };

    const handlePageSizeChange = (value: number) => {
        setPageSize(value);
        setPage(1);
    };

    const handleViewProgress = async (entry: TeaEntry) => {
        const teaId = getItemId(entry.item);
        if (!teaId) return;

        setProgressContext({
            teaId,
            name: String(getItemName(entry.item)),
            code: formatOrderCode(entry.item),
            volume: getTeaVolume(entry.item),
            type: getTeaType(entry.item),
        });
        setProgressRecords([]);
        setProgressOpen(true);
        setProgressLoading(true);

        try {
            const res = await getPlantProcessAPI({teaId});
            let records = unwrapListData<PlantProgressResponse>(res);

            if (!records.length && userId) {
                const pagingRes = await getPlantProcessPagingAPI({
                    teaId,
                    ownerId: userId,
                    pageIndex: 1,
                    pageSize: 100,
                    orderBy: 'CreatedDate desc',
                }).catch(() => null);
                records = unwrapPagingData<PlantProgressResponse>(pagingRes).data;
            }

            setProgressRecords(
                [...records].sort(
                    (a, b) =>
                        (toDate(b.createdDate ?? b.updatedDate)?.getTime() ?? 0) -
                        (toDate(a.createdDate ?? a.updatedDate)?.getTime() ?? 0),
                ),
            );
        } catch {
            toast.error('Không thể tải tiến độ cây trồng');
        } finally {
            setProgressLoading(false);
        }
    };

    const progressModal = progressOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/25 px-4 py-6">
            <button
                type="button"
                aria-label="Đóng tiến độ trồng cây"
                className="absolute inset-0 cursor-default"
                onClick={() => setProgressOpen(false)}
            />
            <section className="relative z-10 w-full max-w-[760px] overflow-hidden rounded-[4px] bg-[#F4F0E4] text-[#3B5518] shadow-[0_18px_48px_rgba(20,35,10,0.35)]">
                <div className="flex items-start justify-between gap-4 px-4 pb-2 pt-3">
                    <div className="min-w-0">
                        <p className="text-lg font-bold leading-tight text-[#3B5518]">Tiến trình trồng cây</p>
                        <h3 className="mt-1 line-clamp-2 font-source-serif-4 text-base leading-tight text-[#3B5518]">
                            {progressContext?.name ?? 'Cây trà'}
                        </h3>
                        {progressContext?.code && (
                            <p className="mt-1 text-sm font-semibold uppercase tracking-[0.08em] text-[#6D8336]">
                                {progressContext.code}
                            </p>
                        )}
                        {progressContext && (
                            <p className="mt-1 text-xs text-[#6D8336]">
                                Sản lượng: {formatTeaVolume(progressContext, 'Đang cập nhật')} · Loại cây:{' '}
                                {progressContext.type || 'Đang cập nhật'}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        aria-label="Đóng"
                        onClick={() => setProgressOpen(false)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[3px] text-[#6D8336] transition hover:bg-[#E5E0CB] hover:text-[#3B5518]"
                    >
                        <X size={17} />
                    </button>
                </div>

                <div className="max-h-[68vh] overflow-y-auto px-4 pb-4 pr-3 [scrollbar-color:#88A34E_transparent] [scrollbar-width:thin]">
                    <div className="relative ml-2 border-l-2 border-[#8AA34E] pl-4">
                        {progressLoading ? (
                            Array.from({length: 4}).map((_, index) => (
                                <div
                                    key={index}
                                    className="relative pb-4"
                                >
                                    <span className="absolute -left-[22px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-[#8AA34E] bg-[#F4F0E4]" />
                                    <div className="h-3 w-28 rounded bg-[#D9D2B9]" />
                                    <div className="mt-2 h-4 w-40 rounded bg-[#D9D2B9]" />
                                    <div className="mt-2 grid grid-cols-4 gap-1.5">
                                        {Array.from({length: 4}).map((__, imageIndex) => (
                                            <div
                                                key={imageIndex}
                                                className="h-[52px] rounded-[2px] bg-[#D9D2B9]"
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : progressRecords.length ? (
                            progressRecords.map((record, index) => {
                                const images = getImagePaths(record.images).map(resolveSingleImageUrl);
                                return (
                                    <article
                                        key={record.id ?? `${record.title}-${record.createdDate}`}
                                        className="relative pb-4 last:pb-0"
                                    >
                                        <span className="absolute -left-[22px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-[#8AA34E] bg-[#F4F0E4]" />
                                        <h4 className="font-source-serif-4 text-base font-semibold leading-tight text-[#3B5518]">
                                            {record.title || `Cập nhật tiến độ ${index + 1}`}
                                        </h4>
                                        <time className="mt-1 block text-[13px] leading-tight text-[#6D6F45]">
                                            {formatDateTime(record.createdDate ?? record.updatedDate)}
                                        </time>
                                        {record.content && (
                                            <p className="mt-1 line-clamp-2 text-[15px] leading-4 text-[#4D5B29]">
                                                {record.content}
                                            </p>
                                        )}
                                        {images.length > 0 && (
                                            <div className="mt-2 grid lg:grid-cols-4 grid-cols-3 gap-1.5 sm:grid-cols-5">
                                                {images.slice(0, 10).map((src) => (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        key={src}
                                                        src={src}
                                                        alt={record.title ?? 'Tiến trình trồng cây'}
                                                        className="h-[100px] w-full rounded-[2px] bg-[#D9D2B9] object-cover"
                                                        onError={(event) => {
                                                            event.currentTarget.onerror = null;
                                                            event.currentTarget.src = '/images/shan-tuyet-tea-tree.jpg';
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </article>
                                );
                            })
                        ) : (
                            <div className="relative pb-1">
                                <span className="absolute -left-[22px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-[#8AA34E] bg-[#F4F0E4]" />
                                <h4 className="font-source-serif-4 text-[13px] font-semibold text-[#3B5518]">
                                    Chưa có tiến độ
                                </h4>
                                <p className="mt-1 text-[11px] leading-4 text-[#4D5B29]">
                                    Tiến trình trồng cây đang được cập nhật.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    ) : null;

    return (
        <div className="min-w-0 max-w-full">
            {progressModal && typeof document !== 'undefined' ? createPortal(progressModal, document.body) : null}

            <div className="flex items-center justify-between gap-3">
                <h2 className="shrink-0 font-source-serif-4 text-[22px] leading-none text-[#F4F0E4] sm:text-[26px]">
                    {t('account.trees.title', 'Cây trà của tôi')}
                </h2>

                <select
                    value={sortMode}
                    onChange={(event) => handleSortModeChange(event.target.value as SortMode)}
                    aria-label="Lọc cây trà"
                    className="h-7 min-w-0 flex-1 rounded-[4px] border border-[#DDEBAA] bg-[#DDEBAA] px-2 text-[11px] text-[#3B5518] outline-none transition hover:bg-[#E7F0BC] sm:hidden"
                >
                    {SORT_OPTIONS.map((option) => (
                        <option
                            key={option.value}
                            value={option.value}
                        >
                            {getSortOptionLabel(option.value, true)}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mt-3 border-b border-[#F4F0E4]/35 sm:mt-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap gap-x-4 gap-y-2 sm:gap-x-8">
                            {HARVEST_TABS.map((tab) => (
                                <button
                                    key={tab.value}
                                    type="button"
                                    onClick={() => handleHarvestFilterChange(tab.value)}
                                    style={{
                                        borderBottom:
                                            harvestFilter === tab.value ? '2px solid #F4F0E4' : '2px solid transparent',
                                    }}
                                    className={cn(
                                        '-mb-px shrink-0 pb-2 text-left font-source-serif-4 text-[15px] leading-none text-[#F4F0E4]/78 transition hover:text-white sm:pb-3 sm:text-lg',
                                        harvestFilter === tab.value && 'text-white',
                                    )}
                                >
                                    {tab.value === 'all' ? `${getHarvestTabLabel(tab.value)} (${entries.length})` : getHarvestTabLabel(tab.value)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <select
                        value={sortMode}
                        onChange={(event) => handleSortModeChange(event.target.value as SortMode)}
                        className="mb-3 hidden h-8 w-full shrink-0 rounded-[4px] border border-[#DDEBAA] bg-[#DDEBAA] px-2.5 text-xs text-[#3B5518] outline-none transition hover:bg-[#E7F0BC] sm:block sm:w-[270px] lg:w-[255px]"
                    >
                        {SORT_OPTIONS.map((option) => (
                            <option
                                key={option.value}
                                value={option.value}
                            >
                                {getSortOptionLabel(option.value, false)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <MyTeaSkeleton />
            ) : pagedEntries.length ? (
                <>
                    <div className="mt-4 flex flex-col gap-4">
                        {pagedEntries.map((entry) => (
                            <TeaTreeCard
                                key={entry.key}
                                entry={entry}
                                onViewProgress={handleViewProgress}
                            />
                        ))}
                    </div>

                    <Pagination
                        page={safePage}
                        pageSize={pageSize}
                        total={visibleEntries.length}
                        onPageChange={setPage}
                        onPageSizeChange={handlePageSizeChange}
                    />
                </>
            ) : (
                <div className="flex min-h-[150px] items-center">
                    <p className="text-sm text-[#F4F0E4]/75">
                        {t('account.trees.empty', 'Bạn chưa sở hữu cây trà nào.')}
                    </p>
                </div>
            )}
        </div>
    );
}
