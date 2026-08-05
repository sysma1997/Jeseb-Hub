import { jest, beforeEach } from "@jest/globals";
import { PrismaClient } from '../../../generated/prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

jest.mock("uuid", () => ({
    v4: () => "00000000-0000-0000-0000-000000000000",
}));

const prisma = mockDeep<PrismaClient>();

beforeEach(() => {
  mockReset(prismaMock);
});

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
