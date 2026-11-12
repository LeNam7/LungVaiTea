'use client';

import React, {useState} from 'react';
import {message} from 'antd';
import {sendContactAPI} from '@/api/ContactAPI';
import ButtonComponent from '@/components/form/ButtonComponent';
import {cn} from '@/utils/cn';
import {useLanguage} from '@/context/LanguageContext';

interface Props {
    buttonText?: string;
    textareaRows?: number;
    className?: string;
    buttonVariant?: 'pill' | 'plain';
    compact?: boolean;
    mobileTwoColumns?: boolean;
}

export default function ContactForm({
    buttonText = 'Gửi',
    textareaRows = 5,
    className,
    buttonVariant = 'pill',
    compact = false,
    mobileTwoColumns = false,
}: Props) {
    const { t } = useLanguage();
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    const inputCls = cn('seeme-input', compact ? 'px-3 py-3 text-xs sm:px-5 sm:py-4 sm:text-base' : 'px-5 py-4 text-base');
    const fieldGridCls = cn(
        'grid',
        compact ? 'gap-2.5 sm:gap-5' : 'gap-5',
        mobileTwoColumns ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2',
    );

    const resetForm = () => {
        setFullName('');
        setPhoneNumber('');
        setEmail('');
        setTitle('');
        setContent('');
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (submitting) return;

        if (!fullName.trim() || !phoneNumber.trim() || !email.trim() || !content.trim()) {
            messageApi.warning(t('contactForm.warningRequired', 'Vui lòng điền đầy đủ họ tên, số điện thoại, email và lời nhắn'));
            return;
        }

        if (!/^(0[35789])\d{8}$/.test(phoneNumber.trim())) {
            messageApi.warning(t('contactForm.warningPhone', 'Số điện thoại không hợp lệ'));
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            messageApi.warning(t('contactForm.warningEmail', 'Email không hợp lệ'));
            return;
        }

        setSubmitting(true);
        try {
            await sendContactAPI({
                name: fullName.trim(),
                phone: phoneNumber.trim(),
                email: email.trim(),
                subject: title.trim(),
                message: content.trim(),
            });
            messageApi.success(t('contactForm.success', 'Gửi thành công! Chúng tôi sẽ liên hệ lại sớm nhất.'));
            resetForm();
        } catch (error: any) {
            messageApi.error(
                error?.response?.data?.message ||
                t('contactForm.error', 'Không thể gửi liên hệ lúc này. Vui lòng thử lại sau.'),
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            {contextHolder}
            <form
                className={cn('flex w-full flex-col', compact ? 'gap-2.5 sm:gap-5' : 'gap-5', className)}
                onSubmit={handleSubmit}
                noValidate
            >
                <div className={fieldGridCls}>
                    <input
                        name="fullName"
                        autoComplete="name"
                        aria-label={t('contactForm.fullName', 'Họ và tên')}
                        className={inputCls}
                        placeholder={t('contactForm.fullName', 'Họ và tên *')}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                    />
                    <input
                        name="phone"
                        autoComplete="tel"
                        inputMode="tel"
                        aria-label={t('contactForm.phone', 'Số điện thoại')}
                        className={inputCls}
                        placeholder={t('contactForm.phone', 'Số điện thoại *')}
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                </div>
                <div className={fieldGridCls}>
                    <input
                        name="email"
                        autoComplete="email"
                        aria-label={t('contactForm.email', 'Email')}
                        className={inputCls}
                        placeholder={t('contactForm.email', 'Email *')}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        name="subject"
                        aria-label={t('contactForm.subject', 'Tiêu đề')}
                        className={inputCls}
                        placeholder={t('contactForm.subject', 'Tiêu đề')}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>
                <textarea
                    name="message"
                    aria-label={t('contactForm.message', 'Lời nhắn')}
                    placeholder={t('contactForm.message', 'Lời nhắn *')}
                    rows={textareaRows}
                    className={cn(inputCls, 'resize-none')}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
                <div className="flex items-center justify-center">
                    <ButtonComponent
                        type="submit"
                        loading={submitting}
                        variant={buttonVariant === 'plain' ? 'plain' : 'primary'}
                        size={buttonVariant === 'plain' ? 'md' : 'lg'}
                        className={buttonVariant === 'plain' ? 'font-bold' : 'px-16 btn-press'}
                        title={submitting ? t('common.loading', 'Đang gửi...') : (buttonText || t('contactForm.send', 'Gửi'))}
                    />
                </div>
            </form>
        </>
    );
}
