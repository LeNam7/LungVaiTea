'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { convertVndToUsd, formatUsd, formatVnd } from '@/utils/currency';
import { useLanguage } from '@/context/LanguageContext';

export interface PayPalTransactionResult {
    id: string;
    method: 'paypal';
    amountVnd: number;
    amountUsd: number;
    status: 'paid';
    paidAt: string;
}

interface PayPalPaymentModalProps {
    open: boolean;
    onClose: () => void;
    totalAmountVnd: number;
    orderContent: string;
    customerEmail?: string;
    onSuccess: (transaction: PayPalTransactionResult) => void;
}

export default function PayPalPaymentModal({
    open,
    onClose,
    totalAmountVnd,
    orderContent,
    customerEmail,
    onSuccess,
}: PayPalPaymentModalProps) {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const totalUsd = convertVndToUsd(totalAmountVnd);

    const handlePayPalCheckout = async () => {
        setLoading(true);
        setError(null);

        try {
            // 1. Create PayPal Order
            const createRes = await fetch('/api/payment/paypal/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    totalAmount: totalAmountVnd,
                    orderContent,
                }),
            });

            const createData = await createRes.json();
            if (!createRes.ok || !createData.success) {
                throw new Error(createData.message || 'Không thể khởi tạo giao dịch PayPal');
            }

            const orderId = createData.orderId;

            // 2. Capture PayPal Order
            const captureRes = await fetch('/api/payment/paypal/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId }),
            });

            const captureData = await captureRes.json();
            if (!captureRes.ok || !captureData.success) {
                throw new Error(captureData.message || 'Không thể xác nhận giao dịch PayPal');
            }

            // 3. Complete
            setTimeout(() => {
                setLoading(false);
                onSuccess({
                    id: orderId,
                    method: 'paypal',
                    amountVnd: totalAmountVnd,
                    amountUsd: totalUsd,
                    status: 'paid',
                    paidAt: new Date().toISOString(),
                });
            }, 800);
        } catch (err: any) {
            setLoading(false);
            setError(err?.message || 'Giao dịch PayPal gặp sự cố, vui lòng thử lại');
        }
    };

    if (!open) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    className="absolute inset-0 bg-black/60 backdrop-blur-xs"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={!loading ? onClose : undefined}
                />

                <motion.div
                    className="relative w-full max-w-md rounded-2xl bg-[#003087] border border-[#0079C1]/50 text-white shadow-2xl overflow-hidden z-10"
                    initial={{ scale: 0.92, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.92, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                    {/* Header */}
                    <div className="p-6 bg-[#001C48] flex items-center justify-between border-b border-[#0079C1]/30">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center font-bold text-xl text-[#003087]">
                                P
                            </div>
                            <div>
                                <h3 className="font-source-serif-4 text-xl font-bold text-white">
                                    {t('cartPage.paypalTitle', 'Thanh toán qua PayPal')}
                                </h3>
                                <p className="text-xs text-blue-200">
                                    PayPal Official Checkout Gateway
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            disabled={loading}
                            onClick={onClose}
                            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Amount Card */}
                    <div className="p-6 bg-[#00266B] flex items-center justify-between border-b border-[#0079C1]/20">
                        <div>
                            <span className="text-xs text-blue-200 uppercase tracking-wider block">
                                Số tiền đơn hàng
                            </span>
                            <span className="text-base font-bold text-white">
                                {formatVnd(totalAmountVnd)}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-blue-200 uppercase tracking-wider block">
                                Tổng thanh toán (USD)
                            </span>
                            <span className="text-2xl font-black text-[#FFC439]">
                                {formatUsd(totalUsd)}
                            </span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-900/60 border border-red-400 text-red-100 text-xs">
                                {error}
                            </div>
                        )}

                        <div className="bg-[#002159] p-4 rounded-xl border border-blue-400/20 text-xs text-blue-100 space-y-2">
                            <div className="flex justify-between">
                                <span className="opacity-75">Nội dung đơn hàng:</span>
                                <span className="font-semibold text-white">{orderContent}</span>
                            </div>
                            {customerEmail && (
                                <div className="flex justify-between">
                                    <span className="opacity-75">Email nhận biên nhận:</span>
                                    <span className="font-semibold text-white">{customerEmail}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="opacity-75">Phương thức:</span>
                                <span className="font-semibold text-[#FFC439]">PayPal Wallet / Linked Cards</span>
                            </div>
                        </div>

                        <p className="text-[11px] text-blue-200/80 text-center leading-relaxed">
                            Bằng cách bấm nút bên dưới, bạn đồng ý chuyển sang giao diện kết nối bảo mật của PayPal để hoàn tất thanh toán.
                        </p>

                        {/* PayPal Button */}
                        <div className="pt-2">
                            <button
                                type="button"
                                disabled={loading}
                                onClick={handlePayPalCheckout}
                                className="w-full py-3.5 rounded-full bg-[#FFC439] hover:bg-[#F2BA36] text-[#003087] font-bold text-base shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                            >
                                {loading ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#003087]/30 border-t-[#003087]" />
                                        <span>Đang kết nối PayPal...</span>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="italic font-black text-lg">PayPal</span>
                                        <span>Thanh toán {formatUsd(totalUsd)}</span>
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
