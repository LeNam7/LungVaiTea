import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';

// Dùng thay cho useDispatch và useSelector để có đầy đủ type
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
