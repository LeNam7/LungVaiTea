'use client';

import {motion} from 'framer-motion';
import React from 'react';

interface StaggerContainerProps {
    children: React.ReactNode;
    className?: string;
    delay?: number; // stagger delay between items
    once?: boolean;
    amount?: number | 'some' | 'all';
}

const containerVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: {opacity: 0, y: 36},
    visible: {
        opacity: 1,
        y: 0,
        transition: {duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]},
    },
};

/**
 * Wraps a grid/list of children so each direct child animates in with a stagger effect.
 */
const StaggerContainer = ({children, className, once = true, amount = 0.1}: StaggerContainerProps) => {
    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{once, amount}}
            className={className}
        >
            {React.Children.map(children, (child) =>
                child ? <motion.div variants={itemVariants}>{child}</motion.div> : null,
            )}
        </motion.div>
    );
};

export {itemVariants};
export default StaggerContainer;
