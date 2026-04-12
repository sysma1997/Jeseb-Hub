import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc.js";

import { User } from "../core/user/domain/User";
import type { UserRepository } from "../core/user/domain/UserRepository";
import { UserApiRepository } from "../core/user/infrastructure/UserApiRepository";
import { getLocale, t, type Locale } from "../core/shared/infrastructure/i18n";
import { MessageBuilder } from "../core/shared/domain/MessageBuilder";

dayjs.extend(dayjsUtc);

const repository: UserRepository = new UserApiRepository();

const email = document.getElementById("inEmail") as HTMLInputElement;
const password = document.getElementById("inPassword") as HTMLInputElement;
const login = document.getElementById("btnLogin") as HTMLButtonElement;

const modalTwoStep = document.getElementById("mTwoStep") as HTMLDivElement;
const mtsClose = modalTwoStep.querySelector(".delete") as HTMLButtonElement;
const mtsMessage = document.getElementById("mtsMessage") as HTMLLabelElement;
const mtsCode = document.getElementById("iMTSCode") as HTMLInputElement;
const mtsCancel = document.getElementById("btnMTSCancel") as HTMLButtonElement;
const mtsAccept = document.getElementById("btnMTSAccept") as HTMLButtonElement;

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
        const message = new MessageBuilder(true);

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

        window.localStorage.setItem("token", login.token!);
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
mtsAccept.onclick = async () => {
    if (!mtsCode.value) {
        window.showAlert(t("shared.codeVerificationRequired"));
        return;
    }
    if (mtsCode.value.length !== 6) {
        window.showAlert(t("shared.codeVerificationInvalid"));
        return;
    }

    mtsAccept.classList.add("is-loading");
    mtsAccept.disabled = true;
    try {
        const login = await repository.login(email.value, password.value, Number(mtsCode.value));

        window.localStorage.setItem("token", login.token!);
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