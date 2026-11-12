// APIBase.tsx;
import {DOMAINS} from '@/utils/domain';
import getInstanceAxios from './AxiosClient';

const baseDomain = DOMAINS.API;
// const baseURL = '';

export default getInstanceAxios(baseDomain);
