export const DOMAINS = {
    STORAGE: process.env.NEXT_PUBLIC_STORAGE_URL,
    API: process.env.NEXT_PUBLIC_API_URL,
};

export const BASE_DOMAINS = {
    api: process.env.NEXT_PUBLIC_API_URL || '',
    path: process.env.NEXT_PUBLIC_PATH || '',
    serverIP: process.env.NEXT_PUBLIC_SERVER_IP || '',
};
