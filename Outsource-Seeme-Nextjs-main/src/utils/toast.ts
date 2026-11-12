export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastPayload {
    id: number;
    message: string;
    type: ToastType;
}

const EVENT = 'seeme-toast';

export const toast = {
    success: (message: string) => dispatch(message, 'success'),
    error: (message: string) => dispatch(message, 'error'),
    warning: (message: string) => dispatch(message, 'warning'),
    info: (message: string) => dispatch(message, 'info'),
};

function dispatch(message: string, type: ToastType) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
        new CustomEvent<ToastPayload>(EVENT, {detail: {id: Date.now(), message, type}}),
    );
}

export {EVENT as TOAST_EVENT};
