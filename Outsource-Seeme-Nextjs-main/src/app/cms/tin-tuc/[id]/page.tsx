'use client';
import React, {useEffect, useState} from 'react';
import {message, Spin} from 'antd';
import {useRouter, useParams} from 'next/navigation';
import BlogForm from '@/components/cms/BlogForm';
import {getBlogByIdAPI, updateBlogAPI} from '@/api/BlogAPI';
import {unwrapApiData} from '@/api/response';
import type {Blog} from '@/types/swagger.types';

export default function ChinhSuaBlogPage() {
    const router = useRouter();
    const params = useParams();
    const id = Number(params.id);

    const [initialValues, setInitialValues] = useState<Blog | undefined>(undefined);
    const [loadingData, setLoadingData] = useState(true);
    const [saving, setSaving] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
        const load = async () => {
            try {
                const res = await getBlogByIdAPI(id);
                setInitialValues(unwrapApiData<Blog>(res));
            } catch {
                messageApi.error('Không thể tải bài viết');
                router.push('/cms/tin-tuc');
            } finally {
                setLoadingData(false);
            }
        };
        if (id) load();
    }, [id, messageApi, router]);

    const handleSave = async (values: Blog) => {
        setSaving(true);
        try {
            await updateBlogAPI(id, values);
            messageApi.success('Cập nhật bài viết thành công!');
            router.push('/cms/tin-tuc');
        } catch {
            messageApi.error('Cập nhật thất bại, vui lòng thử lại');
        } finally {
            setSaving(false);
        }
    };

    if (loadingData) {
        return (
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400}}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <>
            {contextHolder}
            <BlogForm
                title="Chỉnh sửa bài viết"
                saving={saving}
                onSave={handleSave}
                initialValues={initialValues}
            />
        </>
    );
}
