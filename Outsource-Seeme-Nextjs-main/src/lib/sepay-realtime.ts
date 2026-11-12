export type SepayRawBody = Record<string, unknown>;

export type SepayTransaction = {
    id: string;
    gateway: string | null;
    transactionDate: string | null;
    accountNumber: string | null;
    content: string;
    transferType: string;
    transferAmount: number;
    referenceCode: string | null;
    raw: SepayRawBody;
    receivedAt: string;
};

export type SepaySocketEvent =
    | {type: 'history'; transactions: SepayTransaction[]}
    | {type: 'transaction'; transaction: SepayTransaction}
    | {type: 'payment-confirmed'; transaction: SepayTransaction};

type SepayListener = {
    id: string;
    code?: string;
    amount?: number;
    send: (event: SepaySocketEvent) => void;
};

type SepayRealtimeState = {
    history: SepayTransaction[];
    listeners: Map<string, SepayListener>;
};

const MAX_HISTORY = 300;

const globalForSepay = globalThis as typeof globalThis & {
    __sepayRealtimeState?: SepayRealtimeState;
};

const state =
    globalForSepay.__sepayRealtimeState ??
    (globalForSepay.__sepayRealtimeState = {
        history: [],
        listeners: new Map<string, SepayListener>(),
    });

export function normalizeTransferContent(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\u0111\u0110]/g, (char) => (char === '\u0111' ? 'd' : 'D'))
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase();
}

export function buildSepayTransaction(body: SepayRawBody): SepayTransaction {
    const rawId =
        body.id ??
        body.transactionId ??
        body.transactionID ??
        body.referenceCode ??
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    return {
        id: String(rawId),
        gateway: nullableString(body.gateway),
        transactionDate: nullableString(body.transactionDate),
        accountNumber: nullableString(body.accountNumber),
        content: String(body.content ?? ''),
        transferType: String(body.transferType ?? '').toUpperCase(),
        transferAmount: Number(body.transferAmount ?? 0),
        referenceCode: nullableString(body.referenceCode),
        raw: body,
        receivedAt: new Date().toISOString(),
    };
}

export function isIncomingSepayTransaction(transaction: SepayTransaction) {
    return transaction.transferType === 'IN' || transaction.transferType === 'INCOMING';
}

export function matchesSepayPayment(transaction: SepayTransaction, code?: string, amount?: number) {
    if (!code) return false;
    if (!isIncomingSepayTransaction(transaction)) return false;

    const contentMatches = normalizeTransferContent(transaction.content).includes(
        normalizeTransferContent(code),
    );
    const amountMatches = typeof amount !== 'number' || transaction.transferAmount >= amount;

    return contentMatches && amountMatches;
}

export function addSepayTransaction(transaction: SepayTransaction) {
    const exists = state.history.some((item) => item.id === transaction.id);
    if (!exists) {
        state.history.unshift(transaction);
        state.history = state.history.slice(0, MAX_HISTORY);
    }

    broadcastSepayEvent({type: 'transaction', transaction});

    for (const listener of state.listeners.values()) {
        if (matchesSepayPayment(transaction, listener.code, listener.amount)) {
            listener.send({type: 'payment-confirmed', transaction});
        }
    }
}

export function getSepayHistory() {
    return state.history;
}

export function subscribeSepay(listener: Omit<SepayListener, 'id'>) {
    const id = crypto.randomUUID();
    state.listeners.set(id, {...listener, id});
    listener.send({type: 'history', transactions: state.history});

    for (const transaction of state.history) {
        if (matchesSepayPayment(transaction, listener.code, listener.amount)) {
            listener.send({type: 'payment-confirmed', transaction});
            break;
        }
    }

    return () => {
        state.listeners.delete(id);
    };
}

function broadcastSepayEvent(event: SepaySocketEvent) {
    for (const listener of state.listeners.values()) {
        listener.send(event);
    }
}

function nullableString(value: unknown) {
    if (value === null || value === undefined || value === '') return null;
    return String(value);
}
