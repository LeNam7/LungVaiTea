'use client';
import React from 'react';
import {useEditor, EditorContent, type Editor} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {Divider, Input, Modal, Tooltip, message} from 'antd';
import {uploadImageAPI} from '@/api/UploadAPI';
import {unwrapApiData} from '@/api/response';
import {resolveApiImageUrl} from '@/utils/imageUrl';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    List,
    ListOrdered,
    Quote,
    Code,
    Minus,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Undo2,
    Redo2,
    Heading1,
    Heading2,
    Heading3,
    Link2,
    Link2Off,
    Image as ImageIcon,
} from 'lucide-react';

interface Props {
    value?: string;
    onChange?: (html: string) => void;
    placeholder?: string;
    minHeight?: number;
}

const ToolbarButton = ({
    active,
    disabled,
    onClick,
    title,
    children,
}: {
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
    title: string;
    children: React.ReactNode;
}) => (
    <Tooltip title={title} mouseEnterDelay={0.5}>
        <button
            type="button"
            aria-label={title}
            aria-pressed={active}
            disabled={disabled}
            onMouseDown={(event) => {
                event.preventDefault();
                if (!disabled) onClick();
            }}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 30,
                height: 28,
                borderRadius: 4,
                border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                background: active ? '#3B551822' : 'transparent',
                color: active ? '#3B5518' : '#444',
                opacity: disabled ? 0.4 : 1,
                transition: 'background 0.15s',
            }}
        >
            {children}
        </button>
    </Tooltip>
);

