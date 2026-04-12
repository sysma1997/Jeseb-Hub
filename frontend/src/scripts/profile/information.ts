import dayjs from "dayjs";

import { Api } from "../../core/shared/infrastructure/Api";
import { User } from "../../core/user/domain/User";
import type { UserRepository } from "../../core/user/domain/UserRepository";
import { t } from "../../core/shared/infrastructure/i18n";
import { MessageBuilder } from "../../core/shared/domain/MessageBuilder";

const icon = document.getElementById("iIPIcon") as HTMLElement;
const photo = document.getElementById("iIPPhoto") as HTMLImageElement;
const photoEdit = document.getElementById("btnIPPhotoEdit") as HTMLButtonElement;
const photoFile = document.getElementById("iIPPhotoEdit") as HTMLInputElement;
const name = document.getElementById("lIPName") as HTMLLabelElement;

const informationShow = document.getElementById("dInformationShow") as HTMLDivElement;
const isEmail = document.getElementById("dIEEmail") as HTMLLabelElement;

const informationEditName = document.getElementById("dInformationEditName") as HTMLDivElement;
const ienInput = document.getElementById("iIENInput") as HTMLInputElement;
const ienCancel = document.getElementById("btnIENCancel") as HTMLButtonElement;
const ienUpdate = document.getElementById("btnIENUpdate") as HTMLButtonElement;

const informationEditEmail = document.getElementById("dInformationEditEmail") as HTMLDivElement;
const ieeInput = document.getElementById("iIEEInput") as HTMLInputElement;
const ieeiVerify = document.getElementById("btnIEEVerify") as HTMLButtonElement;
const ieeCodeVerification = document.getElementById("dIEECodeVerification") as HTMLDivElement;
const ieecvInput = document.getElementById("iIEECVInput") as HTMLInputElement;
const ieeCancel = document.getElementById("btnIEECancel") as HTMLButtonElement;
const ieeUpdate = document.getElementById("btnIEEUpdate") as HTMLButtonElement;

const informationOptions = document.getElementById("dInformationOptions") as HTMLDivElement;
const updateName = document.getElementById("btnIOUpdateName") as HTMLButtonElement;
const updateEmail = document.getElementById("btnIOUpdateEmail") as HTMLButtonElement;

const createdAt = document.getElementById("sICreatedAt") as HTMLSpanElement;
const lastUpdate = document.getElementById("sILastUpdate") as HTMLSpanElement;

