export enum ApiMethods {
    GET = "GET",
    POST = "POST",
    PUT = "PUT", 
    DELETE = "DELETE"
}
export const BackendUrl: string = (import.meta.env.PUBLIC_BACKEND_URL) ? 
    import.meta.env.PUBLIC_BACKEND_URL : "http://localhost:3000";
export const ApiUrl: string = `${BackendUrl}/api`;