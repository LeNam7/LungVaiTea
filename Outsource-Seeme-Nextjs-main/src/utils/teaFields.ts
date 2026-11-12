const getValue = (source: any, keys: string[]) => {
    for (const key of keys) {
        const value = source?.[key];
        if (value !== undefined && value !== null && value !== '') return value;
    }
    return undefined;
};

const getTeaEntity = (source: any) => source?.tea ?? source?.Tea;

const normalizeTeaType = (raw: unknown): string | null => {
    const value = String(raw ?? '').trim();

    // Order detail uses Type/type as the item discriminator, not the leaf type.
    if (!value || ['tea', 'product'].includes(value.toLowerCase())) return null;
    return value;
};

export const getTeaVolume = (source: any): number | null => {
    const entity = getTeaEntity(source);
    const raw =
        getValue(source, ['volume', 'Volume', 'teaVolume', 'TeaVolume']) ??
        getValue(entity, ['volume', 'Volume']);
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
};

export const getTeaType = (source: any): string | null => {
    const entity = getTeaEntity(source);
    const snapshotType = normalizeTeaType(getValue(source, ['teaType', 'TeaType', 'leafType', 'LeafType']));
    if (snapshotType) return snapshotType;

    const directType = normalizeTeaType(getValue(source, ['type', 'Type']));
    if (directType) return directType;

    return normalizeTeaType(getValue(entity, ['type', 'Type', 'teaType', 'TeaType']));
};

export const formatTeaVolume = (source: any, fallback = '-') => {
    const volume = getTeaVolume(source);
    return volume !== null && volume > 0 ? `${volume.toLocaleString('vi-VN')} kg/cây/năm` : fallback;
};

export const TEA_SPRING_PRODUCT = 'Đại lão shan (phổ nhĩ sống)';

// Danh sách các mã cây đặc biệt khách hàng yêu cầu để giá liên hệ (tư vấn qua Zalo)
// 4 cây đại lão cổ thụ lớn nhất đưa lên đầu Vườn 01 Nhiềm (thứ tự ban đầu 78, 58, 59, 80):
// - 01-001-A (cây 78 cũ, 1.8 kg)
// - 01-002-B (cây 58 cũ, 1.2 kg)
// - 01-003-B (cây 59 cũ, 1.2 kg)
// - 01-005-B (cây 80 cũ, 1.6 kg)
// Đồng thời bổ sung các mã 02-058-E, 02-059-E, 04-078-A, 04-080-D phòng trường hợp tra cứu theo số thứ tự cây
// Cây đấu giá theo file Excel khách gửi 29/10/2026 (nhóm A, giá = 0 → hiện liên hệ).
// Mã mới dạng "01206 - A" (không khớp regex mã cũ nên extractTeaCode trả nguyên chuỗi).
export const CONTACT_TEA_CODES = new Set([
    '01206 - A',
    '01078 - A',
    '02358 - A',
]);

export const extractTeaCode = (source: any): string => {
    const raw = source?.code ?? source?.label ?? source?.name ?? '';
    const match = String(raw).match(/\d{2}-\d{3}-[A-Z]/);
    return match ? match[0] : String(raw).trim();
};

export interface TeaPriceSource {
    price?: number | string | null;
    priceValue?: number | null;
    volume?: number | null;
    sold?: boolean | null;
    isActive?: boolean | null;
    name?: string | null;
    code?: string | null;
    label?: string | null;
}

export const getTeaCost = (source: TeaPriceSource): number | null => {
    const rawPrice = source?.priceValue !== undefined && source?.priceValue !== null ? source?.priceValue : source?.price;
    const price = typeof rawPrice === 'number' ? rawPrice : Number(rawPrice);
    const volume = typeof source?.volume === 'number' ? source.volume : Number(source?.volume);
    return Number.isFinite(price) && price > 0 &&
        Number.isFinite(volume) && volume > 0
        ? Math.round(price * volume) : null;
};

