import type {Metadata} from 'next';
import {Geist, Geist_Mono, Source_Serif_4} from 'next/font/google';
import './globals.css';
import StoreProvider from '@/components/providers/StoreProvider';
import {BRAND, HOME_COPY} from '@/constants/brand';
import {RED_LOGO} from '@/constants/brandAssets';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

const sourceSerif4 = Source_Serif_4({
    variable: '--font-source-serif',
    subsets: ['latin', 'latin-ext', 'vietnamese'],
    weight: ['400', '500', '600', '700'],
    style: ['normal', 'italic'],
});

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lungvaitea.vn'),
    title: {
        default: `${BRAND.name} - ${BRAND.tagline}`,
        template: `%s | ${BRAND.name}`,
    },
    description: HOME_COPY.bannerDescription,
    keywords: ['trà Shan Tuyết', 'trà cổ thụ', 'Lùng Vài Trà', 'trà Hà Giang', 'trà thượng hạng', 'trà vùng cao'],
    authors: [{name: BRAND.name}],
    creator: BRAND.name,
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
        },
    },
    icons: {
        icon: RED_LOGO.src,
        shortcut: RED_LOGO.src,
        apple: RED_LOGO.src,
    },
    openGraph: {
        type: 'website',
        locale: 'vi_VN',
        siteName: BRAND.name,
        title: `${BRAND.name} - ${BRAND.tagline}`,
        description: HOME_COPY.bannerDescription,
        images: [
            {
                url: RED_LOGO.src,
                width: RED_LOGO.width,
                height: RED_LOGO.height,
                alt: `${BRAND.name} - ${BRAND.tagline}`,
            },
        ],
    },
    twitter: {
        card: 'summary',
        title: `${BRAND.name} - ${BRAND.tagline}`,
        description: HOME_COPY.bannerDescription,
        images: [RED_LOGO.src],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi" data-scroll-behavior="smooth">
            <body className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif4.variable} antialiased overflow-x-clip`}>
                <StoreProvider>{children}</StoreProvider>
            </body>
        </html>
    );
}
