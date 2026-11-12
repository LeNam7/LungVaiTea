import {NextRequest, NextResponse} from 'next/server';
import {
    addSepayTransaction,
    buildSepayTransaction,
    isIncomingSepayTransaction,
    type SepayRawBody,
} from '@/lib/sepay-realtime';

export const dynamic = 'force-dynamic';

function hasValidSecret(req: NextRequest) {
    const secret = process.env.SEPAY_WEBHOOK_SECRET;
    if (!secret) return true;

    const auth = req.headers.get('authorization') ?? '';
    const headerSecret =
        req.headers.get('x-sepay-webhook-secret') ??
        req.headers.get('x-api-key') ??
        '';

    return auth === `Bearer ${secret}` || headerSecret === secret;
}

export async function POST(req: NextRequest) {
    if (!hasValidSecret(req)) {
        return NextResponse.json({success: false, message: 'Unauthorized'}, {status: 401});
    }

    let body: SepayRawBody;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({success: false, message: 'Invalid JSON'}, {status: 400});
    }

    const transaction = buildSepayTransaction(body);
    addSepayTransaction(transaction);

    return NextResponse.json({
        success: true,
        message: isIncomingSepayTransaction(transaction)
            ? 'SePay transaction received'
            : 'SePay transaction received but ignored by payment matcher',
        transaction,
    });
}
