import { User } from "../domain/User";
import type { UserConfig, UserDto } from "../domain/User";
import type { UserRepository } from "../domain/UserRepository";
import { Api, ApiMethods } from "../../shared/infrastructure/Api";
import type { ApiResponse } from "../../shared/infrastructure/Api";

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
    async updateEmail(email: string, code: number): Promise<string> {
        const response: ApiResponse = await this.fetch(ApiMethods.PUT, "user/update/email", { email, code });
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
    async updateTwoStep(config: UserConfig): Promise<string> {
        const response: ApiResponse = await this.fetch(ApiMethods.PUT, "user/update/two-step", { 
            active: config.twoStep.active, 
            type: config.twoStep.type
        });
        if (response.status >= 400) 
            throw new Error(response.data);

        return response.data;
    }

    async login(email: string, password: string, code?: number): Promise<{ token: string | undefined, message?: string | undefined }> {
        const params: any = {
            email, password
        };
        if (code) params.code = code;
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

        const data: any = JSON.parse(response.data);
        if (data.newToken) 
            window.localStorage.setItem("token", data.newToken);

        const userDto: UserDto = data as UserDto;
        return User.FromDto(userDto);
    }
}