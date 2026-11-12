'use client';

import React from 'react';

/** Một dòng có phải tiêu đề mục viết hoa toàn bộ không ("THÔNG TIN SẢN PHẨM", "CÔNG DỤNG"). */
const isAllCapsHeading = (line: string) => {
    const text = line.trim();
    return text.length >= 3 && text.length <= 40 && text === text.toUpperCase() && text !== text.toLowerCase();
};

/**
 * Nội dung mô tả sản phẩm (văn bản thuần từ API) hiển thị có phân cấp khoảng cách.
 * QUY TẮC (Hải chốt 06/11/2026): CHỈ tiêu đề mục (tên accordion: "Thông tin sản phẩm",
 * "Quy cách & Khối lượng", "Hướng dẫn sử dụng") mới in đậm; TOÀN BỘ chữ bên trong
 * nội dung - kể cả đầu mục viết hoa, dòng dẫn, tên nhãn đầu dòng - đều để thường.
 */
export default function DescriptionContent({content}: {content: string}) {
    const blocks = content
        .split(/\n\s*\n/)
        .map((block) => block.trim())
        .filter(Boolean);

    return (
        <div className="space-y-3">
            {blocks.map((block, blockIdx) => {
                const lines = block
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean);
                if (lines.length === 0) return null;

                // Dòng dẫn đầu tiên: 1 dòng ngắn, không phải tiêu đề hoa, không kết thúc bằng ":".
                // (Để thường theo quy tắc trên; chỉ khác phông serif + màu đậm.)
                if (
                    blockIdx === 0 &&
                    lines.length === 1 &&
                    lines[0].length <= 60 &&
                    !isAllCapsHeading(lines[0]) &&
                    !lines[0].endsWith(':')
                ) {
                    return (
                        <p
                            key={blockIdx}
                            className="font-source-serif-4 text-base leading-relaxed text-[#3B5518]"
                        >
                            {lines[0]}
                        </p>
                    );
                }

                // Tên đầu mục viết hoa toàn bộ: để thường, chỉ cách đoạn trên rộng hơn.
                if (lines.length === 1 && isAllCapsHeading(lines[0])) {
                    return (
                        <p
                            key={blockIdx}
                            className="pt-2 text-[15px] leading-snug text-[#3B5518]"
                        >
                            {lines[0]}
                        </p>
                    );
                }

                return (
                    <div
                        key={blockIdx}
                        className="space-y-1.5"
                    >
                        {lines.map((line, lineIdx) => {
                            // Mọi dòng bên trong nội dung đều để thường, kể cả dòng chỉ có
                            // nhãn ("Các quy cách đóng gói của dòng này:") và dòng
                            // "Nhãn: nội dung" ("Thành phần: ...", "TRÁNG ẤM: ...").
                            return <p key={lineIdx}>{line}</p>;
                        })}
                    </div>
                );
            })}
        </div>
    );
}
