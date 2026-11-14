'use client';
import React, {useEffect, useState} from 'react';
import {Layout, Menu, ConfigProvider, Button, Spin} from 'antd';
import {useRouter, usePathname} from 'next/navigation';
import {itemsMenuCMS, menuGroupKeys} from '@/components/cms/MenuCMS';
import HeaderDropdown from '@/components/cms/HeaderDropdown';
import {PanelLeftClose, PanelLeftOpen} from 'lucide-react';
import {getCookie} from '@/utils/cookie';
import {getUserByIdAPI} from '@/api/UserAPI';
import {unwrapApiData} from '@/api/response';
import type {User} from '@/types/user';

const {Sider, Header, Content} = Layout;
/** Role.Admin = 1 phia backend (Seeme.Domain/Constant/Enumerations.cs). */
const ADMIN_ROLE = 1;


export default function CMSLayout({children}: {children: React.ReactNode}) {
    const [collapsed, setCollapsed] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const [authChecking, setAuthChecking] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [denied, setDenied] = useState(false);
    const [cmsUser, setCmsUser] = useState<User | null>(null);
    const [openKeys, setOpenKeys] = useState<string[]>(() => {
        const groupKey = menuGroupKeys[pathname];
        return groupKey ? [groupKey] : [];
    });

    useEffect(() => {
        let cancelled = false;

        const verifyCmsAccess = async () => {
            const accessToken = getCookie('accessToken');
            if (!accessToken) {
                window.location.replace('/tai-khoan');
                return;
            }

            let userId = Number(getCookie('userId'));
            if (!userId) {
                try {
                    const payload = JSON.parse(atob(accessToken.split('.')[1] ?? ''));
                    userId = Number(payload.sub ?? payload.userId ?? payload.nameid);
                } catch {
                    userId = 0;
                }
            }

            if (!userId) {
                window.location.replace('/tai-khoan');
                return;
            }

            try {
                const response = await getUserByIdAPI(userId);
                const user = unwrapApiData<User>(response);

                if (!user?.id) {
                    throw new Error('Không thể xác minh tài khoản CMS');
                }

                // Quyen vao CMS dua tren Role trong DB, khong con so sanh so dien thoai.

                // Role.Admin = 1 (xem Enumerations.Role phia backend).
                if (user.role !== ADMIN_ROLE) {
                    if (!cancelled) {
                        setDenied(true);
                        setAuthChecking(false);
                    }
                    return;
                }

                if (!cancelled) {
                    setCmsUser(user);
                    setAuthorized(true);
                    setAuthChecking(false);
                }
            } catch {
                if (!cancelled) window.location.replace('/tai-khoan');
            }
        };

        void verifyCmsAccess();
        return () => {
            cancelled = true;
        };
    }, [router]);

    if (authChecking) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
                <Spin size="large" description="Đang xác minh quyền truy cập" />
            </div>
        );
    }

    if (denied) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f5f5f5] px-6 text-center">
                <div className="text-lg font-semibold text-[#3B5518]">Tài khoản này không có quyền truy cập trang quản trị</div>
                <p className="text-sm text-[#3B5518]/70">
                    Chỉ tài khoản quản trị mới vào được khu vực này. Vui lòng đăng nhập bằng tài khoản quản trị.
                </p>
                <Button type="primary" onClick={() => router.push('/')} style={{background: '#3B5518'}}>
                    Về trang chủ
                </Button>
            </div>
        );
    }

    // `authorized` is intentionally based on a valid authenticated user for now.
    // Role restrictions can be reintroduced when the permission model is ready.
    if (!authorized) return null;

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#3B5518',
                    borderRadius: 6,
                },
            }}
        >
            <Layout style={{height: '100vh', overflow: 'hidden'}}>
                <Sider
                    collapsed={collapsed}
                    trigger={null}
                    width={230}
                    collapsedWidth={64}
                    style={{
                        background: '#23340D',
                        overflow: 'auto',
                        height: '100vh',
                        flexShrink: 0,
                    }}
                >
                    <div
                        style={{
                            height: 56,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            padding: collapsed ? '0' : '0 20px',
                            borderBottom: '1px solid rgba(255,255,255,0.08)',
                            overflow: 'hidden',
                        }}
                    >
                        {collapsed ? (
                            <span style={{fontSize: 22}}>🍃</span>
                        ) : (
                            <span
                                style={{
                                    color: '#A7B36E',
                                    fontWeight: 700,
                                    fontSize: 16,
                                    letterSpacing: 1,
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                LÙNG VÀI TRÀ Quản trị
                            </span>
                        )}
                    </div>
                    <Menu
                        mode="inline"
                        theme="dark"
                        selectedKeys={[pathname]}
                        openKeys={collapsed ? [] : openKeys}
                        onOpenChange={(keys) => setOpenKeys(keys as string[])}
                        items={itemsMenuCMS}
                        onClick={({key}) => {
                            if (!key.startsWith('group-')) router.push(key as string);
                        }}
                        style={{background: 'transparent', borderRight: 0, marginTop: 8}}
                    />
                </Sider>

                <Layout style={{overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
                    <Header
                        style={{
                            background: '#fff',
                            padding: '0 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
                            height: 56,
                            flexShrink: 0,
                            zIndex: 10,
                        }}
                    >
                        <Button
                            type="text"
                            icon={collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                            onClick={() => setCollapsed(!collapsed)}
                        />
                        <HeaderDropdown user={cmsUser} />
                    </Header>

                    <Content
                        style={{
                            margin: 24,
                            padding: 0,
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            flex: 1,
                        }}
                    >
                        {children}
                    </Content>
                </Layout>
            </Layout>
        </ConfigProvider>
    );
}
