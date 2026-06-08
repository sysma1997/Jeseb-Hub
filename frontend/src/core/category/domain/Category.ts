import type { Base } from "../../shared/domain/Base";
import { User } from "../../user/domain/User";
import type { UserDto } from "../../user/domain/User";

export class Category implements Base {
    public readonly name: string;

    public readonly id?: string | undefined;
    public readonly idUser?: string | undefined;
    
    public readonly user?: User | undefined;

    constructor(name: string, 
        id?: string | undefined, 
        idUser?: string | undefined, 
        user?: User | undefined) {
        if (!name) 
            throw new Error("The name is required.");

        this.name = name;
        
        this.id = id;
        this.idUser = idUser;

        this.user = user;
    }

    static FromDto(dto: CategoryDto): Category {
        if (!dto.name) 
            throw new Error("The name is required.");

        let user: User | undefined = (dto.user) ? User.FromDto(dto.user) : undefined;
        return new Category(dto.name, 
            dto.id, dto.idUser,
            user);
    }

    setName(name: string): Category {
        return new Category(name, 
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