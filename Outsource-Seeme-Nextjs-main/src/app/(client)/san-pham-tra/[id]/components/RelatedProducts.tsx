'use client';

import React from 'react';
import TeaProductCard from '@/components/common/TeaProductCard';
import {fmt} from './icons';
import {useLanguage} from '@/context/LanguageContext';

import type {TeaProductTag} from '@/components/common/TeaProductCard';

type RelatedItem = {
    id: number;
    name: string;
    price: number;
    weight?: string;
    tag?: TeaProductTag;
    image?: string;
    href?: string;
};

type Props = {
    related: RelatedItem[];
};

const PAGE_SIZE = 5;

type RelatedPaginationProps = {
    currentPage: number;
    totalPages: number;
    onChange: (page: number) => void;
};

const RelatedPagination = ({currentPage, totalPages, onChange}: RelatedPaginationProps) => {
    if (totalPages <= 1) return null;

    const btnBase = 'h-11 w-11 rounded border text-sm font-medium transition-colors duration-200';
    const active = 'border-[#7F9635] bg-[#7F9635] text-white font-bold';
    const inactive = 'border-[#3B5518]/45 text-[#3B5518] hover:bg-[#7F9635]/20';
    const disabled = 'border-[#3B5518]/15 text-[#3B5518]/30';

    return (
        <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Phân trang sản phẩm gợi ý">
            <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => onChange(currentPage - 1)}
                className={`${btnBase} ${currentPage === 1 ? disabled : inactive}`}
                aria-label="Trang trước"
            >
                {'<'}
            </button>

            {Array.from({length: totalPages}).map((_, index) => {
                const page = index + 1;
                return (
                    <button
                        key={page}
                        type="button"
                        onClick={() => onChange(page)}
                        aria-current={page === currentPage ? 'page' : undefined}
                        className={`${btnBase} ${page === currentPage ? active : inactive}`}
                    >
                        {page}
                    </button>
                );
            })}

            <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => onChange(currentPage + 1)}
                className={`${btnBase} ${currentPage === totalPages ? disabled : inactive}`}
                aria-label="Trang sau"
            >
                {'>'}
            </button>
        </nav>
    );
};

export default function RelatedProducts({related}: Props) {
    const {t} = useLanguage();
    const [currentPage, setCurrentPage] = React.useState(1);
    const sectionRef = React.useRef<HTMLDivElement | null>(null);
    const totalPages = Math.max(1, Math.ceil(related.length / PAGE_SIZE));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    const visibleRelated = related.slice(start, start + PAGE_SIZE);

    const handlePageChange = (page: number) => {
        const nextPage = Math.min(Math.max(1, page), totalPages);
        setCurrentPage(nextPage);
        requestAnimationFrame(() => {
            sectionRef.current?.scrollIntoView({block: 'start'});
        });
    };

    return (
        <div ref={sectionRef} className="scroll-mt-24 px-4 sm:px-8 lg:px-16 pb-12 lg:pb-16">
            <div className="flex items-center justify-center mb-6">
                <h2 className="font-source-serif-4 text-3xl lg:text-4xl text-[#7F9635] text-center italic">
                    {t('detail.youMayLike', 'Bạn có thể thích')}
                </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {visibleRelated.map((item) => (
                    <TeaProductCard
                        key={item.id}
                        href={item.href ?? `/san-pham-tra/${item.id}`}
                        imageSrc={item.image ?? '/images/shan-tuyet-tea-tree.jpg'}
                        name={item.name}
                        price={fmt(item.price)}
                        weight={item.weight}
                        tag={item.tag}
                    />
                ))}
            </div>

            <RelatedPagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                onChange={handlePageChange}
            />
        </div>
    );
}
