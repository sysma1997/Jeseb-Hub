import { User } from "../../core/user/domain/User";
import type { UserConfig } from "../../core/user/domain/User";
import type { UserRepository } from "../../core/user/domain/UserRepository";
import { t } from "../../core/shared/infrastructure/i18n";
import { MessageBuilder } from "../../core/shared/domain/MessageBuilder";

const updatePassword = document.getElementById("btnSUpdatePassword") as HTMLButtonElement;
const updateTwoStep = document.getElementById("btnSUpdateTwoStep") as HTMLButtonElement;

const modalUpdatePassword = document.getElementById("mUpdatePassword") as HTMLDivElement;
const mupClose = modalUpdatePassword.querySelector('.modal-close') as HTMLButtonElement;
const mupCurrentPassword = document.getElementById("iMUPCurrentPassword") as HTMLInputElement;
const mupNewPassword = document.getElementById("iMUPNewPassword") as HTMLInputElement;
const mupConfirmPassword = document.getElementById("iMUPConfirmPassword") as HTMLInputElement;
const mupCancel = document.getElementById("btnMUPCancel") as HTMLButtonElement;
const mupAccept = document.getElementById("btnMUPAccept") as HTMLButtonElement;

const modalUpdateTwoStep = document.getElementById("mUpdateTwoStep") as HTMLDivElement;
const mutsClose = modalUpdateTwoStep.querySelector('.modal-close') as HTMLButtonElement;
const mutsActive = document.getElementById("iMUTSActive") as HTMLInputElement;
const mutsType = document.getElementById("sMUTSType") as HTMLSelectElement;
const mutsCancel = document.getElementById("btnMUTSCancel") as HTMLButtonElement;
const mutsAccept = document.getElementById("btnMUTSAccept") as HTMLButtonElement;

const mupClickCancel = () => {
    modalUpdatePassword.classList.remove("is-active");
    mupCurrentPassword.value = "";
    mupNewPassword.value = "";
    mupConfirmPassword.value = "";
};
const mutsClickCancel = () => {
    modalUpdateTwoStep.classList.remove("is-active");
}

export const setup = (user: User, repository: UserRepository) => {
    if (user.config) 
        if (user.config.twoStep.active) 
            mutsActive.checked = user.config.twoStep.active;

    updatePassword.onclick = () => {
        modalUpdatePassword.classList.add("is-active");
    };
    mupClose.onclick = () => mupClickCancel();
    mupCurrentPassword.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter") {
            event.preventDefault();
            mupNewPassword.focus();
        }
    });
    mupNewPassword.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter") {
            event.preventDefault();
            mupConfirmPassword.focus();
        }
    });
    mupConfirmPassword.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter") {
            event.preventDefault();
            mupAccept.click();
        }
    });
    mupCancel.onclick = () => mupClickCancel();
    mupAccept.onclick = async () => {
        if (!mupCurrentPassword.value || !mupNewPassword.value || !mupConfirmPassword.value) {
            const message = new MessageBuilder();

            if (!mupCurrentPassword.value) message.add(t("shared.passwordCurrentRequired"));
            if (!mupNewPassword.value) message.add(t("shared.passwordNewRequired"));
            if (!mupConfirmPassword.value) message.add(t("shared.passwordConfirmRequired"));

            window.showAlert(message.toString());
            return;
        }
        if (mupNewPassword.value !== mupConfirmPassword.value) {
            window.showAlert(t("shared.passwordNewDontMatch"));
            return;
        }

        mupAccept.classList.add("is-loading");
        mupAccept.disabled = true;
        try {
            const result = await repository.updatePassword(mupCurrentPassword.value, mupNewPassword.value);

            window.showAlert(result, t("shared.passwordUpdate"), () => {
                mupAccept.classList.remove("is-loading");
                mupAccept.disabled = false;
                mupClickCancel();
            });
        } catch (err: any) {
            if (err instanceof Error) {
                console.error(err);
                window.showAlert(err.message);
            }

            mupAccept.classList.remove("is-loading");
            mupAccept.disabled = false;
        }
    };

    updateTwoStep.onclick = () => {
        modalUpdateTwoStep.classList.add("is-active");
    };
    mutsClose.onclick = () => mutsClickCancel();
    mutsCancel.onclick = () => mutsClickCancel();
    mutsAccept.onclick = () => {
        const active = mutsActive.checked;
        const type = mutsType.value;

        mutsAccept.classList.add("is-loading");
        mutsAccept.disabled = true;
        let message =  `${((active) ? t("profile.security.active") : t("profile.security.deactivate"))} ` + 
            `${t("shared.codeVerification").toLocaleLowerCase()}?\n` + 
            t("profile.security.confirm", { value: ((active) ? t("profile.security.deactivate") : t("profile.security.active")).toLocaleLowerCase() });
        window.showConfirm(message, t("shared.codeVerification"), async () => {
            const config: UserConfig = {
                twoStep: {
                    active: active, 
                    type: type
                }
            };

            const finish = async (code?: string) => {
                try {
                    const result = await repository.updateTwoStep(config, code);

                    window.showAlert(result, t("shared.codeVerification"), () => {
                        user = user.setConfig(config);
                        mutsActive.checked = config.twoStep.active;
                        mutsAccept.classList.remove("is-loading");
                        mutsAccept.disabled = false;
                        mutsClickCancel();
                    });
                } catch (err: any) {
                    if (err instanceof Error) {
                        console.error(err);
                        window.showAlert(err.message);
                    }

                    mutsAccept.classList.remove("is-loading");
                    mutsAccept.disabled = false;
                }
            };

            if (active) {
                await finish();
                return;
            }

            try {
                const sent = await repository.requestTwoStepCode();

                window.showAlert(sent, t("shared.codeVerification"), () => {
                    window.showPrompt(
                        t("profile.security.disablePrompt"),
                        t("shared.codeVerification"),
                        async (value: string) => {
                            const clean: string = value.trim();
                            if (clean.length !== 6) {
                                window.showAlert(t("shared.codeVerificationInvalid"));
                                mutsAccept.classList.remove("is-loading");
                                mutsAccept.disabled = false;
                                return;
                            }
                            await finish(clean);
                        },
                        () => {
                            mutsAccept.classList.remove("is-loading");
                            mutsAccept.disabled = false;
                        });
                });
            } catch (err: any) {
                if (err instanceof Error) {
                    console.error(err);
                    window.showAlert(err.message);
                }

                mutsAccept.classList.remove("is-loading");
                mutsAccept.disabled = false;
            }
        }, () => {
            mutsAccept.classList.remove("is-loading");
            mutsAccept.disabled = false;
        });
    };
};