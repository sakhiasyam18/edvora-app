import { AxiosInstance } from 'axios';

declare global {
    interface Window {
        axios: AxiosInstance;
    }
    function route(name?: string, params?: any, absolute?: boolean): any;
}
