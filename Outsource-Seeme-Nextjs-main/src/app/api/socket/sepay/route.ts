import {NextRequest} from 'next/server';
import {subscribeSepay, type SepaySocketEvent} from '@/lib/sepay-realtime';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const encoder = new TextEncoder();

function sse(event: SepaySocketEvent) {
    return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
}

export async function GET(req: NextRequest) {
    const {searchParams} = new URL(req.url);
    const code = searchParams.get('code') ?? undefined;
    const rawAmount = Number(searchParams.get('amount') ?? '');
    const amount = Number.isFinite(rawAmount) && rawAmount > 0 ? rawAmount : undefined;

    let keepAlive: ReturnType<typeof setInterval> | undefined;
    let unsubscribe: (() => void) | undefined;

    const stream = new ReadableStream({
        start(controller) {
            unsubscribe = subscribeSepay({
                code,
                amount,
                send(event) {
                    controller.enqueue(sse(event));
                },
            });

            keepAlive = setInterval(() => {
                controller.enqueue(encoder.encode(': keep-alive\n\n'));
            }, 25000);
        },
        cancel() {
            unsubscribe?.();
            if (keepAlive) clearInterval(keepAlive);
        },
    });

    req.signal.addEventListener('abort', () => {
        unsubscribe?.();
        if (keepAlive) clearInterval(keepAlive);
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
        },
    });
}
