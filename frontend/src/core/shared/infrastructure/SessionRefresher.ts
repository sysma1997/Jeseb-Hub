import { ApiMethods, ApiUrl } from "./ApiUrl";
import { Session } from "./Session";

export abstract class SessionRefresher {
    private static refreshing: Promise<boolean> | undefined;

    public static invalidate(): void {
        SessionRefresher.refreshing = undefined;
    }
    private static redirectToLogin(): void {
        Session.clear();
        SessionRefresher.invalidate();

        const lang: string = window.location.pathname.split("/")[1] ?? "es";
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
        if (!refresh) {
            SessionRefresher.redirectToLogin();
            return false;
        }

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
        if (!Session.needsRefresh()) return true;

        return SessionRefresher.refresh();
    }
}