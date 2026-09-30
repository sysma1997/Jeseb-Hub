import { User } from "./User";
import type { UserConfig } from "./User";

export interface LoginResult {
    accessToken: string | undefined;
    refreshToken: string | undefined;
    message?: string | undefined;
}
export interface UserRepository {
    register(user: User): Promise<void>;
    validate(token: string): Promise<void>;
    
    requestRecoverPassword(email: string): Promise<string>;
    recoverPassword(token: string, password: string): Promise<string>;

    updateProfile(image: File): Promise<string>;
    updateName(name: string): Promise<string>;
    requestUpdateEmail(email: string): Promise<string>;
    resendUpdateEmail(): Promise<string>;
    getEmailChangeStatus(): Promise<{ step: "current" | "new", email: string }>;
    updateEmail(step: "current" | "new", code: string): Promise<string>;
    updatePassword(currentPassword: string, newPassword: string): Promise<string>;
    requestTwoStepCode(): Promise<string>;
    updateTwoStep(config: UserConfig, code?: string): Promise<string>;

    deleteAllData(): Promise<string>;
    
login(email: string, password: string, code?: string): Promise<LoginResult>;

logout(): Promise<void>;

get(): Promise<User | undefined>;
}