export const isTeaContactPrice = (source: TeaPriceSource): boolean => {
    if (!source || source.sold) return false;
    const code = extractTeaCode(source);
    const isExplicitCode = CONTACT_TEA_CODES.has(code);
    const rawPrice = source?.priceValue !== undefined && source?.priceValue !== null ? source?.priceValue : source?.price;
    const priceVal = typeof rawPrice === 'number' ? rawPrice : Number(rawPrice);

    // Chỉ những cây thuộc danh sách mã liên hệ VÀ có giá = 0 (hoặc chưa set giá) mới là cây liên hệ
    if (isExplicitCode && (priceVal === 0 || !Number.isFinite(priceVal))) {
        return true;
    }
    return false;
};

export const isTeaPurchasable = (source: TeaPriceSource) => {
    if (!source) return false;
    if (source.sold === true || source.isActive === false) return false;
    if (isTeaContactPrice(source)) return false;
    const cost = getTeaCost(source);
    return cost !== null && cost > 0;
};

/**
 * Kiểm tra cây trà đủ điều kiện mở bán để hiển thị cho khách hàng ở giao diện client.
 * Cây phải có sản lượng (> 0) và (có giá bán > 0 HOẶC thuộc diện giá liên hệ mở bán).
 * Các cây chưa có sản lượng/chưa định giá sẽ ẩn khỏi client, vẫn giữ nguyên trong database & CMS.
 */
export const isTeaAvailableForClient = (source: any): boolean => {
    if (!source || source.isActive === false) return false;
    if (source.sold === true) return false;

    // Phải có sản lượng (> 0)
    const volume = typeof source.volume === 'number' ? source.volume : Number(source.volume);
    if (!Number.isFinite(volume) || volume <= 0) return false;

    // Cây đại lão cổ thụ giá liên hệ (mở bán tư vấn Zalo)
    if (isTeaContactPrice(source)) return true;

    // Cây có giá bán hợp lệ (> 0)
    const rawPrice = source.priceValue !== undefined && source.priceValue !== null ? source.priceValue : source.price;
    const price = typeof rawPrice === 'number' ? rawPrice : Number(rawPrice);
    return Number.isFinite(price) && price > 0;
};

export const formatTeaCost = (source: TeaPriceSource, fallback = '-') => {
    if (isTeaContactPrice(source)) return 'Liên hệ';
    const cost = getTeaCost(source);
    return cost !== null ? cost.toLocaleString('vi-VN') + ' VNĐ' : fallback;
};

// Source: Cập nhật cây trà.xlsx, sheet MÃ VƯỜN, A2:B9.
const GARDEN_CODES: Record<string, string> = {
    'Nhiềm': '01', 'Chúi': '02', 'Pèng': '03', 'Hậu': '04',
    'Sui': '05', 'Bằng': '06', 'Cháp': '07', 'Hẹc': '08',
};

export const formatGardenCode = (garden: {code?: string | null; name?: string | null} | null | undefined) => {
    const name = garden?.name?.replace(/^Vườn trà\s+/i, '').trim() ?? '';
    const code = garden?.code?.trim() || GARDEN_CODES[name];
    return code ? 'Mã vườn: ' + code : (name ? name : 'Mã vườn: -');
};

/** Tên hiển thị vườn: tên thật + mã, ví dụ "Vườn Nhiềm · Mã 01", để khách thấy tên vườn chứ không chỉ mã. */
export const formatGardenDisplay = (garden: {code?: string | null; name?: string | null} | null | undefined) => {
    const name = garden?.name?.replace(/^Vườn trà\s+/i, '').trim() ?? '';
    const code = garden?.code?.trim() || GARDEN_CODES[name];
    if (name && code) return `Vườn ${name} · Mã ${code}`;
    if (name) return `Vườn ${name}`;
    return formatGardenCode(garden);
};

export const formatTeaDescription = (description: string) => {
    let result = description;
    for (const [name, code] of Object.entries(GARDEN_CODES)) {
        result = result.replaceAll('vườn Vườn trà ' + name, 'vườn mã ' + code)
            .replaceAll('Vườn trà ' + name, 'vườn mã ' + code);
    }
    return result;
};
