'use client';
import Link from 'next/link';
import {usePathname, useSearchParams} from 'next/navigation';
import {useState} from 'react';

interface Props {
    totalPages: number;
    currentPage: number;
    paramName?: string;
    scroll?: boolean;
}

export default function BlogPagination({totalPages, currentPage, paramName = 'page', scroll = true}: Props) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const safeTotalPages = Math.max(1, Math.floor(totalPages));
    const safeCurrentPage = Math.min(Math.max(1, Math.floor(currentPage)), safeTotalPages);
    const pageKey = `${pathname}?${searchParams.toString()}|${safeCurrentPage}|${safeTotalPages}`;
    const [optimisticState, setOptimisticState] = useState({key: pageKey, page: safeCurrentPage});
    const optimisticPage = optimisticState.key === pageKey ? optimisticState.page : safeCurrentPage;
    const displayPage = Math.min(Math.max(1, optimisticPage), safeTotalPages);
    const setOptimisticPage = (page: number) => setOptimisticState({key: pageKey, page});

    if (safeTotalPages <= 1) return null;

    const buildHref = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        const safePage = Math.min(Math.max(1, page), safeTotalPages);
        if (safePage === 1) {
            params.delete(paramName);
        } else {
            params.set(paramName, String(safePage));
        }
        const query = params.toString();
        return query ? `${pathname}?${query}` : pathname;
    };

    const pages: (number | '...')[] = [];
    if (safeTotalPages <= 7) {
        for (let i = 1; i <= safeTotalPages; i += 1) pages.push(i);
    } else {
        pages.push(1);
        if (displayPage > 3) pages.push('...');
        for (
            let i = Math.max(2, displayPage - 1);
            i <= Math.min(safeTotalPages - 1, displayPage + 1);
            i += 1
        ) {
            pages.push(i);
        }
        if (displayPage < safeTotalPages - 2) pages.push('...');
        pages.push(safeTotalPages);
    }

    const btnBase =
        'w-11 h-11 flex items-center justify-center rounded text-sm font-medium transition-colors duration-200';
    const active = 'bg-[#7F9635] text-white font-bold';
    const inactive = 'border border-[#3B5518]/45 text-[#3B5518] hover:bg-[#7F9635]/20';
    const disabled = 'border border-[#3B5518]/15 text-[#3B5518]/30';

    return (
        <nav
            className="flex items-center justify-center gap-2 mt-8 mb-6"
            aria-label="Phân trang tin tức"
        >
            {displayPage === 1 ? (
                <span className={`${btnBase} ${disabled}`} aria-disabled="true">
                    {'<'}
                </span>
            ) : (
                <Link
                    href={buildHref(displayPage - 1)}
                    prefetch={false}
                    scroll={scroll}
                    onClick={() => setOptimisticPage(displayPage - 1)}
                    className={`${btnBase} ${inactive}`}
                    aria-label="Trang trước"
                >
                    {'<'}
                </Link>
            )}

            {pages.map((page, index) =>
                page === '...' ? (
                    <span
                        key={`dots-${index}`}
                        className="w-11 h-11 flex items-center justify-center text-[#3B5518]/50"
                    >
                        ...
                    </span>
                ) : (
                    <Link
                        key={page}
                        href={buildHref(page)}
                        prefetch={false}
                        scroll={scroll}
                        onClick={() => setOptimisticPage(page)}
                        aria-current={page === displayPage ? 'page' : undefined}
                        className={`${btnBase} ${page === displayPage ? active : inactive}`}
                    >
                        {page}
                    </Link>
                ),
            )}

            {displayPage === safeTotalPages ? (
                <span className={`${btnBase} ${disabled}`} aria-disabled="true">
                    {'>'}
                </span>
            ) : (
                <Link
                    href={buildHref(displayPage + 1)}
                    prefetch={false}
                    scroll={scroll}
                    onClick={() => setOptimisticPage(displayPage + 1)}
                    className={`${btnBase} ${inactive}`}
                    aria-label="Trang sau"
                >
                    {'>'}
                </Link>
            )}
        </nav>
    );
}
