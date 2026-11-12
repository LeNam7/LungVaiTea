import React from 'react';
import '@/app/globals.css';
import HeaderClient from '@/components/layout/HeaderClient';
import Footer from '@/components/layout/Footer';
import ButtonContactFixed from '@/components/layout/ButtonContactFixed';
import ToastContainer from '@/components/ui/ToastContainer';
import { LanguageProvider, type Locale } from '@/context/LanguageContext';
import { cookies, headers } from 'next/headers';

export default async function HomeLayout({children}: {children: React.ReactNode}) {
    const cookieStore = await cookies();
    const headersList = await headers();
    const headerLocale = headersList.get('x-next-locale') as Locale | null;
    const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value as Locale | null;
    const initialLocale: Locale = headerLocale === 'en' || cookieLocale === 'en' ? 'en' : 'vi';

    return (
        <LanguageProvider initialLocale={initialLocale}>
            <div>
                <ButtonContactFixed />
                <HeaderClient />
                <div className="bg-[#ddd1b9] pt-[60px]">{children}</div>
                <Footer />
                <ToastContainer />
            </div>
        </LanguageProvider>
    );
}
