import { NextRequest, NextResponse } from 'next/server';

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
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ success: false, message: 'Thiếu orderId' }, { status: 400 });
        }

        const clientId = process.env.PAYPAL_CLIENT_ID;
        const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

        // If in preview / test mock
        if (!clientId || !clientSecret || orderId.startsWith('PAYPAL_MOCK_')) {
            return NextResponse.json({
                success: true,
                previewMode: true,
                orderId,
                status: 'COMPLETED',
                captureId: `CAPTURE_MOCK_${Date.now()}`,
                message: 'Giao dịch PayPal mô phỏng thành công trong chế độ Preview.',
            });
        }

        const isSandbox = process.env.PAYPAL_ENVIRONMENT !== 'production';
        const accessToken = await getPayPalAccessToken(clientId, clientSecret, isSandbox);

        const endpoint = isSandbox
            ? `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`
            : `https://api-m.paypal.com/v2/checkout/orders/${orderId}/capture`;

        const paypalRes = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await paypalRes.json();

        if (!paypalRes.ok) {
            return NextResponse.json(
                { success: false, message: data.message || 'Lỗi khi capture giao dịch PayPal' },
                { status: paypalRes.status }
            );
        }

        return NextResponse.json({
            success: true,
            previewMode: false,
            orderId: data.id,
            status: data.status,
            details: data,
        });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, message: err?.message || 'Lỗi khi capture đơn PayPal' },
            { status: 500 }
        );
    }
}
