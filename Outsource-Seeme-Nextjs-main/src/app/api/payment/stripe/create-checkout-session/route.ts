import { NextRequest, NextResponse } from 'next/server';
import { convertVndToUsd } from '@/utils/currency';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { totalAmount, orderContent, customerEmail, customerName, returnUrl, cancelUrl } = body;

        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        const totalVnd = Number(totalAmount) || 0;
        const totalUsd = convertVndToUsd(totalVnd);

        // If Stripe API key is not configured, support graceful test preview
        if (!stripeSecretKey) {
            const mockSessionId = `cs_test_mock_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
            return NextResponse.json({
                success: true,
                previewMode: true,
                sessionId: mockSessionId,
                totalVnd,
                totalUsd,
                message: 'Stripe Secret Key chưa được cấu hình trong .env. Sử dụng chế độ Preview Test Mode.',
            });
        }

        // Call official Stripe API using standard fetch
        const params = new URLSearchParams();
        params.append('payment_method_types[0]', 'card');
        params.append('mode', 'payment');
        if (customerEmail) {
            params.append('customer_email', customerEmail);
        }
        params.append('client_reference_id', orderContent || `LVT-${Date.now()}`);
        params.append('success_url', returnUrl || `${req.nextUrl.origin}/gio-hang?stripe_status=success&session_id={CHECKOUT_SESSION_ID}`);
        params.append('cancel_url', cancelUrl || `${req.nextUrl.origin}/gio-hang?stripe_status=cancel`);

        // Convert to cents for USD
        const unitAmountCents = Math.round(totalUsd * 100);
        params.append('line_items[0][price_data][currency]', 'usd');
        params.append('line_items[0][price_data][unit_amount]', String(unitAmountCents));
        params.append('line_items[0][price_data][product_data][name]', `Đơn hàng Lùng Vài Trà (${orderContent || 'Trà Di Sản'})`);
        params.append('line_items[0][price_data][product_data][description]', `Thanh toán quốc tế đơn hàng ${orderContent || ''} (${totalVnd.toLocaleString('vi-VN')} VNĐ)`);
        params.append('line_items[0][quantity]', '1');

        const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${stripeSecretKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        const data = await stripeRes.json();

        if (!stripeRes.ok) {
            return NextResponse.json(
                { success: false, message: data.error?.message || 'Lỗi kết nối cổng Stripe' },
                { status: stripeRes.status }
            );
        }

        return NextResponse.json({
            success: true,
            previewMode: false,
            sessionId: data.id,
            checkoutUrl: data.url,
            totalVnd,
            totalUsd,
        });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, message: err?.message || 'Lỗi xử lý thanh toán Stripe' },
            { status: 500 }
        );
    }
}
