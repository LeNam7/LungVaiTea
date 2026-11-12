'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface LanguageSwitcherProps {
    className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
    const { locale, setLocale } = useLanguage();

    return (
        <div
            className={`inline-flex items-center rounded-full border border-[#3B5518]/25 bg-white/40 p-0.5 text-xs backdrop-blur-sm ${className}`}
            role="group"
            aria-label="Chọn ngôn ngữ / Select language"
        >
            <button
                type="button"
                onClick={() => setLocale('vi')}
                className={`flex items-center justify-center rounded-full px-2.5 py-1 font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                    locale === 'vi'
                        ? 'bg-[#3B5518] text-[#DED1B9] shadow-sm'
                        : 'text-[#3B5518] hover:text-[#2A3E10] hover:bg-[#3B5518]/10'
                }`}
                title="Tiếng Việt"
            >
                VN
            </button>
            <button
                type="button"
                onClick={() => setLocale('en')}
                className={`flex items-center justify-center rounded-full px-2.5 py-1 font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                    locale === 'en'
                        ? 'bg-[#3B5518] text-[#DED1B9] shadow-sm'
                        : 'text-[#3B5518] hover:text-[#2A3E10] hover:bg-[#3B5518]/10'
                }`}
                title="English"
            >
                EN
            </button>
        </div>
    );
};

export default LanguageSwitcher;
