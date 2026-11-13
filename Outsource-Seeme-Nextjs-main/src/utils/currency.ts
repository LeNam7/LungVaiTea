export const DEFAULT_USD_VND_RATE = 25400;

export function getExchangeRate(): number {
    const envRate = Number(process.env.NEXT_PUBLIC_USD_VND_EXCHANGE_RATE);
    return !isNaN(envRate) && envRate > 0 ? envRate : DEFAULT_USD_VND_RATE;
}

export function convertVndToUsd(vndAmount: number, rate = getExchangeRate()): number {
    if (!vndAmount || vndAmount <= 0) return 0;
    return Number((vndAmount / rate).toFixed(2));
}

export function formatUsd(usdAmount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(usdAmount);
}

export function formatVnd(vndAmount: number): string {
    return `${(vndAmount || 0).toLocaleString('vi-VN')} VNĐ`;
}

export function formatVndWithUsd(vndAmount: number, rate = getExchangeRate()): string {
    const usd = convertVndToUsd(vndAmount, rate);
    return `${formatVnd(vndAmount)} (~ ${formatUsd(usd)})`;
}