const mimesValid = [ 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp' ];

const setImageProfile = (profile: string | undefined) => {
    if (profile) {
        photo.src = `${Api.BackendUrl}${profile}`;
        photo.style.display = "block";
        icon.style.display = "none";
    }
    else {
        icon.style.display = "block";
        photo.style.display = "none";
    }
};
const setInformation = (user: User) => {
    name.innerText = user.name;
    isEmail.innerText = user.email;

    setImageProfile(user.profile);
    createdAt.innerHTML = t("profile.information.createAt", { date: dayjs(user.createAt).format("DD/MM/YYYY HH:mm:ss") });
    if (user.lastUpdate) {
        lastUpdate.style.display = "block";
        lastUpdate.innerHTML = t("profile.information.lastUpdate", { date: dayjs(user.lastUpdate).format("DD/MM/YYYY HH:mm:ss") });
    }

    ienInput.placeholder = user.name;
    ieeInput.placeholder = user.email;
};

export const setup = (user: User, repository: UserRepository) => {
    setInformation(user);

    photoEdit.onclick = () => {
        photoFile.click();
    };
    photoFile.addEventListener("change", async () => {
        const file = photoFile.files?.[0];
        if (!file) {
            return;
        }
        if (!mimesValid.includes(file.type)) {
            setImageProfile(user.profile);
            window.showAlert(`Invalid mime, only valid: ${mimesValid.join(", ")}`);
            return;
        }

        try {
            await repository.updateProfile(file);
            photo.src = URL.createObjectURL(file);
            photo.style.display = "block";
            icon.style.display = "none";
        } catch (err: any) {
            if (err instanceof Error) {
                console.error(err);
                window.showAlert(err.message);
            }

            setImageProfile(user.profile);
        }
    });
    updateName.onclick = () => {
        informationShow.style.display = "none";
        informationOptions.style.display = "none";
        informationEditName.style.display = "block";
    };
    updateEmail.onclick = () => {
        informationShow.style.display = "none";
        informationOptions.style.display = "none";
        informationEditEmail.style.display = "block";
    };

    ienInput.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter") {
            event.preventDefault();
            ienUpdate.click();
        }
    })
    ienCancel.onclick = () => {
        informationEditName.style.display = "none";
        informationShow.style.display = "block";
        informationOptions.style.display = "block";
    };
    ienUpdate.onclick = () => {
        if (!ienInput.value) {
            window.showAlert(t("shared.nameRequired"));
            return;
        }
        if (ienInput.value === user.name) {
            window.showAlert(t("profile.information.updateName.same"));
            return;
        }

        ienUpdate.classList.add("is-loading");
        ienUpdate.disabled = true;
        window.showConfirm(t("profile.information.updateName.confirm", { name: ienInput.value }), t("profile.information.updateName.title"), async () => {
            try {
                const result = await repository.updateName(ienInput.value);

                window.showAlert(result, t("profile.information.updateName.title"), () => {
                    user = user.setName(ienInput.value)
                        .setLastUpdate(dayjs().toDate());
                    setInformation(user);
                    
                    ienInput.value = "";
                    ienCancel.click();
                    ienUpdate.classList.remove("is-loading");
                    ienUpdate.disabled = false;
                });
            } catch (err: any) {
                if (err instanceof Error) {
                    console.error(err);
                    window.showAlert(err.message);
                }

                ienUpdate.classList.remove("is-loading");
                ienUpdate.disabled = false;
            }
        }, () => {
            ienUpdate.classList.remove("is-loading");
            ienUpdate.disabled = false;
        });
    }

    ieeInput.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter") {
            event.preventDefault();
            ieeiVerify.click();
        }
    });
    ieeiVerify.onclick = () => {
        if (!ieeInput.value) {
            window.showAlert(t("shared.emailRequired"));
            return;
        }
        if (!User.IsValidEmail(ieeInput.value)) {
            window.showAlert(t("shared.emailInvalid"));
            return;
        }
        if (ieeInput.value == user.email) {
            window.showAlert(t("profile.information.updateEmail.same"));
            return;
        }

        window.showConfirm(t("profile.information.updateEmail.confirm", { email: ieeInput.value }), t("profile.information.updateEmail.title"), async () => {
            try {
                const result = await repository.requestUpdateEmail(ieeInput.value);

                window.showAlert(result, t("shared.codeVerification"));
                ieeCodeVerification.style.display = "block";
                ieeUpdate.disabled = false;
            } catch (err: any) {
                if (err instanceof Error) {
                    console.error(err);
                    window.showAlert(err.message);
                }
            }
        });
    };
    ieeCancel.onclick = () => {
        informationEditEmail.style.display = "none";
        informationShow.style.display = "block";
        informationOptions.style.display = "block";
    };
    ieeUpdate.onclick = async () => {
        if (!ieeInput.value || !ieecvInput.value) {
            const message = new MessageBuilder(true);

            if (!ieeInput.value) message.add(t("shared.emailRequired"));
            if (!ieecvInput.value) message.add(t("shared.codeVerificationRequired"));
            
            window.showAlert(message.toString());
            return;
        }
        if (!User.IsValidEmail(ieeInput.value)) {
            window.showAlert(t("shared.emailInvalid"));
            return;
        }
        if (ieecvInput.value.length !== 6) {
            window.showAlert(t("shared.codeVerificationInvalid"));
            return
        }

        ieeUpdate.classList.add("is-loading");
        ieeUpdate.disabled = true;
        try {
            const result = await repository.updateEmail(ieeInput.value, Number(ieecvInput.value));

            window.showAlert(result, t("profile.information.updateEmail.title"), () => {
                user = user.setEmail(ieeInput.value)
                    .setLastUpdate(dayjs().toDate());
                setInformation(user);

                ieeInput.value = "";
                ieecvInput.value = "";
                ieeCancel.click();
                ieeUpdate.classList.remove("is-loading");
                ieeUpdate.disabled = false;
            });
        } catch (err: any) {
            if (err instanceof Error) {
                console.error(err);
                window.showAlert(err.message);
            }

            ieeUpdate.classList.remove("is-loading");
            ieeUpdate.disabled = false;
        }
    };
};
