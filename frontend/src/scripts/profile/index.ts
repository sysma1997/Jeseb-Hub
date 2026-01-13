import { User } from "../../core/user/domain/User";
import type { UserRepository } from "../../core/user/domain/UserRepository";
import { UserApiRepository } from "../../core/user/infrastructure/UserApiRepository";

import { setup as informationSetup } from "./information";
import { setup as securitySetup } from "./security";

const repository: UserRepository = new UserApiRepository();

const menuList = document.getElementById("uMenuList") as HTMLUListElement;
const items = document.getElementById("dItems") as HTMLDivElement;

const menuItems = menuList.getElementsByClassName("menu-item");
for (let i = 0; i < menuItems.length; i++) {
    const item = menuItems[i] as HTMLAnchorElement;
    item.onclick = () => clickMenuItem(item);
}

const user: User | undefined = await repository.get();
if (user) {
    informationSetup(user, repository);
    securitySetup(user, repository);
}

const clickMenuItem = (menuItem: HTMLAnchorElement) => {
    for (let i = 0; i < menuItems.length; i++) {
        const item = menuItems[i];
        item.classList.remove("is-active");
    }

    menuItem.classList.add("is-active");
    showItem(menuItem);
};
const showItem = (menuItem: HTMLAnchorElement) => {
    let name: string = menuItem.id;
    name = name.replace("aMenu", "");
    
    const list = items.getElementsByClassName("card");
    for (let i = 0; i < list.length; i++) {
        const item = list[i] as HTMLDivElement;

        item.style.display = (item.id.indexOf(name) !== -1) ? 
            "block" : "none";
    }
}