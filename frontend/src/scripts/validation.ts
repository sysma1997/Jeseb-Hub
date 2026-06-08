import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc.js";

import type { UserRepository } from "../core/user/domain/UserRepository";
import { UserApiRepository } from "../core/user/infrastructure/UserApiRepository";
import { getLocale, t, type Locale } from "../core/shared/infrastructure/i18n";

dayjs.extend(dayjsUtc);

const repository: UserRepository = new UserApiRepository();

const pMessage = document.getElementById("pMessage") as HTMLParagraphElement;
const btnValidating = document.getElementById("btnValidating") as HTMLButtonElement;

const locale: Locale = getLocale();

const search = new URLSearchParams(window.location.search);
if (!search.get("token")) window.location.href = `/${locale}/register`;

try {
    const token: string = search.get("token")!;
    await repository.validate(token);

    pMessage.textContent = t("validation.response");
    btnValidating.disabled = false;
    btnValidating.classList.remove("is-loading");
    btnValidating.onclick = () => window.location.href = `/${locale}/login`;
} catch (err: any) {
    pMessage.textContent = t("validation.invalid");
}