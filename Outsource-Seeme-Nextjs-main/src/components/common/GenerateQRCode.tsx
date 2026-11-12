'use client';
import React from 'react';
import { BANK_INFO } from '@/constants/brand';

function removeAccents(str: string) {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\u0111\u0110]/g, (m) => (m === 'đ' ? 'd' : 'D'));
}

const GenerateQRCode = ({amount, content}: {amount?: number; content?: string}) => {
    const [loaded, setLoaded] = React.useState(false);
    const safeContent = encodeURIComponent(removeAccents(content || ''));
    const safeAccountName = encodeURIComponent(removeAccents(BANK_INFO.accountName));
    const qrCodeUrl = `https://vietqr.co/api/generate/${BANK_INFO.bankId}/${BANK_INFO.accountNumber}/${safeAccountName}/${amount || 0}/${safeContent}?style=2&logo=1&isMask=1&bg=61`;

    return (
        <div style={{width: 220, height: 220, position: 'relative'}}>
            {!loaded && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#3B5518',
                        borderRadius: 12,
                        gap: 12,
                    }}
                >
                    <svg
                        width="48"
                        height="48"
                        viewBox="0 0 48 48"
                        fill="none"
                        style={{opacity: 0.3}}
                    >
                        <rect x="2" y="2" width="18" height="18" rx="2" stroke="#E4D7BD" strokeWidth="2" fill="none"/>
                        <rect x="6" y="6" width="10" height="10" rx="1" fill="#E4D7BD" opacity="0.5"/>
                        <rect x="28" y="2" width="18" height="18" rx="2" stroke="#E4D7BD" strokeWidth="2" fill="none"/>
                        <rect x="32" y="6" width="10" height="10" rx="1" fill="#E4D7BD" opacity="0.5"/>
                        <rect x="2" y="28" width="18" height="18" rx="2" stroke="#E4D7BD" strokeWidth="2" fill="none"/>
                        <rect x="6" y="32" width="10" height="10" rx="1" fill="#E4D7BD" opacity="0.5"/>
                        <line x1="28" y1="28" x2="46" y2="28" stroke="#E4D7BD" strokeWidth="2" opacity="0.4"/>
                        <line x1="28" y1="34" x2="40" y2="34" stroke="#E4D7BD" strokeWidth="2" opacity="0.4"/>
                        <line x1="28" y1="40" x2="46" y2="40" stroke="#E4D7BD" strokeWidth="2" opacity="0.4"/>
                        <line x1="40" y1="28" x2="40" y2="46" stroke="#E4D7BD" strokeWidth="2" opacity="0.4"/>
                        <line x1="46" y1="34" x2="46" y2="46" stroke="#E4D7BD" strokeWidth="2" opacity="0.4"/>
                    </svg>
                    <div style={{display: 'flex', gap: 6}}>
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: '50%',
                                    background: '#7F9635',
                                    animation: `qrBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                                }}
                            />
                        ))}
                    </div>
                    <style>{`
                        @keyframes qrBounce {
                            0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
                            40% { transform: scale(1); opacity: 1; }
                        }
                    `}</style>
                </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={qrCodeUrl}
                alt="QR Code"
                style={{width: 220, height: 220, borderRadius: 12, display: loaded ? 'block' : 'none'}}
                onLoad={() => setLoaded(true)}
            />
        </div>
    );
};

export default GenerateQRCode;
