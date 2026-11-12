'use client';

import ButtonComponent from '@/components/form/ButtonComponent';
import Link from 'next/link';
import React from 'react';
import FadeInUp from '@/components/animations/FadeInUp';
import SectionHeading from '@/components/ui/SectionHeading';
import AbsoluteBackground from '@/components/common/AbsoluteBackground';
import { useLanguage } from '@/context/LanguageContext';

const SectionBoSuuTapCayTra = () => {
    const { t, locale } = useLanguage();
    const localizePath = (path: string) => (locale === 'en' ? `/en${path === '/' ? '' : path}` : path);
    const image = '/images/bosuutaptraimg.svg';

    return (
        <div className="relative overflow-hidden bg-[#ccc2b0]">
            <AbsoluteBackground
                src="/images/bgbosuutapcaytra.png"
                className="contrast-[1.08] saturate-[1.03]"
            />
            {/* ── Mobile layout (< lg) ── */}
            <div className="relative z-10 lg:hidden flex flex-col items-center py-12 px-4 gap-6">
                <FadeInUp>
                    <SectionHeading title={t('home.teaCollectionsTitle', 'Bộ sưu tập cây trà')} />
                </FadeInUp>
                <FadeInUp
                    delay={0.12}
                    className="w-full"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={image}
                        alt=""
                        className="w-full object-cover rounded-xl"
                    />
                </FadeInUp>
                <FadeInUp delay={0.22}>
                    <Link href={localizePath('/bo-suu-tap-cay-tra')}>
                        <ButtonComponent title={t('home.exploreGarden', 'Khám phá vườn trà')} />
                    </Link>
                </FadeInUp>
            </div>
            {/* ── Desktop layout (lg+) ── */}
            <div className="hidden lg:block relative z-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/images/bgbosuutapcaytra.png"
                    alt="bgbo suu tap cay tra"
                    className="w-full h-auto object-cover"
                    style={{filter: 'contrast(1.08) saturate(1.03)'}}
                />
                <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-around">
                    <FadeInUp className="translate-y-[50px]">
                        <SectionHeading title={t('home.teaCollectionsTitle', 'Bộ sưu tập cây trà')} />
                    </FadeInUp>
                    <FadeInUp
                        delay={0.15}
                        className="w-[70%]"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={image}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    </FadeInUp>
                    <FadeInUp
                        delay={0.25}
                        className="-translate-y-[50px]"
                    >
                        <Link href={localizePath('/bo-suu-tap-cay-tra')}>
                            <ButtonComponent title={t('home.exploreGarden', 'Khám phá vườn trà')} color="border-[#9A8052] bg-[#9A8052] text-white hover:border-[#80683f] hover:bg-[#80683f]" />
                        </Link>
                    </FadeInUp>
                </div>
            </div>
        </div>
    );
};

export default SectionBoSuuTapCayTra;
