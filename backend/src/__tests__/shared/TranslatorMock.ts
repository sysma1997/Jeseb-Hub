import type { TranslatorRepository } from "../../core/shared/domain/TranslatorRepository";

const translations: Record<string, string> = {
    "accounts.errors.nameRequired": "The name is required.",
    "accounts.errors.balanceRequired": "The balance is required.",
    "accounts.errors.notFound": "Account not found or not exists.",
    "categories.errors.nameRequired": "The name is required.",
    "transactions.errors.accountRequired": "The account for transaction is required.",
    "transactions.errors.valueRequired": "The value must be greater than 0.",
    "transactions.errors.dateRequired": "The date for transaction is required.",
    "transactions.errors.typeRequired": "The type (ingress, egress) for transaction is required.",
    "transactions.errors.notFound": "Transaction not found or not exists.",
    "users.errors.nameRequired": "The name for user is required.",
    "users.errors.emailRequired": "The email for user is required.",
    "users.errors.passwordRequired": "The password for user is required.",
    "users.errors.emailInvalid": "The '{{email}}' is not a valid email.",
    "users.errors.passwordInvalid": "The password is not valid, please check that it is in SHA256.",
    "users.errors.notFound": "User not found or not exists.",
    "users.errors.passwordIncorrect": "The current password is incorrect.",
    "users.errors.emailExists": "The email '{{email}}' already exists.",
};

export const mockTranslator: TranslatorRepository = {
    translate(key: string, params?: Record<string, any>): string {
        let msg = translations[key] ?? key;
        if (params) {
            for (const [k, v] of Object.entries(params)) {
                msg = msg.replace(`{{${k}}}`, String(v));
            }
        }
        return msg;
    },
    getLocale(): string {
        return "en";
    }
};
