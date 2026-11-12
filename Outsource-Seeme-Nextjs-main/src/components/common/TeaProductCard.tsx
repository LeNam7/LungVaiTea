'use client';

import Link from 'next/link';
import React from 'react';
import {toTitleCaseVn} from '@/utils/text';
import {useLanguage} from '@/context/LanguageContext';

export type TeaProductTag = 'best-seller' | 'new' | 'sold-out';

type Props = {
    href: string;
    imageSrc: string;
    name: string;
    price: string;
    weight?: string;
    tag?: TeaProductTag;
    // Kiểu trình bày giá + khối lượng: 'stacked' (mặc định) giá nằm riêng 1
    // dòng, khối lượng xuống dòng dưới - dùng ở trang chủ (ảnh dọc hẹp) và
    // khu gợi ý; 'inline' giá và khối lượng cùng 1 dòng, khối lượng nằm bên
    // phải giá - dùng ở trang Sản phẩm trà (ảnh rộng hơn, dễ đọc hơn).
    layout?: 'stacked' | 'inline';
};

const TAG_CONFIG: Record<TeaProductTag, {label: string; className: string}> = {
    'best-seller': {
        label: 'BÁN CHẠY',
        className: 'bg-[#EF3E4A] text-white',
    },
    new: {
        label: 'NEW',
        className: 'bg-[#3E9E4A] text-white',
    },
    'sold-out': {
        label: 'TẠM HẾT HÀNG',
        className: 'bg-[#EF3E4A] text-white',
    },
};

export default function TeaProductCard({href, imageSrc, name, price, weight, tag, layout = 'stacked'}: Props) {
    const {locale} = useLanguage();
    const badge = tag ? TAG_CONFIG[tag] : null;
    const badgeLabel = badge
        ? tag === 'best-seller'
            ? locale === 'en'
                ? 'BEST SELLER'
                : 'BÁN CHẠY'
            : tag === 'sold-out'
              ? locale === 'en'
                  ? 'OUT OF STOCK'
                  : 'TẠM HẾT HÀNG'
              : 'NEW'
        : null;

    const finalHref = locale === 'en' && !href.startsWith('/en') ? `/en${href}` : href;

    return (
        <Link
            href={finalHref}
            className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[8px] bg-white p-1.5 transition-shadow hover:shadow-[0_12px_24px_rgba(59,85,24,0.16)] sm:p-[7px]"
        >
            {/* Image */}
            <div className="relative w-full aspect-[10/11] bg-[#F0F0EE] overflow-hidden rounded-[6px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={imageSrc || '/images/shan-tuyet-tea-tree.jpg'}
                    alt={name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105"
                    style={{willChange: 'scale', transition: 'scale 0.3s ease-out'}}
                    onError={(e) => {
                        const img = e.currentTarget;
                        img.onerror = null;
                        img.src = '/images/shan-tuyet-tea-tree.jpg';
                    }}
                />
                {/* Tag badge */}
                {badge && (
                    <span
                        className={`absolute top-[5px] right-[5px] h-5 rounded-[2px] px-1.5 text-[10px] font-bold leading-5 tracking-normal sm:h-[24px] sm:px-2 sm:text-[12px] sm:leading-[22px] ${badge.className}`}
                    >
                        {badgeLabel}
                    </span>
                )}
            </div>

            {/* Info - white bg with padding. Tên trà viết thường + in đậm.
                layout 'stacked': giá nằm gọn 1 dòng, khối lượng xuống dòng
                dưới (thẻ mẫu Bạch Trà Mẫu Đơn). layout 'inline': giá và khối
                lượng cùng 1 dòng, khối lượng bên phải giá (trang Sản phẩm
                trà, ảnh rộng hơn). */}
            <div className="flex flex-1 flex-col gap-1 bg-white pb-1 pt-2 sm:pt-3">
                <p className="line-clamp-2 text-xs font-bold leading-snug text-[#3B5518] transition-colors duration-300 sm:text-sm">{toTitleCaseVn(name)}</p>
                {layout === 'inline' ? (
                    <div className="mt-auto flex flex-wrap items-end justify-between gap-x-2">
                        <span className="whitespace-nowrap text-[11px] font-semibold leading-none text-[#7B943E] sm:text-[13px] lg:text-[15px] xl:text-[16px]">{price}</span>
                        {weight && <span className="whitespace-nowrap text-xs leading-none text-[#969696]">{weight}</span>}
                    </div>
                ) : (
                    <div className="mt-auto flex flex-col gap-0.5">
                        <span className="whitespace-nowrap text-[11px] font-semibold leading-none text-[#7B943E] sm:text-[13px] lg:text-[16px]">{price}</span>
                        {weight && <span className="text-xs leading-none text-[#969696]">{weight}</span>}
                    </div>
                )}
            </div>
        </Link>
    );
}
