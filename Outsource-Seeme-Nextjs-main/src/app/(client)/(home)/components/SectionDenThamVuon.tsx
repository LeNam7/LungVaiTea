'use client';

import React from 'react';
import FadeInUp from '@/components/animations/FadeInUp';
import ContactForm from '@/components/common/ContactForm';
import AbsoluteBackground from '@/components/common/AbsoluteBackground';
import SectionHeading from '@/components/ui/SectionHeading';
import {HOME_COPY} from '@/constants/brand';
import {useLanguage} from '@/context/LanguageContext';

const SectionDenThamVuon = () => {
    const { t } = useLanguage();

    return (
        <div className="relative overflow-hidden bg-[#d6cab4]">
            <AbsoluteBackground src="/images/Rectangle1.png" />
            {/* ── Mobile layout (< lg) ── */}
            <div className="relative z-10 flex flex-col items-center gap-6 py-10 lg:hidden">
                <FadeInUp className="flex flex-col items-center gap-3 px-4">
                    <SectionHeading title={t('home.visitTitle', 'Đến thăm vườn - thưởng trà')} />
                    <p className="w-full max-w-[340px] text-center text-sm leading-6 text-pretty text-[#7F9635]">
                        {t('home.visitDesc', HOME_COPY.visit)}
                    </p>
                </FadeInUp>
                <FadeInUp
                    delay={0.12}
                    className="w-full"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/images/thamvuontra.png"
                        alt=""
                        className="h-[150px] w-full object-cover sm:h-[220px]"
                    />
                </FadeInUp>
                <FadeInUp
                    delay={0.2}
                    className="w-full px-4"
                >
                    <ContactForm
                        buttonText={t('contactForm.submit', 'Đăng ký')}
                        textareaRows={5}
                        compact
                        mobileTwoColumns
                    />
                </FadeInUp>
            </div>

            {/* ── Desktop layout (lg+) ── */}
            <div className="hidden lg:block relative z-10">
                <div className="w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/images/Rectangle1.png"
                        alt=""
                        className="w-full"
                    />
                </div>
                <div className="absolute top-16 left-5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/images/Frame233.png"
                        alt=""
                    />
                </div>
                <div className="absolute bottom-20 left-5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/images/Vector7.png"
                        alt=""
                    />
                </div>
                <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-around py-16 gap-10">
                    <FadeInUp className="flex flex-col gap-4 items-center">
                        <SectionHeading title={t('home.visitTitle', 'Đến thăm vườn - thưởng trà')} />
                        <p className="w-[900px] text-center text-pretty text-[#7F9635]">{t('home.visitDesc', HOME_COPY.visit)}</p>
                    </FadeInUp>
                    <div className="grid grid-cols-2 w-full px-[6%] gap-10">
                        <FadeInUp
                            delay={0.12}
                            className="flex flex-col gap-5 justify-between"
                        >
                            <ContactForm
                                buttonText={t('contactForm.submit', 'Đăng ký')}
                                textareaRows={5}
                            />
                        </FadeInUp>
                        <FadeInUp
                            delay={0.2}
                            className="w-full"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/images/thamvuontra.png"
                                alt=""
                                className="w-full h-full"
                            />
                        </FadeInUp>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SectionDenThamVuon;
