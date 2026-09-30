import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc.js";

import { User } from "../core/user/domain/User";
import type { UserRepository } from "../core/user/domain/UserRepository";
import { UserApiRepository } from "../core/user/infrastructure/UserApiRepository";
import { getLocale, t, type Locale } from "../core/shared/infrastructure/i18n";
import { MessageBuilder } from "../core/shared/domain/MessageBuilder";
import { Session } from "../core/shared/infrastructure/Session";

dayjs.extend(dayjsUtc);

const repository: UserRepository = new UserApiRepository();

const email = document.getElementById("inEmail") as HTMLInputElement;
const password = document.getElementById("inPassword") as HTMLInputElement;
const login = document.getElementById("btnLogin") as HTMLButtonElement;

const modalTwoStep = document.getElementById("mTwoStep") as HTMLDivElement;
const mtsClose = modalTwoStep.querySelector(".modal-close") as HTMLButtonElement;
const mtsMessage = document.getElementById("mtsMessage") as HTMLLabelElement;
const mtsCode = document.getElementById("iMTSCode") as HTMLInputElement;
const mtsCancel = document.getElementById("btnMTSCancel") as HTMLButtonElement;
const mtsAccept = document.getElementById("btnMTSAccept") as HTMLButtonElement;
const mtsResend = document.getElementById("btnMTSResend") as HTMLButtonElement;

const locale: Locale = getLocale();

repository.get().then((user: User | undefined) => {
    if (!user) return;
    window.location.href = `/${locale}`;
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
        login.click();
    }
});
login.onclick = async () => {
    if (!email.value || !password.value) {
        const message = new MessageBuilder();

        if (!email.value) message.add(t("shared.emailRequired"));
        if (!password.value) message.add(t("shared.passwordRequired"));

        window.showAlert(message.toString());
        return;
    }
    if (!User.IsValidEmail(email.value)) {
        window.showAlert(t("shared.emailInvalid"));
        return;
    }

    login.classList.add("is-loading");
    login.disabled = true;
    try {
        const login = await repository.login(email.value, password.value);
        if (login.message) {
            modalTwoStep.classList.add("is-active");
            mtsMessage.innerText = login.message;
            return;
        }

        Session.save(login.accessToken!, login.refreshToken!);
        window.location.href = `/${locale}`;
    } catch (err: any) {
        if (err instanceof Error) {
            console.error(err);
            window.showAlert(err.message);
        }

        login.classList.remove("is-loading");
        login.disabled = false;
    }
};

const tsClickCancel = () => {
    modalTwoStep.classList.remove("is-active");
    mtsMessage.innerText = "Two step";
    mtsCode.value = "";

    login.classList.remove("is-loading");
    login.disabled = false;
}
mtsClose.onclick = () => tsClickCancel();
mtsCode.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Enter") {
        event.preventDefault();
        mtsAccept.click();
    }
});
mtsCancel.onclick = () => tsClickCancel();
const tsRequestCode = async (button: HTMLButtonElement) => {
    button.classList.add("is-loading");
    button.disabled = true;
    try {
        const resend = await repository.login(email.value, password.value);

        mtsMessage.innerText = resend.message ?? t("shared.codeVerificationResent");
        mtsCode.value = "";
        mtsCode.focus();
    } catch (err: any) {
        if (err instanceof Error) window.showAlert(err.message);
    }

    button.classList.remove("is-loading");
    button.disabled = false;
};
mtsResend.onclick = () => tsRequestCode(mtsResend);
mtsAccept.onclick = async () => {
    const code: string = mtsCode.value.trim();
    if (!code) {
        window.showAlert(t("shared.codeVerificationRequired"));
        return;
    }
    if (code.length !== 6) {
        window.showAlert(t("shared.codeVerificationInvalid"));
        return;
    }

    mtsAccept.classList.add("is-loading");
    mtsAccept.disabled = true;
    try {
        const login = await repository.login(email.value, password.value, code);
        if (!login.accessToken || !login.refreshToken) {
            window.showAlert(login.message ?? t("shared.codeVerificationInvalid"));

            mtsAccept.classList.remove("is-loading");
            mtsAccept.disabled = false;
            return;
        }

        Session.save(login.accessToken, login.refreshToken);
        window.location.href = `/${locale}`;
    } catch (err: any) {
        if (err instanceof Error) {
            console.error(err);
            window.showAlert(err.message);
        }

        mtsAccept.classList.remove("is-loading");
        mtsAccept.disabled = false;
    }
};