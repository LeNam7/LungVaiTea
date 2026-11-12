import APIBase from './config/APIBase';

/**
 * POST /api/upload/image - Upload ảnh, nhận về image URL.
 * Gửi dạng multipart/form-data.
 */
export const uploadImageAPI = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    // Do NOT set Content-Type manually - Axios sets multipart/form-data + boundary automatically
    return APIBase.post('/api/upload/image', formData);
};

/** POST /api/upload/youtube - Upload và validate YouTube link */
export const uploadYoutubeLinkAPI = (youtubeUrl: string) =>
    APIBase.post('/api/upload/youtube', JSON.stringify(youtubeUrl));
