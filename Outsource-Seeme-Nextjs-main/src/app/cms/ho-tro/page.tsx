'use client';
import React from 'react';
import {Card, Typography} from 'antd';
import {Headphones} from 'lucide-react';

const {Title, Text} = Typography;

export default function HoTroPage() {
    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <Headphones size={20} color="#3B5518" />
                <Title level={4} style={{margin: 0, color: '#3B5518'}}>
                    Hỗ trợ
                </Title>
            </div>

            <Card
                style={{borderRadius: 10, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', minHeight: 400}}
                styles={{body: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 360,
                    gap: 12,
                }}}
            >
                <Headphones size={48} color="#7F9635" strokeWidth={1.5} />
                <Title level={4} style={{margin: 0, color: '#3B5518'}}>
                    Trung tâm hỗ trợ
                </Title>
                <Text type="secondary" style={{textAlign: 'center', maxWidth: 360}}>
                    Quản lý ticket hỗ trợ khách hàng, câu hỏi thường gặp (FAQ) và tài liệu hướng dẫn. Tính năng đang
                    được phát triển.
                </Text>
            </Card>
        </div>
    );
}
