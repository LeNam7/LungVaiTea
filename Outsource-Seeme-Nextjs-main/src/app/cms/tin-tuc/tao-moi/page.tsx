'use client';
import React, {useState} from 'react';
import {message} from 'antd';
import {useRouter} from 'next/navigation';
import BlogForm from '@/components/cms/BlogForm';
import {createBlogAPI} from '@/api/BlogAPI';
import type {Blog} from '@/types/swagger.types';

export default function TaoMoiBlogPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    const handleSave = async (values: Blog) => {
        setSaving(true);
        try {
            await createBlogAPI(values);
            messageApi.success('Đăng bài viết thành công!');
            router.push('/cms/tin-tuc');
        } catch {
            messageApi.error('Đăng bài thất bại, vui lòng thử lại');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            {contextHolder}
            <BlogForm
                title="Viết bài mới"
                saving={saving}
                onSave={handleSave}
            />
        </>
    );
}
