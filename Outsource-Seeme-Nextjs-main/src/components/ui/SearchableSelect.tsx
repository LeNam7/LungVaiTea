'use client';

import React from 'react';
import {createPortal} from 'react-dom';

/* Strip Vietnamese diacritics for accent-insensitive search */
function normalize(s: string) {
    return s
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase();
}

export interface SelectOption {
    code: string;
    name: string;
}

interface Props {
    options: SelectOption[];
    value: string;
    placeholder: string;
    onChange: (code: string, name: string) => void;
    disabled?: boolean;
    /** 'dark' = dark bg (cart), 'light' = cream bg (account) */
    variant?: 'dark' | 'light';
}

export default function SearchableSelect({
    options,
    value,
    placeholder,
    onChange,
    disabled,
    variant = 'dark',
}: Props) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const [dropRect, setDropRect] = React.useState<DOMRect | null>(null);
    const btnRef = React.useRef<HTMLButtonElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const selected = options.find((o) => o.code === value);
    const filtered = search
        ? options.filter((o) => normalize(o.name).includes(normalize(search)))
        : options;

    const openDropdown = () => {
        if (disabled) return;
        if (btnRef.current) setDropRect(btnRef.current.getBoundingClientRect());
        setOpen(true);
        setSearch('');
        setTimeout(() => inputRef.current?.focus(), 30);
    };

    const closeDropdown = React.useCallback(() => {
        setOpen(false);
        setSearch('');
    }, []);

    React.useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (!btnRef.current?.contains(e.target as Node)) {
                closeDropdown();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open, closeDropdown]);

    React.useEffect(() => {
        if (!open) return;
        window.addEventListener('scroll', closeDropdown, true);
        window.addEventListener('resize', closeDropdown);
        return () => {
            window.removeEventListener('scroll', closeDropdown, true);
            window.removeEventListener('resize', closeDropdown);
        };
    }, [open, closeDropdown]);

    const isLight = variant === 'light';
    const btnCls = isLight
        ? 'w-full px-4 py-3 rounded-xl border border-[#A7B36E] bg-[#F4F0E4] text-[#3B5518] text-sm text-left outline-none disabled:opacity-50 transition focus:border-[#3B5518]'
        : 'w-full px-4 py-3 rounded-xl bg-[#EEF2E4] text-[#3B5518] text-sm text-left outline-none disabled:opacity-50';
    const dropBg = isLight ? '#F4F0E4' : '#EEF2E4';

    return (
        <div className="relative">
            <button
                ref={btnRef}
                type="button"
                disabled={disabled}
                onClick={open ? closeDropdown : openDropdown}
                className={btnCls}
            >
                <span className="block pr-6 truncate">
                    {selected ? selected.name : <span className="text-[#3B5518]/40">{placeholder}</span>}
                </span>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
                        <path d="M1 1l4 4 4-4" stroke="#3B5518" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </button>

            {open && dropRect && typeof window !== 'undefined' &&
                createPortal(
                    <div
                        style={{
                            position: 'fixed',
                            top: dropRect.bottom + 4,
                            left: dropRect.left,
                            width: dropRect.width,
                            zIndex: 99999,
                            background: dropBg,
                            border: '1px solid rgba(127,150,53,0.3)',
                            borderRadius: '0.75rem',
                            overflow: 'hidden',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
                        }}
                    >
                        <div className="p-2 border-b border-[#7F9635]/20">
                            <input
                                ref={inputRef}
                                style={{background: dropBg}}
                                className="w-full px-3 py-1.5 rounded-lg bg-white text-[#3B5518] text-sm outline-none border border-[#A7B36E] placeholder:text-[#3B5518]/40"
                                placeholder="Tìm kiếm..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="max-h-52 overflow-y-auto">
                            {filtered.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-[#3B5518]/50">Không tìm thấy</div>
                            ) : (
                                filtered.map((o) => (
                                    <button
                                        key={o.code}
                                        type="button"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            onChange(o.code, o.name);
                                            closeDropdown();
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors text-[#3B5518] ${
                                            value === o.code
                                                ? 'bg-[#7F9635]/25 font-semibold'
                                                : 'hover:bg-[#7F9635]/15'
                                        }`}
                                    >
                                        {o.name}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}
