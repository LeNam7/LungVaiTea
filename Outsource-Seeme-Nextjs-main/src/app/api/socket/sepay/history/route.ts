import {NextResponse} from 'next/server';
import {getSepayHistory} from '@/lib/sepay-realtime';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({
        success: true,
        transactions: getSepayHistory(),
    });
}