const RichTextEditor: React.FC<Props> = ({
    value,
    onChange,
    placeholder = 'Nhập nội dung bài viết...',
    minHeight = 400,
}) => {
    const [linkModalOpen, setLinkModalOpen] = React.useState(false);
    const [linkUrl, setLinkUrl] = React.useState('');
    const [messageApi, contextHolder] = message.useMessage();
    const [uploading, setUploading] = React.useState(false);
    const editorRef = React.useRef<Editor | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    // Hàng đợi tải ảnh: tải nối tiếp từng file để không dội nhiều ảnh lớn
    // cùng lúc (máy chủ sau Cloudflare từng trả 520 chập chờn khi dội song song).
    const uploadQueueRef = React.useRef<Promise<void>>(Promise.resolve());

    const readFileAsDataUrl = (file: File) =>
        new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error('Không đọc được file ảnh'));
            reader.readAsDataURL(file);
        });

    // Tải 1 ảnh lên máy chủ (tự thử lại tối đa 3 lần), trả về URL đầy đủ để
    // chèn vào bài. Bài viết hiển thị bằng dangerouslySetInnerHTML nên phải
    // là URL đầy đủ (đường dẫn tương đối /uploads/... sẽ trỏ nhầm sang web).
    const uploadImageFile = async (file: File): Promise<string> => {
        let lastErr: unknown = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const res = await uploadImageAPI(file);
                const path = unwrapApiData<string>(res);
                if (!path) throw new Error('Upload không trả về đường dẫn ảnh');
                return resolveApiImageUrl(String(path));
            } catch (err) {
                lastErr = err;
                if (attempt < 3) await new Promise((r) => setTimeout(r, 800 * attempt));
            }
        }
        throw lastErr instanceof Error ? lastErr : new Error('Upload ảnh thất bại');
    };

    // Chèn 1 ảnh vào vị trí con trỏ. Tải lên lỗi thì chèn tạm dạng base64 để
    // không mất ảnh (đúng kiểu ảnh chụp màn hình vốn đã chèn trước đây).
    const insertImageFile = async (file: File) => {
        const target = editorRef.current;
        if (!target) return;
        try {
            const url = await uploadImageFile(file);
            target.chain().focus().setImage({src: url}).run();
        } catch {
            try {
                const dataUrl = await readFileAsDataUrl(file);
                target.chain().focus().setImage({src: dataUrl}).run();
                messageApi.warning(
                    `Không tải được ảnh ${file.name} lên máy chủ, đã chèn tạm ảnh vào bài (ảnh chưa lưu lên máy chủ).`,
                );
            } catch {
                messageApi.error(`Không chèn được ảnh ${file.name}, vui lòng thử lại.`);
            }
        }
    };

    // Nhận danh sách file ảnh (từ nút tải lên, dán hoặc kéo-thả), tải nối tiếp
    // rồi chèn lần lượt vào bài. Trả false khi không có file ảnh nào để
    // trình soạn thảo xử lý mặc định như cũ.
    const queueImageFiles = (files: File[] | FileList | null | undefined): boolean => {
        const images = Array.from(files ?? []).filter((f) => f.type.startsWith('image/'));
        if (images.length === 0) return false;
        uploadQueueRef.current = uploadQueueRef.current
            .then(async () => {
                setUploading(true);
                const hide = messageApi.loading(`Đang tải ${images.length} ảnh lên...`, 0);
                try {
                    for (const file of images) {
                        await insertImageFile(file);
                    }
                } finally {
                    hide();
                    setUploading(false);
                }
            })
            .catch(() => {
                setUploading(false);
            });
        return true;
    };

    // Chỉ chặn khi dán đúng ảnh (file ảnh hoặc ảnh chụp màn hình, không kèm
    // chữ): file ảnh copy từ máy chỉ là tham chiếu file trong clipboard nên
    // dán mặc định không chèn được gì; ảnh chụp màn hình là dữ liệu ảnh nên
    // dán mặc định chèn được dạng base64 - chặn lại để tải lên máy chủ gọn hơn.
    const handlePastedFiles = (event: ClipboardEvent): boolean => {
        const data = event.clipboardData;
        if (!data) return false;
        if (data.getData('text/html') || data.getData('text/plain')) return false;
        return queueImageFiles(data.files);
    };

    const handleDroppedFiles = (event: DragEvent, moved: boolean): boolean => {
        if (moved) return false;
        return queueImageFiles(event.dataTransfer?.files);
    };

    const editor = useEditor({
        immediatelyRender: false,
        onCreate: ({editor: created}) => {
            editorRef.current = created;
        },
        extensions: [
            StarterKit.configure({
                bulletList: {keepMarks: true, keepAttributes: false},
                orderedList: {keepMarks: true, keepAttributes: false},
                link: {openOnClick: false, HTMLAttributes: {class: 'tiptap-link'}},
            }),
            TextAlign.configure({types: ['heading', 'paragraph']}),
            Image.configure({inline: false, allowBase64: true}),
            Placeholder.configure({placeholder}),
        ],
        content: value ?? '',
        onUpdate: ({editor}) => {
            onChange?.(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'tiptap-editor-content',
            },
            handlePaste: (_view, event) => handlePastedFiles(event),
            handleDrop: (_view, event, _slice, moved) => handleDroppedFiles(event, moved),
        },
    });

    // Sync external value changes (e.g. when form loads data)
    React.useEffect(() => {
        if (editor && value !== undefined && editor.getHTML() !== value) {
            editor.commands.setContent(value ?? '');
        }
        // Only run when value changes externally (not on every keystroke)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    if (!editor) return null;

    const openLinkModal = () => {
        const prev = editor.getAttributes('link').href ?? '';
        setLinkUrl(prev);
        setLinkModalOpen(true);
    };

    const applyLink = () => {
        if (linkUrl.trim()) {
            editor.chain().focus().setLink({href: linkUrl.trim()}).run();
        } else {
            editor.chain().focus().unsetLink().run();
        }
        setLinkModalOpen(false);
        setLinkUrl('');
    };

    return (
        <>
            {contextHolder}
            <div
                style={{
                    border: '1px solid #d9d9d9',
                    borderRadius: 8,
                    overflow: 'hidden',
                    background: '#fff',
                }}
            >
                {/* Toolbar */}
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: 2,
                        padding: '6px 10px',
                        borderBottom: '1px solid #f0f0f0',
                        background: '#fafafa',
                    }}
                >
                    {/* Undo / Redo */}
                    <ToolbarButton
                        title="Hoàn tác (Ctrl+Z)"
                        onClick={() => editor.chain().focus().undo().run()}
                    >
                        <Undo2 size={14} />
                    </ToolbarButton>
                    <ToolbarButton
                        title="Làm lại (Ctrl+Y)"
                        onClick={() => editor.chain().focus().redo().run()}
                    >
                        <Redo2 size={14} />
                    </ToolbarButton>

                    <Divider
                        orientation="vertical"
                        style={{height: 20, margin: '0 4px'}}
                    />

                    {/* Headings */}
                    <ToolbarButton
                        title="Tiêu đề 1"
                        active={editor.isActive('heading', {level: 1})}
                        onClick={() => editor.chain().focus().toggleHeading({level: 1}).run()}
                    >
                        <Heading1 size={14} />
                    </ToolbarButton>
                    <ToolbarButton
                        title="Tiêu đề 2"
                        active={editor.isActive('heading', {level: 2})}
                        onClick={() => editor.chain().focus().toggleHeading({level: 2}).run()}
                    >
                        <Heading2 size={14} />
                    </ToolbarButton>
                    <ToolbarButton
                        title="Tiêu đề 3"
                        active={editor.isActive('heading', {level: 3})}
                        onClick={() => editor.chain().focus().toggleHeading({level: 3}).run()}
                    >
                        <Heading3 size={14} />
                    </ToolbarButton>

                    <Divider
                        orientation="vertical"
                        style={{height: 20, margin: '0 4px'}}
                    />

                    {/* Text styles */}
                    <ToolbarButton
                        title="In đậm (Ctrl+B)"
                        active={editor.isActive('bold')}
                        onClick={() => editor.chain().focus().toggleBold().run()}
                    >
                        <Bold size={14} />
                    </ToolbarButton>
                    <ToolbarButton
                        title="In nghiêng (Ctrl+I)"
                        active={editor.isActive('italic')}
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                    >
                        <Italic size={14} />
                    </ToolbarButton>
                    <ToolbarButton
                        title="Gạch chân (Ctrl+U)"
                        active={editor.isActive('underline')}
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                    >
                        <UnderlineIcon size={14} />
                    </ToolbarButton>
                    <ToolbarButton
                        title="Gạch ngang"
                        active={editor.isActive('strike')}
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                    >
                        <Strikethrough size={14} />
                    </ToolbarButton>
                    <ToolbarButton
                        title="Code inline"
                        active={editor.isActive('code')}
                        onClick={() => editor.chain().focus().toggleCode().run()}
                    >
                        <Code size={14} />
                    </ToolbarButton>

                    <Divider
                        orientation="vertical"
                        style={{height: 20, margin: '0 4px'}}
                    />

                    {/* Lists */}
                    <ToolbarButton
                        title="Danh sách chấm"
                        active={editor.isActive('bulletList')}
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                    >
                        <List size={14} />
                    </ToolbarButton>
                    <ToolbarButton
                        title="Danh sách số"
                        active={editor.isActive('orderedList')}
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    >
                        <ListOrdered size={14} />
                    </ToolbarButton>
                    <ToolbarButton
                        title="Trích dẫn"
                        active={editor.isActive('blockquote')}
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    >
                        <Quote size={14} />
                    </ToolbarButton>

                    <Divider
                        orientation="vertical"
                        style={{height: 20, margin: '0 4px'}}
                    />

                    {/* Align */}
                    <ToolbarButton
                        title="Căn trái"
                        active={editor.isActive({textAlign: 'left'})}
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    >
                        <AlignLeft size={14} />
                    </ToolbarButton>
                    <ToolbarButton
                        title="Căn giữa"
                        active={editor.isActive({textAlign: 'center'})}
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    >
                        <AlignCenter size={14} />
                    </ToolbarButton>
                    <ToolbarButton
                        title="Căn phải"
                        active={editor.isActive({textAlign: 'right'})}
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    >
                        <AlignRight size={14} />
                    </ToolbarButton>
                    <ToolbarButton
                        title="Căn đều"
                        active={editor.isActive({textAlign: 'justify'})}
                        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                    >
                        <AlignJustify size={14} />
                    </ToolbarButton>

                    <Divider
                        orientation="vertical"
                        style={{height: 20, margin: '0 4px'}}
                    />

                    {/* Link */}
                    <ToolbarButton
                        title="Chèn link"
                        active={editor.isActive('link')}
                        onClick={openLinkModal}
                    >
                        <Link2 size={14} />
                    </ToolbarButton>
                    <ToolbarButton
                        title="Xoá link"
                        onClick={() => editor.chain().focus().unsetLink().run()}
                    >
                        <Link2Off size={14} />
                    </ToolbarButton>

                    <Divider
                        orientation="vertical"
                        style={{height: 20, margin: '0 4px'}}
                    />

                    {/* Image */}
                    <ToolbarButton
                        title="Chèn ảnh (tải lên máy chủ)"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <ImageIcon size={14} />
                    </ToolbarButton>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        style={{display: 'none'}}
                        onChange={(event) => {
                            queueImageFiles(event.target.files);
                            // Reset để chọn lại đúng file đó lần sau vẫn kích hoạt onChange
                            event.target.value = '';
                        }}
                    />

                    {/* Horizontal rule */}
                    <ToolbarButton
                        title="Đường kẻ ngang"
                        onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    >
                        <Minus size={14} />
                    </ToolbarButton>
                </div>

                {/* Editor area */}
                <EditorContent
                    editor={editor}
                    style={{minHeight, padding: '12px 16px', cursor: 'text'}}
                />
            </div>

            {/* Link modal */}
            <Modal
                title="Chèn liên kết"
                open={linkModalOpen}
                onOk={applyLink}
                onCancel={() => setLinkModalOpen(false)}
                okText="Áp dụng"
                cancelText="Huỷ"
                width={440}
            >
                <Input
                    placeholder="https://example.com"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onPressEnter={applyLink}
                />
            </Modal>

            {/* Scoped styles */}
            <style>{`
                .tiptap-editor-content:focus {
                    outline: none;
                }
                .tiptap-editor-content h1 { font-size: 2em; font-weight: 700; margin: 0.5em 0; }
                .tiptap-editor-content h2 { font-size: 1.5em; font-weight: 700; margin: 0.5em 0; }
                .tiptap-editor-content h3 { font-size: 1.2em; font-weight: 700; margin: 0.4em 0; }
                .tiptap-editor-content p { margin: 0.4em 0; line-height: 1.8; }
                .tiptap-editor-content ul { padding-left: 1.5em; list-style: disc; }
                .tiptap-editor-content ol { padding-left: 1.5em; list-style: decimal; }
                .tiptap-editor-content li { margin: 0.2em 0; }
                .tiptap-editor-content blockquote {
                    border-left: 3px solid #d9d9d9;
                    padding-left: 12px;
                    color: #888;
                    margin: 0.5em 0;
                    font-style: italic;
                }
                .tiptap-editor-content code {
                    background: #f5f5f5;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 0.9em;
                    font-family: monospace;
                }
                .tiptap-editor-content hr { border: none; border-top: 2px solid #e8e8e8; margin: 1em 0; }
                .tiptap-editor-content img {
                    display: block;
                    max-width: 100%;
                    height: auto;
                    margin: 1em auto;
                    border-radius: 8px;
                }
                .tiptap-link { color: #1677ff; text-decoration: underline; }
                .tiptap-editor-content p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #bfbfbf;
                    pointer-events: none;
                    height: 0;
                }
            `}</style>
        </>
    );
};

export default RichTextEditor;
