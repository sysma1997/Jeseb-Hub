import dayjs from "dayjs";

import { Api } from "../../core/shared/infrastructure/Api";
import { User } from "../../core/user/domain/User";
import type { UserRepository } from "../../core/user/domain/UserRepository";

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
const ieeiVerificate = document.getElementById("btnIEEVerificate") as HTMLButtonElement;
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

const setInformation = (user: User) => {
    name.innerText = user.name;
    isEmail.innerText = user.email;

    if (user.profile) photo.src = `${Api.BackendUrl}${user.profile}`;
    createdAt.innerHTML = `Created at: <small>${dayjs(user.createAt).format("DD/MM/YYYY HH:mm:ss")}</small>`;
    if (user.lastUpdate) {
        lastUpdate.style.display = "block";
        lastUpdate.innerHTML = `Last update: <small>${dayjs(user.lastUpdate).format("DD/MM/YYYY HH:mm:ss")}</small>`;
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
            photo.src = (user.profile) ? 
                `${Api.BackendUrl}${user.profile}` : "/assets/images/profile.png";
            return;
        }
        if (!mimesValid.includes(file.type)) {
            photo.src = (user.profile) ? 
                `${Api.BackendUrl}${user.profile}` : "/assets/images/profile.png";
            window.showAlert(`Invalid mime, only valid: ${mimesValid.join(", ")}`);
            return;
        }

        try {
            await repository.updateProfile(file);
            photo.src = URL.createObjectURL(file);
        } catch (err: any) {
            if (err instanceof Error) {
                console.error(err);
                window.showAlert(err.message);
            }

            photo.src = (user.profile) ? 
                `${Api.BackendUrl}${user.profile}` : "/assets/images/profile.png";
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
            window.showAlert("The name is required.");
            return;
        }
        if (ienInput.value === user.name) {
            window.showAlert("The name is the same one you are using on this account.");
            return;
        }

        ienUpdate.classList.add("is-loading");
        ienUpdate.disabled = true;
        window.showConfirm(`Update the name to '${ienInput.value}'?`, "Update name", async () => {
            try {
                const result = await repository.updateName(ienInput.value);

                window.showAlert(result, "Update name", () => {
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
        });
    }

    ieeInput.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter") {
            event.preventDefault();
            ieeiVerificate.click();
        }
    });
    ieeiVerificate.onclick = () => {
        if (!ieeInput.value) {
            window.showAlert("The email is required.");
            return;
        }
        if (!User.IsValidEmail(ieeInput.value)) {
            window.showAlert(`The '${ieeInput.value}' is not email valid.`);
            return;
        }
        if (ieeInput.value == user.email) {
            window.showAlert("The email is the same one you are using on this account.");
            return;
        }

        window.showConfirm(`Update the email to '${ieeInput.value}'?`, "Update email", async () => {
            try {
                const result = await repository.requestUpdateEmail(ieeInput.value);

                window.showAlert(result, "Code verification");
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
            let message = "";
            let lineBreak = 0;

            if (!ieeInput.value) {
                message += "The email is required.";
                lineBreak++;
            }
            if (!ieecvInput.value) message += ((lineBreak > 0) ? "</br>" : "") + 
                "The code verification is required.";
            
            window.showAlert(message);
            return;
        }
        if (!User.IsValidEmail(ieeInput.value)) {
            window.showAlert(`The '${ieeInput.value}' is not email valid.`);
            return;
        }
        if (ieecvInput.value.length !== 6) {
            window.showAlert("The code does not have 6 digits.");
            return
        }

        ieeUpdate.classList.add("is-loading");
        ieeUpdate.disabled = true;
        try {
            const result = await repository.updateEmail(ieeInput.value, Number(ieecvInput.value));

            window.showAlert(result, "Update email", () => {
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
