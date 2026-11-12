import React from 'react';
import {cn} from '@/utils/cn';

type InputComponentProps = React.InputHTMLAttributes<HTMLInputElement>;

const InputComponent = ({className, type = 'text', ...props}: InputComponentProps) => {
    return (
        <input
            type={type}
            className={cn('seeme-input px-4 py-3 text-base lg:px-6 lg:py-5 lg:text-xl rounded-[26px]', className)}
            {...props}
        />
    );
};

export default InputComponent;
