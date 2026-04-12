import { Base } from "../../shared/domain/Base";
import { User, UserDto } from "../../user/domain/User";

import { TranslatorRepository } from "../../shared/domain/TranslatorRepository";

export class Category implements Base {
    private readonly translator: TranslatorRepository;

    public readonly name: string;

    public readonly id?: string | undefined;
    public readonly idUser?: string | undefined;
    
    public readonly user?: User | undefined;

    constructor(translator: TranslatorRepository, 
        name: string, 
        id?: string | undefined, 
        idUser?: string | undefined, 
        user?: User | undefined) {
        this.translator = translator;

        if (!name) 
            throw new Error(translator.translate("categories.errors.nameRequired"));

        this.name = name;
        
        this.id = id;
        this.idUser = idUser;

        this.user = user;
    }

    static FromDto(translator: TranslatorRepository, dto: CategoryDto): Category {
        if (!dto.name) 
            throw new Error(translator.translate("categories.errors.nameRequired"));

        let user: User | undefined = (dto.user) ? User.FromDto(translator, dto.user) : undefined;
        return new Category(translator, dto.name, 
            dto.id, dto.idUser,
            user);
    }

    setName(name: string): Category {
        return new Category(this.translator, name, 
            this.id, this.idUser, 
            this.user);
    }

    toDto(): CategoryDto {
        const dto: CategoryDto = {
            name: this.name
        };

        if (this.id) dto.id = this.id;
        if (this.idUser) dto.idUser = this.idUser;

        if (this.user) dto.user = this.user.toDto();

        return dto;
    }
    toString(): string {
        return JSON.stringify(this.toDto());
    }
}
export interface CategoryDto {
    name: string;

    id?: string;
    idUser?: string;

    user?: UserDto;
}