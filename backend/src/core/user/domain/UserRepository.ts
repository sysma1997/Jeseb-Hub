import { User } from "./User";
import type { UserConfig } from "./User";

export interface UserRepository {
    register(user: User): Promise<void>;
    recoverPassword(id: string, password: string): Promise<void>;
    
    updateProfile(id: string, profile: string | undefined): Promise<void>;
    updateName(id: string, name: string): Promise<void>;
    updateEmail(id: string, email: string): Promise<void>;
    updatePassword(id: string, currentPassword: string, newPassword: string): Promise<void>;
    updateTwoStep(id: string, config: UserConfig): Promise<void>;
    
    login(email: string, password: string): Promise<User>;

    get(id: string): Promise<User>;
    getWithEmail(email: string): Promise<User | undefined>;
}