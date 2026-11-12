'use client';

import {useEffect} from 'react';
import {Provider} from 'react-redux';
import {store} from '@/store';
import {getCookie} from '@/utils/cookie';
import {fetchUserThunk} from '@/store/auth.store';

function UserRestorer() {
    useEffect(() => {
        const userId = getCookie('userId');
        const accessToken = getCookie('accessToken');
        if (userId && accessToken) {
            const state = store.getState().auth;
            // Only fetch if we don't already have full user data
            if (!state.user?.phoneNumber) {
                store.dispatch(fetchUserThunk(Number(userId)));
            }
        }
    }, []);
    return null;
}

export default function StoreProvider({children}: {children: React.ReactNode}) {
    return (
        <Provider store={store}>
            <UserRestorer />
            {children}
        </Provider>
    );
}
