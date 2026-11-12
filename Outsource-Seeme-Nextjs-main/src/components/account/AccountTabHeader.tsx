import React from 'react';
import {cn} from '@/utils/cn';

type AccountTabHeaderProps = {
    title: string;
    meta?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
};

export default function AccountTabHeader({title, meta, actions, className}: AccountTabHeaderProps) {
    return (
        <div className={cn('mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
            <div>
                <h2 className="seeme-heading-on-dark text-2xl sm:text-[26px]">{title}</h2>
                {meta && <div className="mt-1 text-sm seeme-muted-on-dark">{meta}</div>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
    );
}
