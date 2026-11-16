import type { TranslatorRepository } from "../../core/shared/domain/TranslatorRepository";

const translations: Record<string, string> = {
    "accounts.errors.nameRequired": "The name is required.",
    "accounts.errors.balanceRequired": "The balance is required.",
    "accounts.errors.notFound": "Account not found or not exists.",
    "categories.errors.nameRequired": "The name is required.",
    "debts.errors.personRequired": "The person is required.",
    "debts.errors.typeRequired": "The debt type is required.",
    "debts.errors.amountRequired": "The amount must be greater than 0.",
    "debts.errors.dateRequired": "The debt date is required.",
    "debts.errors.dueDateInvalid": "The due date is not valid.",
    "debts.errors.dueDateBeforeDate": "The due date cannot be earlier than the debt date.",
    "debts.errors.paidAmountInvalid": "The paid amount is not valid.",
    "debts.errors.amountBelowPaid": "The amount cannot be less than the amount already paid ({{paid}}).",
    "debts.errors.notFound": "Debt not found.",
    "debts.errors.paymentDebtRequired": "The debt is required.",
    "debts.errors.paymentAmountRequired": "The payment amount must be greater than 0.",
    "debts.errors.paymentDateRequired": "The payment date is required.",
    "debts.errors.paymentExceedsPending": "The payment cannot exceed the pending amount of {{pending}}.",
    "debts.errors.paymentAccountRequired": "Select an account for this payment.",
    "debts.errors.paymentInsufficientBalance": "The selected account does not have enough balance.",
    "debts.errors.typeCannotChangeAfterPayment": "The debt type cannot be changed after payments have been recorded.",
    "debts.errors.paymentNotFound": "Payment not found.",
    "debts.paymentTransactionDescription": "Debt payment with {{person}}",
    "transactions.errors.accountRequired": "The account for transaction is required.",
    "transactions.errors.valueRequired": "The value must be greater than 0.",
    "transactions.errors.dateRequired": "The date for transaction is required.",
    "transactions.errors.typeRequired": "The type (ingress, egress) for transaction is required.",
    "transactions.errors.notFound": "Transaction not found or not exists.",
    "transactions.errors.debtPaymentLinked": "This transaction is linked to a debt payment. Manage it from the debt details.",
    "users.errors.nameRequired": "The name for user is required.",
    "users.errors.emailRequired": "The email for user is required.",
    "users.errors.passwordRequired": "The password for user is required.",
    "users.errors.emailInvalid": "The '{{email}}' is not a valid email.",
    "users.errors.passwordInvalid": "The password is not valid, please check that it is in SHA256.",
    "users.errors.notFound": "User not found or not exists.",
    "users.errors.passwordIncorrect": "The current password is incorrect.",
    "users.errors.emailExists": "The email '{{email}}' already exists.",
    "users.errors.codeInvalid": "The code does not have 6 digits.",
    "users.errors.codeNotFound": "Verification code not found or not exists.",
    "users.errors.codeNotMatch": "The code entered does not match the verification code.",
    "users.errors.tooManyAttempts": "Too many failed attempts, please request a new verification code.",
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
