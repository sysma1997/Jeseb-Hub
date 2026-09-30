import { ApiMethods, ApiUrl, BackendUrl } from "./ApiUrl";
import { Session } from "./Session";
import { SessionRefresher } from "./SessionRefresher";

export { ApiMethods };
export interface ApiResponse {
    status: number;
    data: string;
}
export abstract class Api {
    public static BackendUrl: string = BackendUrl;
    public static ApiUrl: string = ApiUrl;

    protected async request(method: ApiMethods, endpoint: string, body: any | undefined = undefined, retry: boolean = true): Promise<ApiResponse> {
        if (!await SessionRefresher.beforeRequest()) return { status: 401, data: "Session expired." };

        try {
            const token: string | undefined = Session.getAccess();
            const fBody: string | undefined = (body) ? JSON.stringify(body) : undefined;
            const response: Response = await fetch(`${Api.ApiUrl}/${endpoint}`, {
                method,
                headers: {
                    "Authorization": (token) ? `Bearer ${token}` : "", 
                    "Content-Type": "application/json", 
                }, 
                body: fBody
            });

            // el access venció mientras volaba la peticion: se rota una vez y se reintenta
            if (response.status === 401 && retry && await SessionRefresher.refresh()) 
                return this.request(method, endpoint, body, false);

            const data: string = await response.text();
            return { status: response.status, data: data };
        } catch (err: any) {
            if (err instanceof Error) 
                return { status: 500, data: err.message };
            return { status: 500, data: "An unknown error occurred." };
        }
    }
    protected async fetch(method: ApiMethods, endpoint: string, body: any | undefined = undefined): Promise<ApiResponse> {
        return this.request(method, endpoint, body);
    }
    protected async requestFile(method: ApiMethods, endpoint: string, body: FormData, retry: boolean = true): Promise<ApiResponse> {
        if (!await SessionRefresher.beforeRequest()) return { status: 401, data: "Session expired." };

        try {
            const token: string | undefined = Session.getAccess();
            const response: Response = await fetch(`${Api.ApiUrl}/${endpoint}`, {
                method,
                headers: {
                    "Authorization": (token) ? `Bearer ${token}` : "", 
                }, 
                body: body
            });

            if (response.status === 401 && retry && await SessionRefresher.refresh()) 
                return this.requestFile(method, endpoint, body, false);

            const data: string = await response.text();
            return { status: response.status, data: data };
        } catch (err: any) {
            if (err instanceof Error) 
                return { status: 500, data: err.message };
            return { status: 500, data: "An unknown error occurred." };
        }
    }
    protected async fetchFile(method: ApiMethods, endpoint: string, body: FormData): Promise<ApiResponse> {
        return this.requestFile(method, endpoint, body);
    }
}