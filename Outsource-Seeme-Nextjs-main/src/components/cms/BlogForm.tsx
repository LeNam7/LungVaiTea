'use client';
import React from 'react';
import {Button, Col, Form, Input, Row, Select, Space, Switch} from 'antd';
import {ArrowLeft, Save} from 'lucide-react';
import {useRouter} from 'next/navigation';
import ImageUploadField from '@/components/cms/ImageUploadField';
import RichTextEditor from '@/components/cms/RichTextEditor';
import {BlogType, type Blog} from '@/types/swagger.types';

interface Props {
    initialValues?: Blog;
    onSave: (values: Blog) => Promise<void>;
    saving: boolean;
    title: string;
}

const BLOG_TYPE_OPTIONS = [
    {label: 'Mặc định', value: BlogType.Default},
    {label: 'Hot', value: BlogType.Hot},
    {label: 'Most viewed', value: BlogType.MostViewed},
];

const BlogForm: React.FC<Props> = ({initialValues, onSave, saving, title}) => {
    const [form] = Form.useForm();
    const router = useRouter();

    React.useEffect(() => {
        if (initialValues) {
            form.setFieldsValue(initialValues);
        }
    }, [initialValues, form]);

    const handleSubmit = async () => {
        const values = await form.validateFields();
        await onSave(values);
    };

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 24,
                    padding: '16px 24px',
                    background: '#fff',
                    borderRadius: 10,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
            >
                <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                    <Button
                        icon={<ArrowLeft size={16} />}
                        onClick={() => router.push('/cms/tin-tuc')}
                    >
                        Quay lại
                    </Button>
                    <span style={{fontWeight: 700, fontSize: 18, color: '#3B5518'}}>{title}</span>
                </div>
                <Space>
                    <Button onClick={() => router.push('/cms/tin-tuc')}>Huỷ</Button>
                    <Button
                        type="primary"
                        icon={<Save size={15} />}
                        loading={saving}
                        onClick={handleSubmit}
                        style={{background: '#3B5518'}}
                    >
                        Lưu bài viết
                    </Button>
                </Space>
            </div>

            <Form
                form={form}
                layout="vertical"
                initialValues={{type: BlogType.Default, isActive: true}}
            >
                <Row gutter={24}>
                    <Col xs={24} lg={17}>
                        <div
                            style={{
                                background: '#fff',
                                borderRadius: 10,
                                padding: 24,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                marginBottom: 20,
                            }}
                        >
                            <Form.Item
                                name="title"
                                label="Tiêu đề bài viết"
                                rules={[{required: true, message: 'Nhập tiêu đề'}]}
                            >
                                <Input
                                    size="large"
                                    placeholder="Nhập tiêu đề bài viết..."
                                    style={{fontWeight: 600, fontSize: 16}}
                                />
                            </Form.Item>
                        </div>

                        <div
                            style={{
                                background: '#fff',
                                borderRadius: 10,
                                padding: 24,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            }}
                        >
                            <Form.Item
                                name="content"
                                label={<span style={{fontWeight: 600}}>Nội dung bài viết</span>}
                                rules={[{required: true, message: 'Nhập nội dung'}]}
                            >
                                <RichTextEditor
                                    placeholder="Bắt đầu viết nội dung bài viết..."
                                    minHeight={500}
                                />
                            </Form.Item>
                        </div>
                    </Col>

                    <Col xs={24} lg={7}>
                        <div
                            style={{
                                background: '#fff',
                                borderRadius: 10,
                                padding: 20,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                marginBottom: 20,
                            }}
                        >
                            <p style={{fontWeight: 600, color: '#3B5518', marginBottom: 16, fontSize: 14}}>
                                Thông tin bài viết
                            </p>
                            <Form.Item name="author" label="Tác giả">
                                <Input placeholder="Tên tác giả..." />
                            </Form.Item>
                            <Form.Item name="shortDescription" label="Mô tả ngắn">
                                <Input.TextArea
                                    rows={4}
                                    maxLength={300}
                                    showCount
                                    placeholder="Tóm tắt ngắn hiển thị ở trang tin tức..."
                                />
                            </Form.Item>
                            <Form.Item
                                name="type"
                                label="Loại bài viết"
                            >
                                <Select
                                    options={BLOG_TYPE_OPTIONS}
                                    placeholder="Chọn loại bài viết"
                                />
                            </Form.Item>
                            <Form.Item name="tags" label="Tags (phân cách dấu phẩy)">
                                <Input placeholder="trà, nông nghiệp, cây trà cổ thụ" />
                            </Form.Item>
                            <Form.Item
                                name="isActive"
                                label="Hiển thị"
                                valuePropName="checked"
                            >
                                <Switch />
                            </Form.Item>
                        </div>

                        <div
                            style={{
                                background: '#fff',
                                borderRadius: 10,
                                padding: 20,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            }}
                        >
                            <p style={{fontWeight: 600, color: '#3B5518', marginBottom: 16, fontSize: 14}}>
                                Ảnh đại diện
                            </p>
                            <Form.Item name="coverImage" noStyle>
                                <ImageUploadField maxCount={1} />
                            </Form.Item>
                        </div>
                    </Col>
                </Row>
            </Form>
        </div>
    );
};

export default BlogForm;
