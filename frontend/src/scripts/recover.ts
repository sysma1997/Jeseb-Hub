import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc.js";

import { User } from "../core/user/domain/User";
import type { UserRepository } from "../core/user/domain/UserRepository";
import { UserApiRepository } from "../core/user/infrastructure/UserApiRepository";
import { getLocale, t } from "../core/shared/infrastructure/i18n";
import { MessageBuilder } from "../core/shared/domain/MessageBuilder";

dayjs.extend(dayjsUtc);

const repository: UserRepository = new UserApiRepository();

const email = document.getElementById("inEmail") as HTMLInputElement;
const recover = document.getElementById("btnRecover") as HTMLButtonElement;

const locale = getLocale();

email.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Enter") {
        event.preventDefault();
        recover.click();
    }
});
recover.onclick = async () => {
    if (!email.value) {
        window.showAlert(t("shared.emailRequired"));
        return;
    }
    if (!User.IsValidEmail(email.value)) {
        window.showAlert(t("shared.emailInvalid"));
        return;
    }

    recover.classList.add("is-loading");
    recover.disabled = true;
    try {
        const result = await repository.requestRecoverPassword(email.value);

        window.showAlert(result, t("recover.emailRequest"));
        recover.classList.remove("is-loading");
        recover.disabled = false;
    } catch (err: any) {
        if (err instanceof Error) {
            console.error(err);
            window.showAlert(err.message);
        }

        recover.classList.remove("is-loading");
        recover.disabled = false;
    }
};

const search = new URLSearchParams(window.location.search);
if (search.get("token")) {
    const token: string = search.get("token")!;
    const password = document.getElementById("inPassword") as HTMLInputElement;
    const confirmPassword = document.getElementById("inConfirmPassword") as HTMLInputElement;

    document.getElementById("dEmail")!.style.display = "none";
    document.getElementById("dPassword")!.style.display = "block";
    document.getElementById("dConfirmPassword")!.style.display = "block";
    recover.innerText = t("shared.passwordUpdate");

    password.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter") {
            event.preventDefault();
            confirmPassword.focus();
        }
    });
    confirmPassword.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter") {
            event.preventDefault();
            recover.click();
        }
    });
    recover.onclick = async () => {
        if (!password.value || !confirmPassword.value) {
            const message = new MessageBuilder(true);

            if (!password.value) message.add(t("shared.passwordRequired"));
            if (!confirmPassword.value) message.add(t("shared.passwordConfirmRequired"));

            window.showAlert(message.toString());
            return;
        }
        if (password.value !== confirmPassword.value) {
            window.showAlert(t("shared.passwordDontMatch"));
            return;
        }

        recover.classList.add("is-loading");
        recover.disabled = true;
        try {
            const result = await repository.recoverPassword(token, password.value);
            
            window.showAlert(result, t("recover.recoverPassword"), () => {
                window.location.href = `/${locale}/login`;
            });
            recover.classList.remove("is-loading");
            recover.disabled = false;
        } catch (err: any) {
            if (err instanceof Error) {
                console.error(err);
                window.showAlert(err.message);
            }

            recover.classList.remove("is-loading");
            recover.disabled = false;
        }
    };
}