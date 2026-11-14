'use client';
import React, { useState } from 'react';
import type { MenuProps } from 'antd';
import { Button, Dropdown, Form, Input, message, Modal } from 'antd';
import { CircleUser } from 'lucide-react';
import {changePasswordAPI} from '@/api/AuthAPI';
import {unwrapApiData} from '@/api/response';
import {useAppDispatch} from '@/store/hooks';
import {logout} from '@/store/auth.store';
import type {User} from '@/types/user';
import {Role} from '@/types/swagger.types';

type ChangePasswordForm = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type ChangePasswordResponse = {
  isSuccess?: boolean;
  oldPasswordError?: string | null;
  newPasswordError?: string | null;
  message?: string | null;
};

const ROLE_LABELS: Record<number, string> = {
  [Role.Admin]: 'Quản trị viên',
  [Role.Manager]: 'Nhân viên',
};

const HeaderDropdown = ({user}: {user: User | null}) => {
  const dispatch = useAppDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.userName || 'Tài khoản quản trị';
  const roleLabel = user?.role ? (ROLE_LABELS[user.role] ?? `Vai trò ${user.role}`) : 'Đang xác minh';

  const handleChangePassword = async (values: ChangePasswordForm) => {
    if (!user?.id || loading) return;
    setLoading(true);
    try {
      const response = await changePasswordAPI({
        userId: user.id,
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      const payload = unwrapApiData<ChangePasswordResponse>(response);
      if (payload?.isSuccess === false) {
        const errorMessage =
          payload.oldPasswordError?.trim() ||
          payload.newPasswordError?.trim() ||
          payload.message?.trim() ||
          'Đổi mật khẩu thất bại';
        messageApi.error(errorMessage);
        return;
      }

      messageApi.success('Đổi mật khẩu thành công');
      setIsModalOpen(false);
      form.resetFields();
    } catch (error: any) {
      const responseData = error?.response?.data;
      const payload = responseData ? unwrapApiData<ChangePasswordResponse>(responseData) : null;
      const errorMessage =
        payload?.oldPasswordError?.trim() ||
        payload?.newPasswordError?.trim() ||
        payload?.message?.trim() ||
        responseData?.message ||
        'Đổi mật khẩu thất bại. Vui lòng thử lại.';
      messageApi.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    window.location.replace('/tai-khoan');
  };

  const items: MenuProps['items'] = [
    {
      label: (
        <div className="flex flex-col gap-2 min-w-[200px]">
          <p className="text-center font-medium text-xl truncate">{displayName}</p>
          <span className="text-sm">
            <span className="font-medium">Quyền:</span> {roleLabel}
          </span>
          {user?.email && <span className="text-sm break-all">{user.email}</span>}
        </div>
      ),
      key: '0',
    },
    {
      type: 'divider',
    },
    {
      label: (
        <p
          onClick={() => {
            setIsModalOpen(true);
          }}
          className="text-sm md:text-base"
        >
          Đổi mật khẩu
        </p>
      ),
      key: '1',
    },
    {
      type: 'divider',
    },
    {
      label: (
        <p onClick={handleLogout} className="text-sm md:text-base">
          Đăng xuất
        </p>
      ),
      key: '3',
    },
  ];

  return (
    <>
      {contextHolder}
      <Modal
        title="Đổi mật khẩu"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        centered
      >
        <Form layout={'vertical'} form={form} onFinish={handleChangePassword} disabled={loading}>
          <Form.Item
            name="oldPassword"
            label="Mật khẩu cũ"
            className="w-full"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu cũ!' }]}
          >
            <Input.Password autoComplete="current-password" placeholder="Nhập mật khẩu cũ" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            className="w-full"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
              {
                min: 6,
                message: 'Mật khẩu phải có ít nhất 6 ký tự!',
              },
            ]}
          >
            <Input.Password autoComplete="new-password" placeholder="Nhập mật khẩu mới" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu mới"
            className="w-full"
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
              {
                min: 6,
                message: 'Mật khẩu phải có ít nhất 6 ký tự!',
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" placeholder="Nhập lại mật khẩu mới" />
          </Form.Item>
          <div className="flex justify-center gap-3 md:gap-5 flex-col sm:flex-row">
            <Button
              type="default"
              onClick={() => {
                setIsModalOpen(false);
                form.resetFields();
              }}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Hủy
            </Button>
            <Form.Item className="mb-0">
              <Button type="primary" htmlType="submit" loading={loading} className="w-full sm:w-auto">
                Đổi mật khẩu
              </Button>
            </Form.Item>
          </div>
        </Form>
      </Modal>
      <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
        <button type="button" className="flex items-center justify-center gap-2 rounded-md p-2 text-[#3B5518] transition-colors hover:bg-[#3B5518]/10 md:mr-4 md:gap-3">
          <div className="w-6 md:w-8">
            <CircleUser />
          </div>
          <p className="hidden sm:block text-sm md:text-base truncate max-w-[100px] md:max-w-none">
            {displayName}
          </p>
        </button>
      </Dropdown>
    </>
  );
};

export default HeaderDropdown;
