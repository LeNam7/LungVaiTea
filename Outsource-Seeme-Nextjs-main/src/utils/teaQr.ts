import QRCode from 'qrcode';
import {WHITE_LOGO} from '@/constants/brandAssets';

export type TeaQrInfo = {
    id: number;
    name?: string | null;
};

const QR_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://lungvaitea.vn';
const PUBLIC_HOSTS = ['lungvaitea.vn', 'www.lungvaitea.vn', 'lungvaitra.vn', 'www.lungvaitra.vn'];
const QR_DARK = '#213B0F';
const QR_LIGHT = '#FFFFFF';
const BRAND_CREAM = '#E4D7BD';
const DISPLAY_FONT = '"Source Serif 4"';

let displayFontPromise: Promise<void> | null = null;

const getQrBaseUrl = () => {
    if (typeof window !== 'undefined' && PUBLIC_HOSTS.includes(window.location.hostname)) {
        return window.location.origin;
    }

    return QR_BASE_URL.replace(/\/$/, '');
};

export const getTeaQrUrl = (teaId: number) => `${getQrBaseUrl()}/chi-tiet-cay-tra/${teaId}`;

const canvasToBlob = (canvas: HTMLCanvasElement, type = 'image/png', quality?: number) =>
    new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Không thể tạo ảnh QR'));
            },
            type,
            quality,
        );
    });

const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
    });

const drawRoundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
) => {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
};

const drawLogoMark = async (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, size: number) => {
    const badgeSize = size;
    const badgeX = centerX - badgeSize / 2;
    const badgeY = centerY - badgeSize / 2;

    ctx.save();
    ctx.fillStyle = QR_DARK;
    drawRoundRect(ctx, badgeX - 10, badgeY - 10, badgeSize + 20, badgeSize + 20, 18);
    ctx.fill();
    ctx.strokeStyle = BRAND_CREAM;
    ctx.lineWidth = Math.max(2, Math.round(size * 0.035));
    drawRoundRect(ctx, badgeX - 7, badgeY - 7, badgeSize + 14, badgeSize + 14, 16);
    ctx.stroke();

    try {
        const logo = await loadImage(WHITE_LOGO.src);
        const ratio = logo.width && logo.height ? logo.width / logo.height : 16 / 30;
        const logoHeight = badgeSize * 0.82;
        const logoWidth = logoHeight * ratio;
        ctx.drawImage(logo, centerX - logoWidth / 2, centerY - logoHeight / 2, logoWidth, logoHeight);
    } catch {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `700 ${Math.round(badgeSize * 0.62)}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('S', centerX, centerY + 1);
    }

    ctx.restore();
};

const loadDisplayFont = async () => {
    if (typeof document === 'undefined' || !document.fonts) return;
    if (document.fonts.check(`48px ${DISPLAY_FONT}`)) return;

    // Source Serif 4 do next/font nạp sẵn qua layout nên chỉ cần chờ document.fonts
    // tải xong, không còn nạp file ttf riêng như trước.
    displayFontPromise ??= document.fonts
        .load(`58px ${DISPLAY_FONT}`)
        .then(() => undefined)
        .catch(() => undefined);

    await displayFontPromise;
};

const createQrCanvas = async (url: string, size: number) => {
    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, url, {
        width: size,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
            dark: QR_DARK,
            light: QR_LIGHT,
        },
    });

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Trình duyệt không hỗ trợ canvas');

    await drawLogoMark(ctx, size / 2, size / 2, Math.round(size * 0.17));
    return canvas;
};

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
        const next = current ? `${current} ${word}` : word;
        if (ctx.measureText(next).width <= maxWidth || !current) {
            current = next;
        } else {
            lines.push(current);
            current = word;
        }
    }

    if (current) lines.push(current);
    return lines.slice(0, 3);
};

export const getTeaQrFileName = ({ id, name }: TeaQrInfo) => {
    const safeName = (name || `cay-tra-${id}`)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase()
        .slice(0, 60);

    return `qr-cay-tra-${id}-${safeName || 'lung-vai-tra'}.png`;
};

export const generateTeaQrThumbDataUrl = async (tea: TeaQrInfo, size = 144) => {
    const qrCanvas = await createQrCanvas(getTeaQrUrl(tea.id), size);
    return qrCanvas.toDataURL('image/png');
};

export const generateTeaQrOnlyDataUrl = async (tea: TeaQrInfo, size = 900) => {
    const qrCanvas = await createQrCanvas(getTeaQrUrl(tea.id), size);
    return qrCanvas.toDataURL('image/png');
};

export const generateTeaQrPreviewDataUrl = async (tea: TeaQrInfo) => generateTeaQrOnlyDataUrl(tea, 1024);

export const generateTeaQrDownloadBlob = async (tea: TeaQrInfo) => {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 1120;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Trình duyệt không hỗ trợ canvas');

    await loadDisplayFont();

    ctx.fillStyle = QR_DARK;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const qrSize = 650;
    const qrCanvas = await createQrCanvas(getTeaQrUrl(tea.id), qrSize);
    const qrX = (canvas.width - qrSize) / 2;
    ctx.drawImage(qrCanvas, qrX, 105, qrSize, qrSize);

    const title = tea.name || `Cây trà #${tea.id}`;
    ctx.fillStyle = BRAND_CREAM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `58px ${DISPLAY_FONT}, Arial, sans-serif`;
    const titleLines = wrapText(ctx, title, canvas.width - 130);
    titleLines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, 850 + index * 64);
    });

    const infoTop = 870 + titleLines.length * 64;
    ctx.fillStyle = '#DDEBAA';
    ctx.font = '700 34px Arial, sans-serif';
    ctx.fillText(`Mã Cây: #${tea.id}`, canvas.width / 2, Math.min(infoTop, 1065));

    return canvasToBlob(canvas);
};

export const generateTeaQrDownloadDataUrl = async (tea: TeaQrInfo) => {
    const blob = await generateTeaQrDownloadBlob(tea);
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};
