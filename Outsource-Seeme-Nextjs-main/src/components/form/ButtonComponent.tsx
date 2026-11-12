import React from 'react';
import {cn} from '@/utils/cn';

type ButtonVariant = 'primary' | 'dark' | 'outline' | 'plain';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonShape = 'pill' | 'rounded';

type ButtonComponentProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    title?: string;
    loading?: boolean;
    color?: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    shape?: ButtonShape;
};

const variantClass: Record<ButtonVariant, string> = {
    primary: 'seeme-btn-primary',
    dark: 'seeme-btn-dark',
    outline: 'seeme-btn-outline',
    plain: 'seeme-btn-plain',
};

const sizeClass: Record<ButtonSize, string> = {
    sm: 'px-5 py-2 text-sm',
    md: 'px-8 py-2.5 text-sm',
    lg: 'px-10 py-3 text-base',
};

const shapeClass: Record<ButtonShape, string> = {
    pill: 'rounded-full',
    rounded: 'rounded-lg',
};

const ButtonComponent = ({
    title,
    children,
    onClick,
    loading,
    color,
    variant = 'primary',
    size = 'md',
    shape = 'pill',
    className,
    disabled,
    type = 'button',
    ...props
}: ButtonComponentProps) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={cn('seeme-btn min-h-11', sizeClass[size], shapeClass[shape], color || variantClass[variant], className)}
            {...props}
        >
            {loading && (
                <svg
                    className="animate-spin w-4 h-4 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                </svg>
            )}
            {children ?? title}
        </button>
    );
};

export default ButtonComponent;
