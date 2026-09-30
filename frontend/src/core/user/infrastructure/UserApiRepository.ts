import { User } from "../domain/User";
import type { UserConfig, UserDto } from "../domain/User";
import type { UserRepository, LoginResult } from "../domain/UserRepository";
import { Api, ApiMethods } from "../../shared/infrastructure/Api";
import type { ApiResponse } from "../../shared/infrastructure/Api";
import { Session } from "../../shared/infrastructure/Session";

export class UserApiRepository extends Api implements UserRepository {
    async register(user: User): Promise<void> {
        const response: ApiResponse = await this.fetch(ApiMethods.POST, "user/register", user.toDto(true));
        if (response.status >= 400) 
            throw new Error(response.data);
    }
    async validate(token: string): Promise<void> {
        const response: ApiResponse = await this.fetch(ApiMethods.GET, `user/validate/${token}`);
        if (response.status >= 400) 
            throw new Error(response.data);
    }
    async requestRecoverPassword(email: string): Promise<string> {
        const response: ApiResponse = await this.fetch(ApiMethods.GET, `user/recover/password/${email}`);
        if (response.status >= 400) 
            throw new Error(response.data);

        return response.data;
    }
    async recoverPassword(token: string, password: string): Promise<string> {
        const response: ApiResponse = await this.fetch(ApiMethods.PUT, `user/recover/password`, { token, password });
        if (response.status >= 400) 
            throw new Error(response.data);

        return response.data;
    }

    async updateProfile(image: File): Promise<string> {
        const formData = new FormData();
        formData.append("image", image);
        const response: ApiResponse = await this.fetchFile(ApiMethods.PUT, "user/update/profile", formData);
        if (response.status >= 400) 
            throw new Error(response.data);

        return response.data;
    }
    async updateName(name: string): Promise<string> {
        const response: ApiResponse = await this.fetch(ApiMethods.PUT, "user/update/name", { name });
        if (response.status >= 400) 
            throw new Error(response.data);

        return response.data;
    }
    async requestUpdateEmail(email: string): Promise<string> {
        const response: ApiResponse = await this.fetch(ApiMethods.GET, `user/request/update/email/${email}`);
        if (response.status >= 400) 
            throw new Error(response.data);

        return response.data;
    }
    async resendUpdateEmail(): Promise<string> {
        const response: ApiResponse = await this.fetch(ApiMethods.POST, "user/request/update/email/resend");
        if (response.status >= 400) 
            throw new Error(response.data);

        return response.data;
    }
    async getEmailChangeStatus(): Promise<{ step: "current" | "new", email: string }> {
        const response: ApiResponse = await this.fetch(ApiMethods.GET, "user/update/email/status");
        if (response.status >= 400) 
            throw new Error(response.data);

        return JSON.parse(response.data);
    }
    async updateEmail(step: "current" | "new", code: string): Promise<string> {
        const response: ApiResponse = await this.fetch(ApiMethods.PUT, "user/update/email", { step, code: code.trim() });
        if (response.status >= 400) 
            throw new Error(response.data);

        return response.data;
    }
    async updatePassword(currentPassword: string, newPassword: string): Promise<string> {
        const response: ApiResponse = await this.fetch(ApiMethods.PUT, "user/update/password", { currentPassword, newPassword });
        if (response.status >= 400) 
            throw new Error(response.data);

        return response.data;
    }
    async requestTwoStepCode(): Promise<string> {
        const response: ApiResponse = await this.fetch(ApiMethods.POST, "user/request/two-step/code");
        if (response.status >= 400) 
            throw new Error(response.data);

        return response.data;
    }
    async updateTwoStep(config: UserConfig, code?: string): Promise<string> {
        const params: any = { 
            active: config.twoStep.active, 
            type: config.twoStep.type
        };
        const cleanCode: string = (code ?? "").trim();
        if (cleanCode !== "") params.code = cleanCode;

        const response: ApiResponse = await this.fetch(ApiMethods.PUT, "user/update/two-step", params);
        if (response.status >= 400) 
            throw new Error(response.data);

        return response.data;
    }

    async deleteAllData(): Promise<string> {
        const response: ApiResponse = await this.fetch(ApiMethods.DELETE, "user/delete/all/data");
        if (response.status >= 400) 
            throw new Error(response.data);

        return response.data;
    }

    async login(email: string, password: string, code?: string): Promise<LoginResult> {
        const params: any = {
            email, password
        };
        const cleanCode: string = (code ?? "").trim();
        if (cleanCode !== "") params.code = cleanCode;
        const response: ApiResponse = await this.fetch(ApiMethods.POST, "user/login", params);
        if (response.status >= 400) 
            throw new Error(response.data);

        return JSON.parse(response.data);
    }

    async get(): Promise<User | undefined> {
        const response: ApiResponse = await this.fetch(ApiMethods.GET, "user");
        if (response.status === 401) 
            return undefined;
        if (response.status >= 400)
            throw new Error(response.data);

        const userDto: UserDto = JSON.parse(response.data) as UserDto;
        return User.FromDto(userDto);
    }
    async logout(): Promise<void> {
        const refresh: string | undefined = Session.getRefresh();
        if (!refresh) {
            Session.clear();
            return;
        }

        try {
            const response: ApiResponse = await this.fetch(ApiMethods.POST, "user/logout", { refreshToken: refresh });
            if (response.status >= 400)
                throw new Error(response.data);
        } finally {
            Session.clear();
        }
    }
}