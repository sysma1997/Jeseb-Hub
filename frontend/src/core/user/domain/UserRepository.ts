import { User } from "./User";
import type { UserConfig } from "./User";

export interface UserRepository {
    register(user: User): Promise<void>;
    validate(token: string): Promise<void>;
    
    requestRecoverPassword(email: string): Promise<string>;
    recoverPassword(token: string, password: string): Promise<string>;

    updateProfile(image: File): Promise<string>;
    updateName(name: string): Promise<string>;
    requestUpdateEmail(email: string): Promise<string>;
    updateEmail(email: string, code: number): Promise<string>;
    updatePassword(currentPassword: string, newPassword: string): Promise<string>;
    updateTwoStep(config: UserConfig): Promise<string>;
    
    login(email: string, password: string, code?: number): Promise<{ token: string | undefined, message?: string | undefined }>;

    get(): Promise<User | undefined>;
}