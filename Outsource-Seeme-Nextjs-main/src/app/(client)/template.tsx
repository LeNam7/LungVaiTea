'use client';

import {motion} from 'framer-motion';
import React from 'react';
import {usePathname} from 'next/navigation';

/**
 * Next.js App Router Template - re-renders on every navigation.
 * Provides a smooth fade-slide-up entrance for every client page.
 * - Normal navigation: scrolls to top instantly
 * - Hash navigation (e.g. /#ve-chung-toi): scrolls to the target section smoothly
 */
export default function Template({children}: {children: React.ReactNode}) {
    const pathname = usePathname();

    React.useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            // Small delay to let the new page render before scrolling to hash
            const timer = setTimeout(() => {
                const el = document.getElementById(hash.slice(1));
                if (el) {
                    el.scrollIntoView({behavior: 'smooth', block: 'start'});
                }
            }, 120);
            return () => clearTimeout(timer);
        } else {
            window.scrollTo({top: 0, left: 0, behavior: 'instant'});
        }
    }, [pathname]);

    return (
        <motion.div
            initial={{opacity: 0, y: 18}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -10}}
            transition={{duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94]}}
        >
            {children}
        </motion.div>
    );
}
