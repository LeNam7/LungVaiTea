'use client';

import {motion} from 'framer-motion';
import React from 'react';

interface HeroAnimateProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}

/**
 * Hero/above-fold animation - starts immediately on mount, no intersection observer.
 */
const HeroAnimate = ({children, className, delay = 0}: HeroAnimateProps) => {
    return (
        <motion.div
            initial={{opacity: 0, y: 30}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94]}}
            className={className}
        >
            {children}
        </motion.div>
    );
};

export default HeroAnimate;
