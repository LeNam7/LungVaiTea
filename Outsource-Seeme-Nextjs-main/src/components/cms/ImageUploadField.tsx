'use client';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {message, Spin, Upload} from 'antd';
import type {UploadFile, UploadProps} from 'antd';
import {Plus} from 'lucide-react';
import {uploadImageAPI} from '@/api/UploadAPI';
import {unwrapApiData} from '@/api/response';
import {resolveApiImageUrl} from '@/utils/imageUrl';

interface Props {
    /** Comma-separated image paths string (existing value) */
    value?: string | null;
    onChange?: (value: string) => void;
    /** Max number of images allowed (default: 5) */
    maxCount?: number;
    onUploadingChange?: (uploading: boolean) => void;
}

/**
 * Reusable multi-image upload field for CMS forms.
 * - Calls POST /api/upload/image for each file
 * - Stores result as comma-separated paths in `value`
 * - Displays existing API images from storage domain + path
 */
export default function ImageUploadField({value, onChange, maxCount = 5, onUploadingChange}: Props) {
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [messageApi, contextHolder] = message.useMessage();

    const uploadingCount = useMemo(
        () => fileList.filter((file) => file.status === 'uploading').length,
        [fileList],
    );

    useEffect(() => {
        onUploadingChange?.(uploadingCount > 0);
    }, [onUploadingChange, uploadingCount]);

    const emitChange = useCallback(
        (nextFileList: UploadFile[]) => {
            onChange?.(
                nextFileList
                    .filter((file) => file.status === 'done')
                    .map((file) => String(file.response ?? ''))
                    .filter(Boolean)
                    .join(','),
            );
        },
        [onChange],
    );

    // Sync incoming value → fileList (for edit mode)
    useEffect(() => {
        if (uploadingCount > 0) return;

        if (!value) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFileList([]);
            return;
        }
        const paths = value.split(',').filter(Boolean);
        setFileList(
            paths.map((p, i) => ({
                uid: `existing-${i}`,
                name: p.split('/').pop() ?? `image-${i}`,
                status: 'done',
                url: resolveApiImageUrl(p),
                response: p,
            })),
        );
    }, [uploadingCount, value]);

    // Chuỗi upload nối tiếp: mỗi file chờ file trước xong mới tải lên, thay vì
    // dội nhiều file lớn cùng lúc. Máy chủ phía sau Cloudflare từng trả 520 chập
    // chờn khi nhận nhiều ảnh lớn song song (đo được 1/6 file 11MB lỗi 520, tải
    // lần lượt thì 6/6 đều 200) - xếp hàng + tự thử lại là cách hết lỗi này.
    const uploadChainRef = useRef<Promise<void>>(Promise.resolve());

    const runUpload = async (
        uploadFile: File & {uid?: string},
        uid: string,
        onSuccess?: (body: unknown) => void,
        onError?: (err: Error) => void,
    ) => {
        let lastErr: unknown = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const res = (await uploadImageAPI(uploadFile)) as any;
                const path = unwrapApiData<string>(res);
                onSuccess?.(path);

                const newUrl = resolveApiImageUrl(path as string);

                setFileList((prev) => {
                    const updated = prev.map((item) =>
                        item.uid === uid
                            ? {
                                  ...item,
                                  name: (path as string).split('/').pop() ?? uploadFile.name,
                                  status: 'done' as const,
                                  percent: 100,
                                  url: newUrl,
                                  response: path,
                              }
                            : item,
                    );
                    emitChange(updated);
                    return updated;
                });
                return;
            } catch (err) {
                lastErr = err;
                if (attempt < 3) await new Promise((r) => setTimeout(r, 800 * attempt));
            }
        }
        onError?.(lastErr as Error);
        // Ảnh lỗi không giữ lại trong danh sách: ô lỗi vừa chiếm suất maxCount
        // (làm nút '+' biến mất) vừa không lưu được vào form - gỡ ra để bấm lại ngay.
        setFileList((prev) => prev.filter((item) => item.uid !== uid));
        const status = (lastErr as {response?: {status?: number}})?.response?.status;
        messageApi.error(
            `Upload ảnh ${uploadFile.name} thất bại${status ? ` (mã ${status})` : ''}, vui lòng thử lại`,
        );
    };

    const handleCustomRequest: UploadProps['customRequest'] = (options) => {
        const {file, onSuccess, onError} = options;
        const uploadFile = file as File & {uid?: string};
        const uid = uploadFile.uid ?? `upload-${Date.now()}-${uploadFile.name}`;

        setFileList((prev) => [
            ...prev,
            {
                uid,
                name: uploadFile.name,
                status: 'uploading',
                percent: 0,
            } as UploadFile,
        ]);

        // catch cuối giữ chuỗi luôn ở trạng thái xong để file sau không bị kẹt
        // nếu có lỗi ngoài dự kiến trong một lượt tải.
        uploadChainRef.current = uploadChainRef.current
            .then(() => runUpload(uploadFile, uid, onSuccess, onError))
            .catch(() => {});
    };

    const handleRemove = (file: UploadFile) => {
        setFileList((prev) => {
            const updated = prev.filter((f) => f.uid !== file.uid);
            emitChange(updated);
            return updated;
        });
    };

    return (
        <>
            {contextHolder}
            <Upload
                listType="picture-card"
                fileList={fileList}
                customRequest={handleCustomRequest}
                onRemove={handleRemove}
                accept="image/*"
                multiple
                maxCount={maxCount}
                showUploadList={{showPreviewIcon: true, showRemoveIcon: true}}
            >
                {fileList.length < maxCount && (
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4}}>
                        {uploadingCount > 0 ? <Spin size="small" /> : <Plus size={18} />}
                        <span style={{fontSize: 12}}>
                            {uploadingCount > 0 ? `Đang tải ${uploadingCount} ảnh...` : 'Tải nhiều ảnh'}
                        </span>
                    </div>
                )}
            </Upload>
        </>
    );
}
