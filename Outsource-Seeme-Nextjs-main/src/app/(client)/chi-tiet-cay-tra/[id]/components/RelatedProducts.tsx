'use client';

import React from 'react';
import TeaTreeCard from '@/components/common/TeaTreeCard';
import {useLanguage} from '@/context/LanguageContext';

type RelatedItem = {
    id: number;
    code: string;
    name: string;
    priceRange: string;
    yield: string;
    teaType?: string | null;
    buyers: string;
    images: string;
};

type Props = {
    related: RelatedItem[];
};

export default function RelatedProducts({related}: Props) {
    const {t} = useLanguage();
    return (
        <div className="px-4 sm:px-8 lg:px-[10%] pb-12 lg:pb-16">
            <div className="flex items-center justify-center mb-6">
                <h2 className="font-source-serif-4 text-3xl lg:text-4xl text-[#7F9635] text-center italic">
                    {t('detail.youMayLike', 'Bạn có thể thích')}
                </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {related.map((item) => (
                    <TeaTreeCard
                        key={item.id}
                        href={`/chi-tiet-cay-tra/${item.id}`}
                        imageSrc={item.images}
                        code={item.code}
                        name={item.name}
                        price={item.priceRange}
                        yieldInfo={item.yield}
                        teaType={item.teaType}
                        buyers={item.buyers || undefined}
                    />
                ))}
            </div>
        </div>
    );
}
