'use client';

import {useState} from 'react';
import {ChevronRight} from './icons';
import {useLanguage} from '@/context/LanguageContext';

type InfoRow = {label: string; value: string};
type HarvestPhase = {label: string; time: string};
type FaqItem = {q: string; a: string};

type Props = {
    description: string;
    infoTable: InfoRow[];
    harvestPhases: HarvestPhase[];
    faqData: FaqItem[];
};

export default function ProductTabs({description, infoTable, harvestPhases, faqData}: Props) {
    const {t} = useLanguage();
    const [activeTab, setActiveTab] = useState(0);
    const [openFaq, setOpenFaq] = useState<number | null>(1);

    const tabs = [
        t('treeDetail.infoTab', 'Thông tin cây trà'),
        t('treeDetail.harvestTab', 'Thời gian thu hoạch'),
        t('treeDetail.faqTab', 'Những câu hỏi thường gặp'),
    ];

    return (
        <div className="px-4 sm:px-8 lg:px-[10%]">
            {/* Tab bar */}
            <div className="border-b border-[#3B5518] flex" role="tablist" aria-label={t('treeDetail.infoTab', 'Thông tin chi tiết cây trà')}>
                {tabs.map((tab, idx) => (
                    <button
                        key={tab}
                        type="button"
                        id={`tea-tab-${idx}`}
                        role="tab"
                        aria-selected={activeTab === idx}
                        aria-controls={`tea-panel-${idx}`}
                        onClick={() => setActiveTab(idx)}
                        className={`flex-1 text-center py-4 text-sm sm:text-base transition-colors relative ${
                            activeTab === idx
                                ? 'text-[#3B5518] font-semibold'
                                : 'text-[#7B943E] hover:text-[#3B5518]'
                        }`}
                    >
                        {tab}
                        {activeTab === idx && (
                            <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-[#3B5518]" />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div className="py-10 lg:py-14">
                {/* --- Tab 0: Thông tin cây trà --- */}
                {activeTab === 0 && (
                    <div id="tea-panel-0" role="tabpanel" aria-labelledby="tea-tab-0" className="relative">
                        <div className="absolute left-0 top-20 opacity-20 pointer-events-none hidden lg:block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/images/Vector.png"
                                alt=""
                                className="w-24"
                            />
                        </div>
                        <div className="absolute right-0 bottom-0 opacity-20 pointer-events-none hidden lg:block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/images/Vector7.png"
                                alt=""
                                className="w-24"
                            />
                        </div>

                        <h3 className="font-source-serif-4 text-3xl lg:text-4xl text-[#3B5518] text-center italic">
                            {t('treeDetail.infoTab', 'Thông tin cây trà')}
                        </h3>
                        <p className="text-sm lg:text-base text-center max-w-3xl mx-auto mt-4 leading-relaxed opacity-80">
                            {description}
                        </p>

                        <div className="max-w-2xl mx-auto mt-8 border border-[#3B5518] rounded-lg overflow-hidden">
                            {infoTable.map((row, idx) => (
                                <div
                                    key={idx}
                                    className={`grid grid-cols-[140px_1fr] sm:grid-cols-[180px_1fr] ${
                                        idx !== 0 ? 'border-t border-[#3B5518]' : ''
                                    }`}
                                >
                                    <div className="px-4 py-3 border-r border-[#3B5518] font-source-serif-4 font-bold text-[#3B5518]">
                                        {row.label}
                                    </div>
                                    <div className="px-4 py-3">{row.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- Tab 1: Thời gian thu hoạch --- */}
                {activeTab === 1 && (
                    <div id="tea-panel-1" role="tabpanel" aria-labelledby="tea-tab-1" className="relative">
                        <div className="absolute right-0 top-0 opacity-20 pointer-events-none hidden lg:block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/images/Vector7.png"
                                alt=""
                                className="w-24"
                            />
                        </div>

                        <h3 className="font-source-serif-4 text-3xl lg:text-4xl text-[#3B5518] text-center italic">
                            {t('treeDetail.harvestTab', 'Thời gian thu hoạch')}
                        </h3>
                        <p className="text-sm text-center mt-3 opacity-70">
                            {t('treeDetail.harvestFrequencyDesc', 'Tần suất thu hoạch 1 lần/năm - Vụ Xuân')}
                        </p>

                        {/* Timeline */}
                        <div className="max-w-3xl mx-auto mt-16 px-6 sm:px-12">
                            {/* Row: line + dots only */}
                            <div className={harvestPhases.length === 1 ? 'relative flex items-center justify-center h-4' : 'relative flex items-center justify-between h-4'}>
                                {/* Horizontal line */}
                                {harvestPhases.length > 1 && <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-[#3B5518]" />}
                                {harvestPhases.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className="relative z-10 w-4 h-4 rounded-full bg-[#4a9a5a] shadow-[0_0_10px_rgba(74,154,90,0.7)] shrink-0"
                                    />
                                ))}
                            </div>

                            {/* Labels row below */}
                            <div className={harvestPhases.length === 1 ? 'flex justify-center mt-4' : 'flex justify-between mt-4'}>
                                {harvestPhases.map((phase, idx) => (
                                    <div
                                        key={idx}
                                        className="flex flex-col items-center text-center"
                                    >
                                        <p className="text-xs opacity-60">{phase.label}</p>
                                        <p className="font-source-serif-4 text-[#3B5518] text-lg lg:text-xl mt-1 whitespace-nowrap italic">
                                            {phase.time}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- Tab 2: FAQ --- */}
                {activeTab === 2 && (
                    <div id="tea-panel-2" role="tabpanel" aria-labelledby="tea-tab-2" className="relative">
                        <div className="absolute left-0 bottom-10 opacity-20 pointer-events-none hidden lg:block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/images/Vector.png"
                                alt=""
                                className="w-24"
                            />
                        </div>
                        <div className="absolute right-0 top-20 opacity-20 pointer-events-none hidden lg:block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/images/Vector7.png"
                                alt=""
                                className="w-24"
                            />
                        </div>

                        <h3 className="font-source-serif-4 text-3xl lg:text-4xl text-[#3B5518] text-center italic mb-8">
                            {t('treeDetail.faqTab', 'Những câu hỏi thường gặp')}
                        </h3>

                        <div className="max-w-3xl mx-auto space-y-3">
                            {faqData.map((item, idx) => {
                                const isOpen = openFaq === idx;
                                return (
                                    <div
                                        key={idx}
                                        className={`border border-[#3B5518] rounded-xl overflow-hidden transition-colors duration-300 ${
                                            isOpen ? 'bg-[#3B5518]' : 'bg-[#F4F0E4]/70'
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            aria-expanded={isOpen}
                                            aria-controls={`tea-faq-answer-${idx}`}
                                            onClick={() => setOpenFaq(isOpen ? null : idx)}
                                            className="w-full flex items-center justify-between px-5 py-4 text-left"
                                        >
                                            <span
                                                className={`font-source-serif-4 text-base lg:text-lg ${
                                                    isOpen ? 'text-[#F1EEE0]' : 'text-[#3B5518]'
                                                } pr-4`}
                                            >
                                                {item.q}
                                            </span>
                                            <div
                                                className={`shrink-0 transition-transform duration-300 ease-out ${
                                                    isOpen ? 'rotate-90' : ''
                                                }`}
                                            >
                                                <ChevronRight />
                                            </div>
                                        </button>
                                        <div
                                            id={`tea-faq-answer-${idx}`}
                                            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                                                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                                            }`}
                                        >
                                            <div className="min-h-0 overflow-hidden">
                                                <div className="px-5 pb-4 leading-relaxed text-[#F1EEE0]/80 whitespace-pre-line">
                                                    {item.a}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
