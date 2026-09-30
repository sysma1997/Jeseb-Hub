import { ApiMethods, ApiUrl } from "./ApiUrl";
import { Session } from "./Session";

export abstract class SessionRefresher {
    private static refreshing: Promise<boolean> | undefined;

    public static invalidate(): void {
        SessionRefresher.refreshing = undefined;
    }
    private static redirectToLogin(): void {
        // los tokens muertos se limpian siempre; desde el propio login solo se evita navegar
        Session.clear();
        SessionRefresher.invalidate();

        const lang: string = window.location.pathname.split("/")[1] ?? "es";
        if (window.location.pathname === `/${lang}/login`) return;

        window.location.replace(`/${lang}/login`);
    }
    public static refresh(): Promise<boolean> {
        if (SessionRefresher.refreshing) return SessionRefresher.refreshing;

        const promise = SessionRefresher.run();
        SessionRefresher.refreshing = promise;

        return promise.finally(() => { SessionRefresher.refreshing = undefined; });
    }
    private static async run(): Promise<boolean> {
        const refresh: string | undefined = Session.getRefresh();
        if (!refresh)
            return false;

        try {
            const response: Response = await fetch(`${ApiUrl}/user/refresh`, {
                method: ApiMethods.POST,
                headers: {
                    "Authorization": `Bearer ${Session.getAccess() ?? ""}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ refreshToken: refresh })
            });

            if (response.status !== 200) {
                SessionRefresher.redirectToLogin();
                return false;
            }

            const data: any = await response.json();
            if (!data?.accessToken || !data?.refreshToken) {
                SessionRefresher.redirectToLogin();
                return false;
            }

            Session.save(data.accessToken, data.refreshToken);
            return true;
        } catch (err: any) {
            SessionRefresher.redirectToLogin();
            return false;
        }
    }
    public static async beforeRequest(): Promise<boolean> {
        // sin sesion guardada no hay nada que renovar: la peticion sale y el backend responde 401
        if (!Session.isStored()) return true;
        if (!Session.needsRefresh()) return true;

        return SessionRefresher.refresh();
    }
}