import { NextRequest, NextResponse } from 'next/server';
import { convertVndToUsd } from '@/utils/currency';

export const dynamic = 'force-dynamic';

async function getPayPalAccessToken(clientId: string, clientSecret: string, isSandbox = true) {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const endpoint = isSandbox
        ? 'https://api-m.sandbox.paypal.com/v1/oauth2/token'
        : 'https://api-m.paypal.com/v1/oauth2/token';

    const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    if (!res.ok) {
        throw new Error('Không thể xác thực với PayPal API');
    }
    const data = await res.json();
    return data.access_token;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { totalAmount, orderContent } = body;

        const clientId = process.env.PAYPAL_CLIENT_ID;
        const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
        const totalVnd = Number(totalAmount) || 0;
        const totalUsd = convertVndToUsd(totalVnd);

        if (!clientId || !clientSecret) {
            const mockOrderId = `PAYPAL_MOCK_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
            return NextResponse.json({
                success: true,
                previewMode: true,
                orderId: mockOrderId,
                totalVnd,
                totalUsd,
                message: 'PayPal Client ID chưa được cấu hình trong .env. Sử dụng chế độ Preview Test Mode.',
            });
        }

        const isSandbox = process.env.PAYPAL_ENVIRONMENT !== 'production';
        const accessToken = await getPayPalAccessToken(clientId, clientSecret, isSandbox);

        const endpoint = isSandbox
            ? 'https://api-m.sandbox.paypal.com/v2/checkout/orders'
            : 'https://api-m.paypal.com/v2/checkout/orders';

        const paypalRes = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [
                    {
                        reference_id: orderContent || `LVT-${Date.now()}`,
                        description: `Thanh toán đơn hàng Lùng Vài Trà (${orderContent || ''})`,
                        amount: {
                            currency_code: 'USD',
                            value: totalUsd.toFixed(2),
                        },
                    },
                ],
            }),
        });

        const data = await paypalRes.json();

        if (!paypalRes.ok) {
            return NextResponse.json(
                { success: false, message: data.message || 'Lỗi khi tạo đơn hàng PayPal' },
                { status: paypalRes.status }
            );
        }

        return NextResponse.json({
            success: true,
            previewMode: false,
            orderId: data.id,
            totalVnd,
            totalUsd,
            links: data.links,
        });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, message: err?.message || 'Lỗi xử lý tạo đơn PayPal' },
            { status: 500 }
        );
    }
}
