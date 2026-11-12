'use client';

import React from 'react';
import {useRouter} from 'next/navigation';

/**
 * Trang Danh mục đã bỏ từ tái cấu trúc 1/11/2026 (Nhóm trà → Sản phẩm):
 * Danh mục không còn là tầng phân loại nữa, mọi link cũ tự chuyển sang
 * trang Nhóm trà để không gãy bookmark. File giữ lại làm cầu nối, không
 * còn giao diện quản lý danh mục.
 */
export default function DanhMucRedirectPage() {
    const router = useRouter();

    React.useEffect(() => {
        router.replace('/cms/nhom-tra');
    }, [router]);

    return (
        <div style={{padding: 24, color: '#3B5518'}}>
            Danh mục đã được thay bằng Nhóm trà - đang chuyển sang trang Nhóm trà...
        </div>
    );
}
