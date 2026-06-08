import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { prismaMock } from "../shared/prisma/Singleton";
import bcrypt from "bcryptjs";

import { User } from "../../core/user/domain/User";
import { UserRepository } from "../../core/user/domain/UserRepository";
import { UserPrismaRepository } from "../../core/user/infrastructure/UserPrismaRepository";

jest.mock("bcryptjs", () => {
    const actualBcrypt = jest.requireActual("bcryptjs");
    return {
        ...actualBcrypt,
        hash: jest.fn().mockResolvedValue("$2b$10$jTYJBb0p31vWk5TZdsXhbedB7EA9VOd5CbvMgseg3uDVAIH9rUn6") as jest.Mock<Promise<string>>,
    };
});
jest.spyOn(bcrypt, "compare").mockResolvedValue(true);

describe("User Prisma Repository", () => {
    let repository: UserRepository;

    beforeEach(() => {
        repository = new UserPrismaRepository(prismaMock);
    });

    it("Should register a user.", async () => {
        const id = "4d511d6e-ea14-4b9b-a40b-b63231e6bb91";
        const name = "John Doe";
        const email = "emailValid1@gmail.com";
        const password = "a34319cdf06c3077003ea8b46ca04ee756b6ee91023d91924e8e4bd50c93c722";
        const createAt = new Date(2025, 8, 12);
        const hashedPassword = "$2b$10$jTYJBb0p31vWk5TZdsXhbedB7EA9VOd5CbvMgseg3uDVAIH9rUn6";

        const user = new User(name, email, password, createAt, id);

        prismaMock.user.findUnique.mockResolvedValue(null);
        prismaMock.user.create.mockResolvedValue({
            id, name, email, password: hashedPassword, createAt, 
            config: null, 
            lastUpdate: null, 
            profile: null
        });

        await expect(repository.register(user)).resolves.toBeUndefined();
        expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
            where: { email }
        })
        expect(prismaMock.user.create).toHaveBeenCalledWith({
            data: {
                id, name, email, password: hashedPassword, createAt
            },
        });
    });
    it("Should recover a user's password.", async () => {
        const id = "4d511d6e-ea14-4b9b-a40b-b63231e6bb91";
        const name = "John Doe";
        const email = "emailValid1@gmail.com";
        const newPassword = "a34319cdf06c3077003ea8b46ca04ee756b6ee91023d91924e8e4bd50c93c722";
        const createAt = new Date(2025, 8, 12);
        const hashedPassword = "$2b$10$jTYJBb0p31vWk5TZdsXhbedB7EA9VOd5CbvMgseg3uDVAIH9rUn6";

        prismaMock.user.update.mockResolvedValue({
            id, name, email, 
            password: hashedPassword, 
            createAt, 
            config: null, 
            lastUpdate: null, 
            profile: null
        });

        await expect(repository.recoverPassword(id, newPassword)).resolves.toBeUndefined();
        expect(prismaMock.user.update).toHaveBeenCalledWith({
            where: { id },
            data: { password: hashedPassword },
        });
    });

    it("Should update a user's profile.", async () => {
        const id = "4d511d6e-ea14-4b9b-a40b-b63231e6bb91";
        const name = "John Doe";
        const email = "emailValid1@gmail.com";
        const newPassword = "a34319cdf06c3077003ea8b46ca04ee756b6ee91023d91924e8e4bd50c93c722";
        const createAt = new Date(2025, 8, 12);
        const profile = "new-profile-url";

        prismaMock.user.update.mockResolvedValue({
            id, name, email, 
            password: newPassword, 
            createAt, 
            config: null, 
            lastUpdate: null, 
            profile
        });

        await expect(repository.updateProfile(id, profile)).resolves.toBeUndefined();
        expect(prismaMock.user.update).toHaveBeenCalledWith({
            where: { id },
            data: { profile },
        });
    });
    it("Should update a user's name.", async () => {
        const id = "4d511d6e-ea14-4b9b-a40b-b63231e6bb91";
        const name = "Jane Doe";
        const email = "emailValid1@gmail.com";
        const password = "a34319cdf06c3077003ea8b46ca04ee756b6ee91023d91924e8e4bd50c93c722";
        const createAt = new Date(2025, 8, 12);

        prismaMock.user.update.mockResolvedValue({
            id, name, email, password, createAt, 
            config: null, 
            lastUpdate: null, 
            profile: null
        });

        await expect(repository.updateName(id, name)).resolves.toBeUndefined();
        expect(prismaMock.user.update).toHaveBeenCalledWith({
            where: { id },
            data: expect.objectContaining({
                name
            })
        });
    });

    it("Should update a user's email.", async () => {
        const id = "4d511d6e-ea14-4b9b-a40b-b63231e6bb91";
        const name = "John Doe";
        const email = "jane@example.com";
        const password = "a34319cdf06c3077003ea8b46ca04ee756b6ee91023d91924e8e4bd50c93c722";
        const createAt = new Date(2025, 8, 12);
        const lastUpdate = new Date(2026, 1, 4);

        prismaMock.user.update.mockResolvedValue({
            id, name, email, password, createAt, 
            config: null, 
            lastUpdate: null, 
            profile: null
        });

        await expect(repository.updateEmail(id, email)).resolves.toBeUndefined();
        expect(prismaMock.user.update).toHaveBeenCalledWith({
            where: { id },
            data: expect.objectContaining({
                email
            })
        });
    });

    it("Should update a user's password.", async () => {
        const id = "4d511d6e-ea14-4b9b-a40b-b63231e6bb91";
        const name = "John Doe";
        const email = "jane@example.com";
        const createAt = new Date(2025, 8, 12);
        const currentPassword = "a34319cdf06c3077003ea8b46ca04ee756b6ee91023d91924e8e4bd50c93c722";
        const newPassword = "b64319cdf06c3077003ea8b46ca04ee756b6ee91023d91924e8e4bd50c93c999";
        const hashedPassword = "$2b$10$jTYJBb0p31vWk5TZdsXhbedB7EA9VOd5CbvMgseg3uDVAIH9rUn6";

        prismaMock.user.findUnique.mockResolvedValue({
            id, name, email, 
            password: hashedPassword, 
            createAt, 
            config: null, 
            lastUpdate: null, 
            profile: null
        });
        prismaMock.user.update.mockResolvedValue({
            id, name, email, 
            password: hashedPassword, 
            createAt, 
            config: null, 
            lastUpdate: null, 
            profile: null
        });

        await expect(repository.updatePassword(id, currentPassword, newPassword)).resolves.toBeUndefined();
        expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
            where: { id },
        });
        expect(prismaMock.user.update).toHaveBeenCalledWith({
            where: { id },
            data: expect.objectContaining({ password: hashedPassword }),
        });
    });

    it("Should login a user.", async () => {
        const id = "4d511d6e-ea14-4b9b-a40b-b63231e6bb91";
        const name = "John Doe";
        const email = "jane@example.com";
        const password = "a34319cdf06c3077003ea8b46ca04ee756b6ee91023d91924e8e4bd50c93c722";
        const createAt = new Date(2025, 8, 12);

        prismaMock.user.findUnique.mockResolvedValue({
            id, name, email, password, createAt, 
            config: null, 
            lastUpdate: null, 
            profile: null
        });

        const result = await repository.login(email, password);

        expect(result).toEqual(new User(name, email, password, createAt, id));
        expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
            where: { email },
        });
    });

    it("Should get a user by ID.", async () => {
        const id = "4d511d6e-ea14-4b9b-a40b-b63231e6bb91";
        const name = "John Doe";
        const email = "jane@example.com";
        const password = "a34319cdf06c3077003ea8b46ca04ee756b6ee91023d91924e8e4bd50c93c722";
        const createAt = new Date(2025, 8, 12);

        prismaMock.user.findUnique.mockResolvedValue({
            id, name, email, password, createAt, 
            config: null, 
            lastUpdate: null, 
            profile: null
        });

        const result = await repository.get(id);

        expect(result).toEqual(new User(name, email, password, createAt, id));
        expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
            where: { id },
        });
    });

    it("Should get a user by email.", async () => {
        const id = "4d511d6e-ea14-4b9b-a40b-b63231e6bb91";
        const name = "John Doe";
        const email = "jane@example.com";
        const password = "a34319cdf06c3077003ea8b46ca04ee756b6ee91023d91924e8e4bd50c93c722";
        const createAt = new Date(2025, 8, 12);

        prismaMock.user.findUnique.mockResolvedValue({
            id, name, email, password, createAt, 
            config: null, 
            lastUpdate: null, 
            profile: null
        });

        const result = await repository.getWithEmail(email);

        expect(result).toEqual(new User(name, email, password, createAt, id));
        expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
            where: { email },
        });
    });
});