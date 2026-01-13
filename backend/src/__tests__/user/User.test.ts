import { describe, it, expect } from "@jest/globals";
import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc";

import { User } from "../../core/user/domain/User";
import type { UserDto } from "../../core/user/domain/User";

dayjs.extend(dayjsUtc);

describe("User domain", () => {
    it("Should create a user with correct properties.", () => {
        const id = "4d511d6e-ea14-4b9b-a40b-b63231e6bb91";
        const name = "John Doe";
        const email = "emailValid1@gmail.com";
        const password = "a34319cdf06c3077003ea8b46ca04ee756b6ee91023d91924e8e4bd50c93c722";
        const createAt = new Date(2025, 8, 12);

        const user = new User(name, email, password, createAt, id);

        expect(user.id).toBe(id);
        expect(user.name).toBe(name);
        expect(user.email).toBe(email);
        expect(user.password).toBe(password);
        expect(user.createAt).toBe(createAt);
    });
    it("Should export user properties without password.", () => {
        const id = "4d511d6e-ea14-4b9b-a40b-b63231e6bb91";
        const name = "John Doe";
        const email = "emailValid1@gmail.com";
        const password = "a34319cdf06c3077003ea8b46ca04ee756b6ee91023d91924e8e4bd50c93c722";
        const createAt = new Date(2025, 8, 12);

        const user = new User(name, email, password, createAt, id);
        const dto: UserDto = user.toDto();

        expect(dto.id).toBe(id);
        expect(dto.name).toBe(name);
        expect(dto.email).toBe(email);
        expect(dto.createAt).toBe(dayjs.utc(createAt).toDate().toString());
        expect(dto.password).toBeUndefined();
    });
    it("Should export user properties with password.", () => {
        const id = "4d511d6e-ea14-4b9b-a40b-b63231e6bb91";
        const name = "John Doe";
        const email = "emailValid1@gmail.com";
        const password = "a34319cdf06c3077003ea8b46ca04ee756b6ee91023d91924e8e4bd50c93c722";
        const createAt = new Date(2025, 8, 12);

        const user = new User(name, email, password, createAt, id);
        const dto: UserDto = user.toDto(true);

        expect(dto.id).toBe(id);
        expect(dto.name).toBe(name);
        expect(dto.email).toBe(email);
        expect(dto.createAt).toBe(dayjs.utc(createAt).toDate().toString());
        expect(dto.password).toBe(password);
    });

    it("Should throw an error when creating a user with invalid email.", () => {
        const name = "John Doe";
        const password = "a34319cdf06c3077003ea8b46ca04ee756b6ee91023d91924e8e4bd50c93c722";
        const createAt = new Date(2025, 8, 12);
        
        expect(() => new User(name, "invalid-email", password, createAt)).toThrow("The 'invalid-email' is not a valid email.");
    });
    it("Should throw an error when creating a user with invalid password.", () => {
        const name = "John Doe";
        const email = "emailValid1@gmail.com";
        const createAt = new Date(2025, 8, 12);

        expect(() => new User(name, email, "invalid-password", createAt)).toThrow("The password is not valid, please check that it is in SHA256.");
    });
});