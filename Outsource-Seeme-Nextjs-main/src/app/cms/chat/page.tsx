'use client';
import React from 'react';
import {Card, Typography} from 'antd';
import {MessageCircle} from 'lucide-react';

const {Title, Text} = Typography;

export default function ChatPage() {
    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <MessageCircle size={20} color="#3B5518" />
                <Title level={4} style={{margin: 0, color: '#3B5518'}}>
                    Chat
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
                <MessageCircle size={48} color="#7F9635" strokeWidth={1.5} />
                <Title level={4} style={{margin: 0, color: '#3B5518'}}>
                    Tính năng Chat
                </Title>
                <Text type="secondary" style={{textAlign: 'center', maxWidth: 360}}>
                    Tính năng chat trực tiếp với khách hàng đang được phát triển. Sẽ tích hợp WebSocket để nhận và gửi
                    tin nhắn theo thời gian thực.
                </Text>
            </Card>
        </div>
    );
}
