import React from 'react';

export const HeartOutline = ({filled = false}: {filled?: boolean}) => (
    <svg
        width="20"
        height="18"
        viewBox="-1.5 -1.5 25 22"
        fill="none"
    >
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 1.926C8.438-.144 5.849-.434 3.75.525 1.536 1.54 0 3.892 0 6.604c0 2.665 1.11 4.699 2.567 6.339 1.166 1.313 2.593 2.412 3.854 3.382.287.22.562.434.826.642.513.404 1.063.834 1.62 1.16.557.326 1.193.59 1.883.59s1.326-.264 1.883-.59c.558-.326 1.107-.756 1.62-1.16.264-.208.539-.422.826-.642 1.26-.97 2.688-2.07 3.854-3.382C20.39 11.303 21.5 9.269 21.5 6.604c0-2.712-1.535-5.064-3.75-6.077-2.099-.96-4.688-.67-7 1.399z"
            fill={filled ? '#7F9635' : 'none'}
            stroke="#7F9635"
            strokeWidth="1.8"
        />
    </svg>
);

export const CartIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18px"
        height="18px"
        viewBox="0 0 24 24"
    >
        <path
            fill="currentColor"
            d="M21 6H7.05L5.94 2.68A1 1 0 0 0 4.99 2h-3v2h2.28l3.54 10.63A2 2 0 0 0 9.71 16h7.59a2 2 0 0 0 1.87-1.3l2.76-7.35c.11-.31.07-.65-.11-.92A1 1 0 0 0 21 6m-3.69 8H9.72l-2-6h11.84zM10 18a2 2 0 1 0 0 4a2 2 0 1 0 0-4m7 0a2 2 0 1 0 0 4a2 2 0 1 0 0-4"
        />
    </svg>
);

export const ChevronDown = () => (
    <svg
        width="14"
        height="8"
        viewBox="0 0 14 8"
        fill="none"
        className="pointer-events-none"
    >
        <path
            d="M1 1l6 6 6-6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const ArrowLeft = () => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
    >
        <path
            d="M10 3L5 8l5 5"
            stroke="#E4D7BD"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const ArrowRight = () => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
    >
        <path
            d="M6 3l5 5-5 5"
            stroke="#E4D7BD"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const fmt = (n: number) => `${n.toLocaleString('vi-VN')} VND`;
