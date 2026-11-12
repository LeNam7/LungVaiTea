'use client';

import React from 'react';
import {getTeaGroupsPagingAPI} from '@/api/TeaGroupAPI';
import {unwrapPagingData} from '@/api/response';
import type {TeaGroupRecord} from '@/types/swagger.types';
import {TEA_GROUPS, mapTeaGroupRecords, type TeaGroup} from '@/lib/tea-taxonomy';

/**
 * Nhóm trà động: đọc từ API nhóm trà (BE 30/10/2026), lỗi hoặc BE chưa
 * deploy thì rơi về 5 nhóm ghi cứng cũ để menu/sidebar không gãy.
 * Cache theo phiên SPA: gọi 1 lần rồi dùng chung cho mọi component.
 */
let cachedGroups: TeaGroup[] | null = null;
let inflight: Promise<TeaGroup[]> | null = null;

/** Lấy nhóm trà (dùng chung cache) - dùng khi cần fetch chủ động (vd mở menu mobile). */
export async function fetchTeaGroups(): Promise<TeaGroup[]> {
    if (cachedGroups) return cachedGroups;
    if (!inflight) {
        inflight = (async () => {
            try {
                const res = await getTeaGroupsPagingAPI({pageIndex: 1, pageSize: 100} as any);
                const records = unwrapPagingData<TeaGroupRecord>(res).data.filter((g) => g.isActive !== false);
                const mapped = mapTeaGroupRecords(records);
                cachedGroups = mapped.length > 0 ? mapped : TEA_GROUPS;
                return cachedGroups;
            } catch {
                cachedGroups = TEA_GROUPS;
                return cachedGroups;
            } finally {
                inflight = null;
            }
        })();
    }
    return inflight;
}

export function useTeaGroups(): {groups: TeaGroup[]; loaded: boolean} {
    const [groups, setGroups] = React.useState<TeaGroup[]>(() => cachedGroups ?? TEA_GROUPS);
    const [loaded, setLoaded] = React.useState(() => cachedGroups !== null);
    React.useEffect(() => {
        let cancelled = false;
        void fetchTeaGroups().then((result) => {
            if (cancelled) return;
            setGroups(result);
            setLoaded(true);
        });
        return () => {
            cancelled = true;
        };
    }, []);
    return {groups, loaded};
}
