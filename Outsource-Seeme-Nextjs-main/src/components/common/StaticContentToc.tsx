'use client';

import {useEffect, useMemo, useState} from 'react';

type TocSection = {
    id: string;
    number: string;
    title: string;
};

type StaticContentTocProps = {
    sections: TocSection[];
};

const formatTitle = (value: string) => {
    const normalized = value.toLocaleLowerCase('vi-VN');
    return normalized.charAt(0).toLocaleUpperCase('vi-VN') + normalized.slice(1);
};

export default function StaticContentToc({sections}: StaticContentTocProps) {
    const sectionIds = useMemo(() => sections.map((section) => section.id), [sections]);
    const [activeId, setActiveId] = useState(sectionIds[0] ?? '');

    useEffect(() => {
        if (!sectionIds.length) return;

        const updateActiveSection = () => {
            const anchorLine = window.innerHeight * 0.28;
            let nextActiveId = sectionIds[0];

            for (const id of sectionIds) {
                const element = document.getElementById(id);
                if (!element) continue;

                if (element.getBoundingClientRect().top <= anchorLine) {
                    nextActiveId = id;
                } else {
                    break;
                }
            }

            setActiveId(nextActiveId);
        };

        updateActiveSection();
        window.addEventListener('scroll', updateActiveSection, {passive: true});
        window.addEventListener('resize', updateActiveSection);

        return () => {
            window.removeEventListener('scroll', updateActiveSection);
            window.removeEventListener('resize', updateActiveSection);
        };
    }, [sectionIds]);

    if (!sections.length) {
        return <p className="mt-4 text-sm leading-6 text-[#3B5518]/70">Thông tin tổng quan về thương hiệu.</p>;
    }

    return (
        <nav
            aria-label="Mục lục"
            className="space-y-3.5"
        >
            {sections.map((section) => {
                const isActive = activeId === section.id;

                return (
                    <a
                        key={section.id}
                        href={`#${section.id}`}
                        aria-current={isActive ? 'true' : undefined}
                        className={`block border-b-2 pb-1 text-[16px] leading-[1.25] text-[#3B5518] transition hover:border-[#7F9635] hover:text-[#24420F] ${
                            isActive ? 'border-[#7F9635] font-semibold' : 'border-transparent'
                        }`}
                    >
                        {section.number}. {formatTitle(section.title)}
                    </a>
                );
            })}
        </nav>
    );
}
