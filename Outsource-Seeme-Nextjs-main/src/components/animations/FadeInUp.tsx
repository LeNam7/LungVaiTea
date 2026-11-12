'use client';

import {motion} from 'framer-motion';
import React from 'react';

interface FadeInUpProps {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
    className?: string;
    once?: boolean;
    amount?: number | 'some' | 'all';
}

/**
 * Wraps children in a fade-up-in animation triggered when the element scrolls into view.
 */
const FadeInUp = ({children, delay = 0, duration = 0.55, className, once = true, amount = 0.15}: FadeInUpProps) => {
    return (
        <motion.div
            initial={{opacity: 0, y: 40}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once, amount}}
            transition={{duration, delay, ease: [0.25, 0.46, 0.45, 0.94]}}
            className={className}
        >
            {children}
        </motion.div>
    );
};

export default FadeInUp;
