'use client';

import React, {useEffect, useState} from 'react';
import {TOAST_EVENT, ToastPayload, ToastType} from '@/utils/toast';

const ICONS: Record<ToastType, React.ReactNode> = {
    success: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="8.5" stroke="#4ade80" strokeWidth="1.2" />
            <path d="M5.5 9l2.5 2.5 4.5-5" stroke="#4ade80" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    error: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="8.5" stroke="#f87171" strokeWidth="1.2" />
            <path d="M6 6l6 6M12 6l-6 6" stroke="#f87171" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
    ),
    warning: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 1.5L16.5 15H1.5L9 1.5z" stroke="#7F9635" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M9 7v3.5" stroke="#7F9635" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="9" cy="12.5" r="0.75" fill="#7F9635" />
        </svg>
    ),
    info: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="8.5" stroke="#60a5fa" strokeWidth="1.2" />
            <path d="M9 8v5" stroke="#60a5fa" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="9" cy="5.5" r="0.85" fill="#60a5fa" />
        </svg>
    ),
};

const BAR_COLOR: Record<ToastType, string> = {
    success: '#4ade80',
    error: '#f87171',
    warning: '#7F9635',
    info: '#60a5fa',
};

interface ToastItem extends ToastPayload {
    exiting: boolean;
}

const DURATION = 3200;

export default function ToastContainer() {
    const [items, setItems] = useState<ToastItem[]>([]);

    useEffect(() => {
        const handler = (e: Event) => {
            const {id, message, type} = (e as CustomEvent<ToastPayload>).detail;
            setItems((prev) => [{id, message, type, exiting: false}, ...prev]);
            setTimeout(() => {
                setItems((prev) => prev.map((t) => (t.id === id ? {...t, exiting: true} : t)));
                setTimeout(() => {
                    setItems((prev) => prev.filter((t) => t.id !== id));
                }, 320);
            }, DURATION);
        };
        window.addEventListener(TOAST_EVENT, handler);
        return () => window.removeEventListener(TOAST_EVENT, handler);
    }, []);

    if (!items.length) return null;

    return (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[99999] flex flex-col gap-2 items-center pointer-events-none">
            {items.map((item) => (
                <div
                    key={item.id}
                    className="pointer-events-auto"
                    style={{
                        animation: item.exiting
                            ? 'toast-out 0.32s cubic-bezier(0.4,0,1,1) forwards'
                            : 'toast-in 0.34s cubic-bezier(0.34,1.4,0.64,1) forwards',
                    }}
                >
                    <div
                        className="relative flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl overflow-hidden"
                        style={{
                            background: '#3B5518',
                            border: '1px solid rgba(127,150,53,0.4)',
                            minWidth: 240,
                            maxWidth: 360,
                        }}
                    >
                        {/* top accent bar */}
                        <div
                            className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
                            style={{background: BAR_COLOR[item.type]}}
                        />
                        <div className="shrink-0">{ICONS[item.type]}</div>
                        <p className="text-sm leading-snug font-medium" style={{color: '#E4D7BD'}}>
                            {item.message}
                        </p>
                    </div>
                </div>
            ))}
            <style>{`
                @keyframes toast-in {
                    from { opacity: 0; transform: translateY(-16px) scale(0.94); }
                    to   { opacity: 1; transform: translateY(0)     scale(1); }
                }
                @keyframes toast-out {
                    from { opacity: 1; transform: translateY(0)      scale(1); }
                    to   { opacity: 0; transform: translateY(-12px)  scale(0.93); }
                }
            `}</style>
        </div>
    );
}
