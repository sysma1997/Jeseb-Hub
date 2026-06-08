import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc.js";

import { User } from "../core/user/domain/User";
import type { UserRepository } from "../core/user/domain/UserRepository";
import { UserApiRepository } from "../core/user/infrastructure/UserApiRepository";
import { t, getLocale } from "../core/shared/infrastructure/i18n";
import { MessageBuilder } from "../core/shared/domain/MessageBuilder";

dayjs.extend(dayjsUtc);

const repository: UserRepository = new UserApiRepository();

const name = document.getElementById("inName") as HTMLInputElement;
const email = document.getElementById("inEmail") as HTMLInputElement;
const password = document.getElementById("inPassword") as HTMLInputElement;
const confirmPassword = document.getElementById("inConfirmPassword") as HTMLInputElement;
const register = document.getElementById("btnRegister") as HTMLButtonElement;

const locale = getLocale();

repository.get().then((user: User | undefined) => {
    if (!user) return;
    window.location.href = `/${locale}`;
});

name.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Enter") {
        event.preventDefault();
        email.focus();
    }
});
email.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Enter") {
        event.preventDefault();
        password.focus();
    }
});
password.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Enter") {
        event.preventDefault();
        confirmPassword.focus();
    }
});
confirmPassword.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Enter") {
        event.preventDefault();
        register.click();
    }
});
register.onclick = async () => {
    if (!name.value || !email.value || !password.value || !confirmPassword.value) {
        const message = new MessageBuilder(true);

        if (!name.value) message.add(t("shared.nameRequired"));
        if (!email.value) message.add(t("shared.emailRequired"));
        if (!password.value) message.add(t("shared.passwordRequired"));
        if (!confirmPassword.value) message.add(t("shared.passwordConfirmRequired"));

        window.showAlert(message.toString());
        return;
    }
    if (!User.IsValidEmail(email.value)) {
        window.showAlert(t("shared.emailInvalid"));
        return;
    }
    if (password.value !== confirmPassword.value) {
        window.showAlert(t("shared.passwordDontMatch"));
        return;
    }

    try {
        register.classList.add("is-loading");
        register.disabled = true;
        const user: User = new User(name.value, email.value, 
            dayjs.utc().toDate(), undefined, 
            password.value);

        await repository.register(user);
        window.showAlert(t("register.registerSuccessfully"), t("register.title"), () => {
            window.location.href = `/${locale}/login`;
        });
    } catch (err: any) {
        if (err instanceof Error) {
            console.error(err);
            window.showAlert(err.message);
        }
        
        register.classList.remove("is-loading");
        register.disabled = false;
    }
};