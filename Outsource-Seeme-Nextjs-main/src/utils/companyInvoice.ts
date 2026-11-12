/**
 * Thông tin xuất hoá đơn công ty, lưu kèm trong deliveryInformation của đơn.
 * Đơn cũ chỉ lưu boolean true (đã tick nhưng không có chi tiết); đơn mới lưu
 * object đủ tên công ty / mã số thuế / email / địa chỉ. Cả lịch sử đơn của
 * khách và drawer chi tiết đơn của admin đều đọc qua hàm này để hiển thị
 * cùng một dạng.
 */
export type CompanyInvoiceDetails = {
    requested: boolean;
    companyName?: string;
    taxCode?: string;
    email?: string;
    address?: string;
};

export const parseCompanyInvoice = (value: unknown): CompanyInvoiceDetails => {
    if (!value) return {requested: false};
    if (value === true) return {requested: true};
    if (typeof value === 'object') {
        const v = value as Record<string, unknown>;
        const text = (key: string) => (typeof v[key] === 'string' ? (v[key] as string) : undefined);
        return {
            requested: true,
            companyName: text('companyName'),
            taxCode: text('taxCode'),
            email: text('email'),
            address: text('address'),
        };
    }
    return {requested: false};
};
