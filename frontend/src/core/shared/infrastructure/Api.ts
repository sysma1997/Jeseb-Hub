export enum ApiMethods {
    GET = "GET",
    POST = "POST",
    PUT = "PUT", 
    DELETE = "DELETE"
}
export interface ApiResponse {
    status: number;
    data: string;
}
export abstract class Api {
    public static BackendUrl: string = "http://localhost:3000";
    public static ApiUrl: string = `${Api.BackendUrl}/api`;

    protected async fetch(method: ApiMethods, endpoint: string, body: any | undefined = undefined): Promise<ApiResponse> {
        try {
            const token: string | undefined = window.localStorage.getItem("token") ?? undefined;
            const fBody: string | undefined = (body) ? JSON.stringify(body) : undefined;
            const response: Response = await fetch(`${Api.ApiUrl}/${endpoint}`, {
                method,
                headers: {
                    "Authorization": (token) ? `Bearer ${token}` : "", 
                    "Content-Type": "application/json", 
                }, 
                body: fBody
            });

            const data: string = await response.text();
            return { status: response.status, data: data };
        } catch (err: any) {
            if (err instanceof Error) 
                return { status: 500, data: err.message };
            return { status: 500, data: "An unknown error occurred." };
        }
    }
    protected async fetchFile(method: ApiMethods, endpoint: string, body: FormData): Promise<ApiResponse> {
        try {
            const token: string | undefined = window.localStorage.getItem("token") ?? undefined;
            const response: Response = await fetch(`${Api.ApiUrl}/${endpoint}`, {
                method,
                headers: {
                    "Authorization": (token) ? `Bearer ${token}` : "", 
                }, 
                body: body
            });

            const data: string = await response.text();
            return { status: response.status, data: data };
        } catch (err: any) {
            if (err instanceof Error) 
                return { status: 500, data: err.message };
            return { status: 500, data: "An unknown error occurred." };
        }
    }
}