/** Viết thường tên trà theo kiểu tiêu đề, giữ nguyên số và dấu câu:
 * "BẠCH VÂN TIÊN - BẠCH TIÊN TRÀ" -> "Bạch Vân Tiên - Bạch Tiên Trà",
 * "XÍCH VÂN TRÀ (HỒNG TRÀ SHAN CỔ THỤ)" -> "Xích Vân Trà (Hồng Trà Shan Cổ Thụ)".
 * Tên đã viết thường sẵn ("Huyền Mộc") giữ nguyên. */
export function toTitleCaseVn(value: string): string {
    return value
        .toLowerCase()
        .split(/([\s()[\]{}"“”'‘’/\\|–—-]+)/)
        .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
        .join('');
}
